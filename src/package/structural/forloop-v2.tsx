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

  onInit(): void {
    if (isState(this.properties.items)) {
      this.properties.items.subscribe(() => this.onArrayUpdate());
    }
    // Mevcut değerle ilk populate: subscribe sadece gelecekteki değişiklikleri
    // yakalar, bu yüzden render() çağrılmadan önce map'i dolduruyoruz.
    this.onArrayUpdate();
  }

  private genKey(item: T, index: number): string | number {
    return this.properties.keyFn ? this.properties.keyFn(item, index) : index;
  }

  private reorderManagedNodes(orderedNodes: NeolitNode[]): void {
    const mountTarget = this.getMountTarget();
    if (!mountTarget) {
      return;
    }

    Array.from(mountTarget.childNodes).forEach((child) => {
      if (
        (child instanceof HTMLElement || child instanceof Text) &&
        this.nodeKeyByDom.has(child as NeolitNode)
      ) {
        mountTarget.removeChild(child);
      }
    });

    orderedNodes.forEach((node) => {
      mountTarget.appendChild(node);
    });
  }

  onArrayUpdate(): void {
    const items = getStateValue(this.properties.items) ?? [];
    const nextNodeMap = new Map<string | number, NeolitNode>();
    const nextSnapshotMap = new Map<string | number, T>();
    const nextOrderedKeys: Array<string | number> = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const key = this.genKey(item, index);
      nextOrderedKeys.push(key);

      const existingNode = this.itemDomMapByKey.get(key);
      const node = existingNode ?? this.properties.children(item, index);

      if (!existingNode) {
        this.nodeKeyByDom.set(node, key);
      }

      nextNodeMap.set(key, node);
      nextSnapshotMap.set(key, item);
    }

    for (const [key, node] of this.itemDomMapByKey.entries()) {
      if (!nextNodeMap.has(key)) {
        this.nodeKeyByDom.delete(node);
        node.remove();
      }
    }

    this.itemDomMapByKey = nextNodeMap;
    this.itemSnapshotByKey = nextSnapshotMap;
    this.orderedKeys = nextOrderedKeys;

    const orderedNodes = nextOrderedKeys
      .map((key) => this.itemDomMapByKey.get(key))
      .filter((node): node is NeolitNode => Boolean(node));

    this.reorderManagedNodes(orderedNodes);
  }

  render(): NeolitNode[] {
    return this.orderedKeys
      .map((key) => this.itemDomMapByKey.get(key))
      .filter((node): node is NeolitNode => Boolean(node));
  }
}
