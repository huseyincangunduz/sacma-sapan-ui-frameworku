import { NeolitComponent, State, NeolitNode } from "../core";
export interface IfBlockProperties {
  children: () => NeolitNode | NeolitNode[];
  condition: State<boolean>;
  elseChildren?: () => NeolitNode | NeolitNode[];
}

export class If extends NeolitComponent {
  condition: State<boolean>;
  children: () => NeolitNode | NeolitNode[];
  elseChildren?: () => NeolitNode | NeolitNode[];

  constructor({ children, condition, elseChildren }: IfBlockProperties) {
    super();
    this.children = children;
    this.condition = condition;
    this.elseChildren = elseChildren;
    this.watchToRerender(this.condition);
  }

  render(): NeolitNode | NeolitNode[] {
    if (this.condition.get()) {
      return this.children?.();
    } else {
      return this.elseChildren?.() ?? <></>;
    }
  }
}
