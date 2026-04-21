import { NeolitComponent, State, NeolitNode, getStateValue } from "../core";
export interface IfBlockProperties {
  children: () => NeolitNode | NeolitNode[];
  condition: State<boolean>;
  elseChildren?: () => NeolitNode | NeolitNode[];
}

export class If extends NeolitComponent {
  // condition: StateOrPlain<boolean>;
  // children: () => NeolitNode | NeolitNode[];
  elseChildren?: () => NeolitNode | NeolitNode[];

  constructor() {
    super();
    // this.children = children;
    // this.condition = condition;
    // this.elseChildren = elseChildren;
    this.watchToRerender(this.properties.condition);
  }

  render(): NeolitNode | NeolitNode[] {
    if (getStateValue(this.properties.condition)) {
      return this.properties.children?.();
    } else {
      return this.properties.elseChildren?.() ?? <></>;
    }
  }
}
