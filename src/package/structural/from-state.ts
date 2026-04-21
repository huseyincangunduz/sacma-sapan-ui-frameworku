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


    renderFor<T = any>(renderItem: (item: T, index: number) => NeolitNode): () => For<T> {
        return () => new For({
            items: this.state,
            keyFn: this._keyFn,
            children: (item, index) => renderItem(item, index),
        });
    }

    renderIf<T = any>(renderItem: (stateValue: T) => NeolitNode,): (() => If) & { else: (elseRenderItem: () => NeolitNode) => (() => If) } {

        const fn = () => {

            const ifComp = new If();
            ifComp.properties.condition = this.state as State<boolean>;
            ifComp.properties.children = () => renderItem(getStateValue(this.state));
            ifComp.properties.elseChildren = this._elseChildren;
            return ifComp;
        }

        fn["else"] = (elseRenderItem: () => NeolitNode) => {
            this._elseChildren = elseRenderItem;
            return fn;
        }

        return fn;
    }

    stateful<T = any>(renderItem: (data: T) => NeolitNode): () => Stateful<T> {
        return () => new Stateful({
            state: this.state,
            children: (data: T) => renderItem(data),
        });
    }
}

export const fromState = <T>(state: State<T>) => new FromState(state);