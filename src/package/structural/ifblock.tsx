import { NeolitComponent, State, NeolitNode } from "../core";

export class If extends NeolitComponent {
    condition: State<boolean>;
    children: () => NeolitNode | NeolitNode[];

    constructor({ children, condition }: { children: () => NeolitNode | NeolitNode[], condition: State<boolean> }) {
        super();
        this.children = children;
        this.condition = condition;
        this.watchToRerender(this.condition);
    }

    render(): NeolitNode | NeolitNode[]{
        if (this.condition.get()) {
            return this.children?.();
        } else {
            return <></>;
        }
    }
}