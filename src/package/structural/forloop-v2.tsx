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

  onInit(): void {
    if (isState(this.properties.items)) {
      this.properties.items.subscribe(() => this.onArrayUpdate());
    }
  }

  private genKey(item: T, index: number): string | number {
    return this.properties.keyFn ? this.properties.keyFn(item, index) : index;
  }

  onArrayUpdate(): void {
    const items = getStateValue(this.properties.items) ?? [];
    let structureChanged = false;

    // --- Upsert pass ---
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const key = this.genKey(item, index);

      if (!this.itemDomMapByKey.has(key)) {
        // Yeni item: DOM node oluştur ve cache'e al.
        const node = this.properties.children(item, index);
        this.itemDomMapByKey.set(key, node);
        this.itemSnapshotByKey.set(key, item);
        structureChanged = true;
      }
      // Var olan item: children fonksiyonu zaten reaktif state'e bağlıysa
      // yeniden render etmeye gerek yok. Bağlı değilse snapshot'ı kontrol et.
    }

    // --- Prune pass: listeden çıkarılan itemları temizle ---
    const activeKeys = new Set(
      items.map((item, index) => this.genKey(item, index)),
    );

    for (const key of this.itemDomMapByKey.keys()) {
      if (!activeKeys.has(key)) {
        const node = this.itemDomMapByKey.get(key);
        node?.remove();
        this.itemDomMapByKey.delete(key);
        this.itemSnapshotByKey.delete(key);
        structureChanged = true;
      }
    }

    if (structureChanged) {
      this.rerender();
    }
  }

  render(): NeolitNode[] {
    return Array.from(this.itemDomMapByKey.values());
  }
}
