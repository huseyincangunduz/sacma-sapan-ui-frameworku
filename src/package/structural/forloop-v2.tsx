import {
  getStateValue,
  isState,
  NeolitComponent,
  NeolitNode,
  state,
  State,
} from "../core";
import { ForProperties } from "./forloop";

export class Forv2<T> extends NeolitComponent<ForProperties<T>> {
  public properties = {
    items: state<T[]>([]),
  } as ForProperties<T>;

  /** Key → rendered DOM node cache */
  itemDomMapByKey = new Map<string | number, NeolitNode>();

  /** Key → the item value used to render the cached node */
  itemSnapshotByKey = new Map<string | number, T>();

  /** Key → item State abonelikleri (item bir State ise) */
  private itemStateListeners = new Map<
    string | number,
    { state: State<any>; listener: () => void }
  >();

  private nodeKeyByDom = new WeakMap<NeolitNode, string | number>();
  private orderedKeys: Array<string | number> = [];

  /** Key → the index the cached node was rendered with */
  private itemIndexByKey = new Map<string | number, number>();

  // Liste, mount target içindeki diğer kardeş elemanların arasında kalabilsin diye konumu bu boş text node tutuyor.
  private anchorNode: NeolitNode = document.createTextNode("");

  private itemsListener?: () => void;

  onInit(): void {
    if (isState(this.properties.items)) {
      this.itemsListener = () => this.onArrayUpdate();
      this.properties.items.subscribe(this.itemsListener);
    }
    // Mevcut değerle ilk populate: subscribe sadece gelecekteki değişiklikleri
    // yakalıyor, bu yüzden render() çağrılmadan önce map'i dolduruyoruz.
    this.onArrayUpdate();
  }

  destroy(): void {
    if (this.itemsListener && isState(this.properties.items)) {
      this.properties.items.unsubscribe(this.itemsListener);
      this.itemsListener = undefined;
    }
    for (const key of [...this.itemStateListeners.keys()]) {
      this.unwatchItemState(key);
    }
    super.destroy();
  }

  private watchItemState(key: string | number, item: T): void {
    if (!isState(item)) return;
    const existing = this.itemStateListeners.get(key);
    if (existing?.state === item) return;
    this.unwatchItemState(key);
    const listener = () => this.rerenderItem(key);
    (item as State<any>).subscribe(listener);
    this.itemStateListeners.set(key, { state: item as State<any>, listener });
  }

  private unwatchItemState(key: string | number): void {
    const entry = this.itemStateListeners.get(key);
    if (!entry) return;
    entry.state.unsubscribe(entry.listener);
    this.itemStateListeners.delete(key);
  }

  /** İtem State'i güncellendiğinde sadece o satırı yeniden çiziyoruz. */
  private rerenderItem(key: string | number): void {
    const oldNode = this.itemDomMapByKey.get(key);
    const index = this.itemIndexByKey.get(key);
    const item = this.itemSnapshotByKey.get(key);
    if (!oldNode || index === undefined || item === undefined) return;

    this.nodeKeyByDom.delete(oldNode);
    const node = this.properties.children(item, index);
    this.nodeKeyByDom.set(node, key);
    this.itemDomMapByKey.set(key, node);

    const mountTarget = this.getMountTarget();
    if (mountTarget && oldNode.parentNode === mountTarget) {
      mountTarget.replaceChild(node, oldNode);
    } else {
      oldNode.remove();
      this.reorderManagedNodes(this.getOrderedNodes());
    }
  }

  private genKey(item: T, index: number): string | number {
    return this.properties.keyFn ? this.properties.keyFn(item, index) : index;
  }

  private isItemChanged(
    nextItem: T,
    previousItem: T | undefined,
    index: number,
  ): boolean {
    if (previousItem === undefined) {
      return true;
    }

    if (this.properties.compareItems) {
      return !this.properties.compareItems(nextItem, previousItem, index);
    }

    // Objelerin içine bakmıyoruz: referans aynıysa değişmemiş sayılır.
    // İçerik reaktifliği için item'ı State olarak verin, aboneliği biz kuruyoruz.
    return !Object.is(nextItem, previousItem);
  }

  private reorderManagedNodes(orderedNodes: NeolitNode[]): void {
    const mountTarget = this.getMountTarget();
    if (!mountTarget || this.anchorNode.parentNode !== mountTarget) {
      return;
    }

    // Anchor'dan sonra, sırası bozulan node'ları tek tek taşıyoruz; böylece
    // liste hem kardeş elemanlar arasındaki yerini hem de dokunulmayan
    // node'ların DOM kimliğini (focus, scroll vb.) koruyor.
    let reference: Node = this.anchorNode;
    orderedNodes.forEach((node) => {
      if (node.parentNode !== mountTarget || reference.nextSibling !== node) {
        mountTarget.insertBefore(node, reference.nextSibling);
      }
      reference = node;
    });
  }

  onArrayUpdate(): void {
    const items = getStateValue(this.properties.items) ?? [];
    const nextNodeMap = new Map<string | number, NeolitNode>();
    const nextSnapshotMap = new Map<string | number, T>();
    const nextIndexMap = new Map<string | number, number>();
    const nextOrderedKeys: Array<string | number> = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const key = this.genKey(item, index);
      nextOrderedKeys.push(key);

      const existingNode = this.itemDomMapByKey.get(key);
      // Render fonksiyonu index'i de kullanabildiği için index değişimi de değişiklik sayılıyor.
      const itemChanged =
        !existingNode ||
        this.itemIndexByKey.get(key) !== index ||
        this.isItemChanged(item, this.itemSnapshotByKey.get(key), index);

      let node: NeolitNode;
      if (existingNode && !itemChanged) {
        node = existingNode;
      } else {
        if (existingNode) {
          this.nodeKeyByDom.delete(existingNode);
          existingNode.remove();
        }
        node = this.properties.children(item, index);
        this.nodeKeyByDom.set(node, key);
      }

      this.watchItemState(key, item);

      nextNodeMap.set(key, node);
      nextSnapshotMap.set(key, item);
      nextIndexMap.set(key, index);
    }

    for (const [key, node] of this.itemDomMapByKey.entries()) {
      if (!nextNodeMap.has(key)) {
        this.nodeKeyByDom.delete(node);
        this.unwatchItemState(key);
        node.remove();
      }
    }

    this.itemDomMapByKey = nextNodeMap;
    this.itemSnapshotByKey = nextSnapshotMap;
    this.itemIndexByKey = nextIndexMap;
    this.orderedKeys = nextOrderedKeys;

    this.reorderManagedNodes(this.getOrderedNodes());
  }

  private getOrderedNodes(): NeolitNode[] {
    return this.orderedKeys
      .map((key) => this.itemDomMapByKey.get(key))
      .filter((node): node is NeolitNode => Boolean(node));
  }

  render(): NeolitNode[] {
    return [this.anchorNode, ...this.getOrderedNodes()];
  }
}
