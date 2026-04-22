import { getStateValue, NeolitComponent, NeolitNode, State } from "../core";
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
      return NeolitComponent.constructInitialize(For<T>, {
        items: this.state,
        keyFn: this._keyFn,
        children: (item, index) => renderItem(item as T, index),
      }) as For<T>;
    };
  }

  renderIf<T = any>(
    renderItem: (stateValue: T) => NeolitNode,
  ): (() => If) & { else: (elseRenderItem: () => NeolitNode) => () => If } {
    const fn = () => {
      return NeolitComponent.constructInitialize(If, {
        condition: this.state as State<boolean>,
        children: () => renderItem(getStateValue(this.state)),
        elseChildren: this._elseChildren,
      }) as If;
    };

    fn["else"] = (elseRenderItem: () => NeolitNode) => {
      this._elseChildren = elseRenderItem;
      return fn;
    };

    return fn;
  }

  stateful<T = any>(renderItem: (data: T) => NeolitNode): () => Stateful<T> {
    return () => {
      return NeolitComponent.constructInitialize(Stateful<T>, {
        state: this.state,
        children: (data: T) => renderItem(data),
      }) as Stateful<T>;
    };
  }
}

export const fromState = <T>(state: State<T>) => new FromState(state);
