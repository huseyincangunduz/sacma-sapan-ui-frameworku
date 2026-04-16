import { NeolitNode, State, StateOrPlain } from "../core";
import { For } from "./forloop";
import { If } from "./ifblock";
import { Stateful } from "./stateful";

export class FromState {
    /**
     *
     */
    private _keyFn?: (item: any) => string | number;
    private _elseChildren?: () => NeolitNode;

    constructor(private state: State<any>) {
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

            return new If({
                condition: this.state,
                children: () => renderItem(this.state.get()),
                elseChildren: this._elseChildren,
            });
        }

        fn["else"] = (elseRenderItem: () => NeolitNode) => {
            this._elseChildren = elseRenderItem;
            return fn;
        }

        return fn;
    }

    stateful<T = any>(renderItem: () => NeolitNode): () => Stateful<T> {
        return () => new Stateful({
            state: this.state,
            children: () => renderItem(),
        });
    }
}

export const fromState = (state: State<any>) => new FromState(state);