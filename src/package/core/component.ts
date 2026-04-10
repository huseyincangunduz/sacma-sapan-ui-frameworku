import { NeolitNode } from "./neolit-node";
import { State } from "./state";

export class NeolitStateHolder {
    // stateKey ve state değerlerini tutan bir Map. parent tekrar renderlandığında state'ler'in korunması için saklanacak.
    static stateMap = new Map<string, State<any>[]>();
}

export abstract class NeolitComponent {
    private _mountTarget: HTMLElement | null = null;
    private _currentElement: NeolitNode | null = null;
    private watchedStateNames : string[] = [];
    constructor() {
        console.log("NeolitComponent created");
    }

    abstract render(): NeolitNode;

    watch<T>(name: string, state: State<T>): void {
        state.subscribe(() => this._rerender());
        this.watchedStateNames.push(name);
    }

    mount(target: HTMLElement, initialElement?: NeolitNode): NeolitNode {
        this._mountTarget = target;
        this._currentElement = initialElement ?? this.render();

        if (!target.contains(this._currentElement)) {
            target.appendChild(this._currentElement);
        }

        return this._currentElement;
    }

    private _rerender(): void {
        if (!this._mountTarget || !this._currentElement) return;
        const newElement = this.render();
        this._mountTarget.replaceChild(newElement, this._currentElement);
        this._currentElement = newElement;
    }

    pushStateIntoHolder() {
        

        for (let index = 0; index < this.watchedStateNames.length; index++) {
            const name = this.watchedStateNames[index];
            
        }
    }
}

