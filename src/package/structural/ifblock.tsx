import { NeolitComponent, State, NeolitNode, getStateValue } from "../core";
export interface IfBlockProperties {
  children: () => NeolitNode | NeolitNode[];
  condition: State<boolean>;
  elseChildren?: () => NeolitNode | NeolitNode[];
}

export class If extends NeolitComponent {
  elseChildren?: () => NeolitNode | NeolitNode[];

  onInit(): void {
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
