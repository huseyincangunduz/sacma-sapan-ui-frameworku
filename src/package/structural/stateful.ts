import { getStateValue, isState, NeolitComponent, NeolitNode, State, StateOrPlain } from "../core";

/**
 * Stateful component rerenders its children whenever the given condition state changes. 
 * This allows for more granular control over rendering, as only the children of this component will 
 * be re-rendered when the condition changes, rather than the entire component tree.
 */
export class Stateful<T> extends NeolitComponent {
    state: StateOrPlain<T>;
    children: (data:T) => NeolitNode | NeolitNode[];

    constructor({ children, state: state }: { children: (data:T) => NeolitNode | NeolitNode[], state: StateOrPlain<T> }) {
        super();
        this.children = children;
        this.state = state;
        // this.condition = new State(true);
        if (isState(state)) {
            this.watchToRerender(this.state as State<T>);
        }
    }

    render(): NeolitNode | NeolitNode[] {
        // TODO: Burada child'i direkt render edecek. her condition state'i güncellendiğinde içerisindeki child render edilecek. bu sayede condition state'i güncellendiğinde sadece child render edilecek, tüm component değil.
        return this.children?.(getStateValue(this.state));

    }
}