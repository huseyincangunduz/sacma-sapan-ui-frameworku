import {
  getStateValue,
  isState,
  NeolitComponent,
  NeolitNode,
  state,
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
    super.destroy();
  }

  private genKey(item: T, index: number): string | number {
    return this.properties.keyFn ? this.properties.keyFn(item, index) : index;
  }

  // Item'lar yerinde mutasyona uğrayabildiği için karşılaştırma amaçlı sığ bir kopya saklıyoruz.
  private snapshotItem(item: T): T {
    if (item && typeof item === "object") {
      return (
        Array.isArray(item) ? [...(item as any[])] : { ...(item as any) }
      ) as T;
    }
    return item;
  }

  private isItemChanged(
    nextItem: T,
    previousSnapshot: T | undefined,
    index: number,
  ): boolean {
    if (previousSnapshot === undefined) {
      return true;
    }

    if (this.properties.compareItems) {
      return !this.properties.compareItems(nextItem, previousSnapshot, index);
    }

    if (
      nextItem &&
      previousSnapshot &&
      typeof nextItem === "object" &&
      typeof previousSnapshot === "object"
    ) {
      const next = nextItem as Record<string, unknown>;
      const previous = previousSnapshot as Record<string, unknown>;
      const nextKeys = Object.keys(next);
      if (nextKeys.length !== Object.keys(previous).length) {
        return true;
      }
      return nextKeys.some((key) => !Object.is(next[key], previous[key]));
    }

    return !Object.is(nextItem, previousSnapshot);
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

      nextNodeMap.set(key, node);
      nextSnapshotMap.set(key, this.snapshotItem(item));
      nextIndexMap.set(key, index);
    }

    for (const [key, node] of this.itemDomMapByKey.entries()) {
      if (!nextNodeMap.has(key)) {
        this.nodeKeyByDom.delete(node);
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
