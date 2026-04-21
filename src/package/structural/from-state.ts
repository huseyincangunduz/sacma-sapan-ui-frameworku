import { getStateValue, NeolitNode, State } from "../core";
import { For } from "./forloop";
import { If } from "./ifblock";
import { Stateful } from "./stateful";

export class FromState {
  /**
   *
   */
  private _keyFn?: (item: any) => string | number;
  private _elseChildren?: () => NeolitNode = () => document.createTextNode("");
  state: State<any>;

  constructor(_state: State<any>) {
    this.state = _state;
  }

  keyFn(keyFn: (item: any) => string | number) {
    this._keyFn = keyFn;
    return this;
  }

  renderFor<T = any>(
    renderItem: (item: T, index: number) => NeolitNode,
  ): () => For<T> {
    return () => {
      const forComp = new For();
      forComp.assignProperties({
        items: this.state,
        keyFn: this._keyFn,
        children: (item, index) => renderItem(item as T, index),
      });

      return forComp;
    };
  }

  renderIf<T = any>(
    renderItem: (stateValue: T) => NeolitNode,
  ): (() => If) & { else: (elseRenderItem: () => NeolitNode) => () => If } {
    const fn = () => {
      const ifComp = new If();
      ifComp.properties.condition = this.state as State<boolean>;
      ifComp.properties.children = () => renderItem(getStateValue(this.state));
      ifComp.properties.elseChildren = this._elseChildren;
      return ifComp;
    };

    fn["else"] = (elseRenderItem: () => NeolitNode) => {
      this._elseChildren = elseRenderItem;
      return fn;
    };

    return fn;
  }

  stateful<T = any>(renderItem: (data: T) => NeolitNode): () => Stateful<T> {
    return () => {
      const statefulComp = new Stateful<T>();
      statefulComp.assignProperties({
        state: this.state,
        children: () => renderItem(getStateValue(this.state)),
      });
      return statefulComp;
    };
  }
}

export const fromState = <T>(state: State<T>) => new FromState(state);
