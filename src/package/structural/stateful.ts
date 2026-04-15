import { NeolitComponent, NeolitNode, State } from "../core";

/**
 * Stateful component rerenders its children whenever the given condition state changes. 
 * This allows for more granular control over rendering, as only the children of this component will 
 * be re-rendered when the condition changes, rather than the entire component tree.
 */
export class Stateful<T> extends NeolitComponent {
    state: State<T>;
    children: () => NeolitNode | NeolitNode[];

    constructor({ children, state: state }: { children: () => NeolitNode | NeolitNode[], state: State<T> }) {
        super();
        this.children = children;
        this.state = state;
        // this.condition = new State(true);
        this.watchToRerender(this.state);
    }

    render(): NeolitNode | NeolitNode[] {
        // TODO: Burada child'i direkt render edecek. her condition state'i güncellendiğinde içerisindeki child render edilecek. bu sayede condition state'i güncellendiğinde sadece child render edilecek, tüm component değil.
        return this.children?.();

    }
}