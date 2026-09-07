import { State, StateOptions } from "./state";

/**
 * Array'i yerinde mutasyona uğratmak yerine her işlemde yeni referans üreten liste state'i.
 * Böylece For/Forv2 gibi tüketiciler derin karşılaştırma yapmadan, sadece kimlik
 * kıyasıyla hangi item'ın değiştiğini anlayabiliyor. push/pop ile stack olarak da kullanılır.
 */
export class ListState<T> extends State<T[]> {
  constructor(initialData: T[] = [], options?: StateOptions) {
    super([...initialData], options);
  }

  get length(): number {
    return this.get().length;
  }

  at(index: number): T | undefined {
    const items = this.get();
    return items[index < 0 ? items.length + index : index];
  }

  peek(): T | undefined {
    return this.at(-1);
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  indexOf(item: T): number {
    return this.get().indexOf(item);
  }

  private mutate(mutator: (draft: T[]) => void): void {
    const draft = [...this.get()];
    mutator(draft);
    this.set(draft);
  }

  push(...items: T[]): void {
    this.mutate((draft) => draft.push(...items));
  }

  pop(): T | undefined {
    const last = this.peek();
    this.mutate((draft) => draft.pop());
    return last;
  }

  unshift(...items: T[]): void {
    this.mutate((draft) => draft.unshift(...items));
  }

  shift(): T | undefined {
    const first = this.at(0);
    this.mutate((draft) => draft.shift());
    return first;
  }

  insertAt(index: number, ...items: T[]): void {
    this.mutate((draft) => draft.splice(index, 0, ...items));
  }

  removeAt(index: number): T | undefined {
    const removed = this.at(index);
    this.mutate((draft) => draft.splice(index, 1));
    return removed;
  }

  remove(item: T): boolean {
    const index = this.indexOf(item);
    if (index === -1) return false;
    this.removeAt(index);
    return true;
  }

  removeWhere(predicate: (item: T, index: number) => boolean): void {
    this.set(this.get().filter((item, index) => !predicate(item, index)));
  }

  replaceAt(index: number, item: T): void {
    this.mutate((draft) => {
      draft[index] = item;
    });
  }

  move(fromIndex: number, toIndex: number): void {
    this.mutate((draft) => {
      const [moved] = draft.splice(fromIndex, 1);
      draft.splice(toIndex, 0, moved);
    });
  }

  clear(): void {
    this.set([]);
  }
}

export function listState<T>(
  initialData: T[] = [],
  options?: StateOptions,
): ListState<T> {
  return new ListState<T>(initialData, options);
}
