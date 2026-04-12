import { NeolitNode } from "./neolit-node";
import { State } from "./state";

export abstract class NeolitComponent {
    static isNeolitComponent = true;
    static componentInstances = new Map<string, NeolitComponent>();
    private _mountTarget: HTMLElement | null = null;
    private _currentElement: NeolitNode | null = null;
    private _unsubscribers: Array<() => void> = [];
    private key: string;

    constructor(_properties?: Record<string, any>, key?: string) {
        this.key = key ?? Math.random().toString(36).substring(2, 9);
        NeolitComponent.componentInstances.set(this.key, this);
        console.log("NeolitComponent created");
    }

    abstract render(): NeolitNode;

    watchToRerender<T>(state: State<T>): void {
        const listener = () => this._rerender();
        state.subscribe(listener);
        this._unsubscribers.push(() => state.unsubscribe(listener));
    }

    temporaryDestroy(): void {
        if (this._mountTarget) {
            this._mountTarget.removeChild(this._currentElement!);
        }
    }

    destroy(): void {
        this._unsubscribers.forEach(unsubscribe => unsubscribe());
        this._unsubscribers = [];

        if (this._mountTarget) {
            this._mountTarget.removeAttribute("data-neolit-mounted");
            this._mountTarget.removeAttribute("data-neolit-key");
        }
        NeolitComponent.componentInstances.delete(this.key);
    }

    mount(target: HTMLElement, initialElement?: NeolitNode): NeolitNode {
        this._mountTarget = target;
        target.attributes.setNamedItem(document.createAttribute("data-neolit-mounted"));
        target.setAttribute("data-neolit-key", this.key);

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

    public rerender(): void {
        this._rerender();
    }

    
}

