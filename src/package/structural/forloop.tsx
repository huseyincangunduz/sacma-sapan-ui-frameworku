import {
  getStateValue,
  isState,
  isTheyEqual,
  NeolitComponent,
  NeolitNode,
  state,
  State,
  StateOrPlain,
} from "../core";
import { Stateful } from "./stateful";

export interface ForProperties<T> {
  items: StateOrPlain<T[]>;
  /**
   * Alias for renderItem, to be used in jsx as <For items={items}>{(item) => <div>{item}</div>}</For>
   * @param item
   * @param index
   * @returns
   */
  children: (item: T, index: number) => NeolitNode;
  keyFn?: (item: T, index: number) => string | number;
  compareItems?: (nextItem: T, previousItem: T, index: number) => boolean;
  strictKeys?: boolean;
}

/**
 * For component renders a list of items based on the given array state.
 * It takes an array state and a renderItem function as props, and renders the list of items accordingly.
 * Whenever the array state changes, the component will re-render to reflect the updated list.
 *
 * Quick usage notes:
 * - Prefer providing keyFn for stable identity and safe cache reuse across reorder/insert/remove.
 * - If keyFn is omitted, index fallback is used; this is safe but less optimal for structural list updates.
 * - strictKeys=true throws on duplicate keys. strictKeys=false only warns in console.
 * - compareItems can be provided when items are mutable objects and custom equality is needed.
 */
export class For<T> extends NeolitComponent<ForProperties<T>> {
  public properties = {
    items: state<T[]>([], { notifyIncomingWhenSetState: true, subscribeIncomingWhenSetState: true }),
  } as ForProperties<T>;
  previousItems: T[] = [];
  // items: State<T[]>;
  // renderItem: (item: T, index: number) => NeolitNode;
  // keyFn?: (item: T, index: number) => string | number;
  // compareItems?: (nextItem: T, previousItem: T, index: number) => boolean;
  // strictKeys: boolean;
  itemIndexCache: Map<string | number, NeolitNode> = new Map();
  private didWarnIndexFallback = false;

  onInit(): void {
    this.previousItems = [...getStateValue(this.properties.items || [])];
    this.warnIndexFallbackOnce();
    if (isState(this.properties.items)) {
      this.properties.items.subscribe(() => this.onArrayUpdate());
    }
  }

  private warnIndexFallbackOnce(): void {
    if (this.properties.keyFn || this.didWarnIndexFallback) return;

    console.warn(
      "[For] keyFn missing: index fallback is used and may cause identity/state drift on insert/remove/reorder.",
    );
    this.didWarnIndexFallback = true;
  }

  private getItemKey(item: T, index: number): string | number {
    return this.properties.keyFn ? this.properties.keyFn(item, index) : index;
  }

  private getDuplicateKeys(items: T[]): Array<string | number> {
    if (!this.properties.keyFn) return [];

    const seen = new Set<string | number>();
    const duplicates = new Set<string | number>();

    for (let index = 0; index < items.length; index++) {
      const key = this.properties.keyFn(items[index], index);
      if (seen.has(key)) {
        duplicates.add(key);
        continue;
      }
      seen.add(key);
    }

    return [...duplicates];
  }

  private isObjectLike(value: unknown): boolean {
    return typeof value === "object" && value !== null;
  }

  private areItemsEqual(nextItem: T, previousItem: T, index: number): boolean {
    if (this.properties.compareItems) {
      return this.properties.compareItems(nextItem, previousItem, index);
    }

    // Without a custom comparator, object-like items are treated as mutable and force rerender safety.
    if (this.isObjectLike(nextItem) || this.isObjectLike(previousItem)) {
      return false;
    }

    return isTheyEqual(nextItem, previousItem);
  }

  private pruneCache(newItems: T[]): void {
    const activeKeys = new Set(
      newItems.map((item, index) => this.getItemKey(item, index)),
    );

    for (const key of this.itemIndexCache.keys()) {
      if (!activeKeys.has(key)) {
        this.itemIndexCache.delete(key);
      }
    }
  }

  private invalidateChangedCacheEntries(newItems: T[]): void {
    if (!this.properties.keyFn) {
      // Index-based keys are unstable for reorder; force fresh item render.
      this.itemIndexCache.clear();
      return;
    }

    const oldItemsByKey = new Map<string | number, T>();
    this.previousItems.forEach((item, index) => {
      oldItemsByKey.set(this.properties.keyFn!(item, index), item);
    });

    newItems.forEach((item, index) => {
      const key = this.properties.keyFn!(item, index);
      const previousItem = oldItemsByKey.get(key);
      if (
        previousItem !== undefined &&
        !this.areItemsEqual(item, previousItem, index)
      ) {
        this.itemIndexCache.delete(key);
      }
    });
  }

  private shouldSkipRerender(newItems: T[]): boolean {
    if (newItems.length !== this.previousItems.length) {
      return false;
    }

    if (!this.properties.keyFn) {
      return newItems.every((item, index) =>
        this.areItemsEqual(item, this.previousItems[index], index),
      );
    }

    const oldItemsByKey = new Map<string | number, T>();
    this.previousItems.forEach((item, index) => {
      oldItemsByKey.set(this.properties.keyFn!(item, index), item);
    });

    return newItems.every((item, index) => {
      const key = this.properties.keyFn!(item, index);
      const previousItemAtIndex = this.previousItems[index];
      const previousKeyAtIndex = this.properties.keyFn!(
        previousItemAtIndex,
        index,
      );

      if (!oldItemsByKey.has(key)) {
        return false;
      }

      if (previousKeyAtIndex !== key) {
        return false;
      }

      return this.areItemsEqual(item, oldItemsByKey.get(key)!, index);
    });
  }

  onArrayUpdate() {
    const newItems = getStateValue(this.properties.items);
    this.pruneCache(newItems);

    const duplicateKeys = this.getDuplicateKeys(newItems);
    if (duplicateKeys.length > 0) {
      const duplicateMessage = `[For] duplicate keys detected: ${duplicateKeys.join(", ")}. Identity matching may be unstable.`;
      if (this.properties.strictKeys) {
        throw new Error(duplicateMessage);
      }
      console.warn(duplicateMessage);
    }

    if (this.shouldSkipRerender(newItems)) {
      this.previousItems = [...newItems];
      return;
    }

    this.invalidateChangedCacheEntries(newItems);
    this.rerender();
    this.previousItems = [...newItems];
  }

  cacheAndResultSelf(item: T, index: number): NeolitNode {
    const key = this.getItemKey(item, index);
    if (this.itemIndexCache.has(key)) {
      return this.itemIndexCache.get(key)!;
    }
    const renderedItem = this.properties.children(item, index);
    this.itemIndexCache.set(key, renderedItem);
    return renderedItem;
  }

  render(): NeolitNode[] {
    // Versayılan olarak State ve eğer normal obje gelirse state içine setlenecek.
    //
    return (this.properties.items as State<T[]>)
      .get()
      .map((item, index) =>
        isState(item) ? (
          <Stateful state={item}>
            {() => this.cacheAndResultSelf(getStateValue<T>(item), index)}
          </Stateful>
        ) : (
          this.cacheAndResultSelf(getStateValue<T>(item), index)
        ),
      );
  }
}
