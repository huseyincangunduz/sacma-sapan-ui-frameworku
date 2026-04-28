import { computed, getStateValue, isState, NeolitComponent, NeolitNode, state, State } from "../core";
import { ForProperties } from "./forloop";
import { If } from "./ifblock";
import { Stateful } from "./stateful";


export class Forv2<T> extends NeolitComponent<ForProperties<T>> {
    public properties = {
        items: state<T[]>([]),
    } as ForProperties<T>

    itemStateMapByKey = new Map<string | number, State<T>>()

    onInit(): void {
        if (isState(this.properties.items)) {
            this.properties.items.subscribe(() => this.onArrayUpdate());
        }
    }

    genKey(item: T, index: number): string | number {
        if (this.properties.keyFn) {
            return this.properties.keyFn(item, index);
        }
        return index;
    }

    onArrayUpdate(): void {
        // if (this.properties.keyFn == null) {
        //     this.rerender();
        //     return;
        // }
        let newInsertion = false;
        const items = getStateValue(this.properties.items) || [];
        debugger
        for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const key = this.genKey(item, index);
            if (!this.itemStateMapByKey.has(key)) {
                const newAddedState = state(item);
                newAddedState.subscribe(() => alert("state changed for key: " + key));
                this.itemStateMapByKey.set(key, newAddedState);

                newInsertion = true;
            } else {
                const itemState = this.itemStateMapByKey.get(key)!;
                itemState.set(item);
            }
        }

        if (items.length != this.itemStateMapByKey.size) {
         // Eğer yeni itemlerle itemStateMapByKey arasında boyut farkı varsa, olmayan anahtar ya da indisler için state değerlerini null olarak setleyeceğiz ki render sırasında bunları kontrol edip gereksiz itemState'leri temizleyelim.
            this.itemStateMapByKey.forEach((_, key) => {
                const exists = items.some((item, index) => this.genKey(item, index) === key);
                if (!exists) {
                    this.itemStateMapByKey.get(key)?.set(null as any);
                }
            });
        }

        if (newInsertion) {
            this.rerender();
        }
    }


    render(): NeolitNode | NeolitNode[] | NeolitComponent | null {
        const values = Array.from(this.itemStateMapByKey.values() || []);
        return values.map((itemState, index) => {
            // return <div>{itemState}</div>
            return <If state={itemState}>{() => this.properties.children?.(itemState.get(), index)}</If>;
        });
    }
}