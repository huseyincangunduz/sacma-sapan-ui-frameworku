import {
  getStateValue,
  isState,
  NeolitComponent,
  NeolitNode,
  state,
  State,
  StateOrPlain,
} from "../core";

export interface StatefulProperties<T> {
  state: StateOrPlain<T>;
  children: (data: T) => NeolitNode | NeolitNode[];
}
/**
 * Stateful component rerenders its children whenever the given condition state changes.
 * This allows for more granular control over rendering, as only the children of this component will
 * be re-rendered when the condition changes, rather than the entire component tree.
 */
export class Stateful<T> extends NeolitComponent<StatefulProperties<T>> {
  public properties = {
    state: state<T>(null as T),
    children: () =>
      document.createComment("Stateful children") as unknown as NeolitNode,
  } as StatefulProperties<T>;

  onInit(): void {
    if (isState(this.properties.state)) {
      this.watchToRerender(this.properties.state as State<T>);
    }
  }

  render(): NeolitNode | NeolitNode[] {
    // TODO: Burada child'i direkt render edecek. her condition state'i güncellendiğinde içerisindeki child render edilecek. bu sayede condition state'i güncellendiğinde sadece child render edilecek, tüm component değil.
    return this.properties.children?.(getStateValue(this.properties.state));
  }
}
