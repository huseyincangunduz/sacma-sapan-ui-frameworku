import { NeolitNode } from "./neolit-node";
import { State } from "./state";

export abstract class NeolitComponent {
    static isNeolitComponent = true;
    static componentInstances = new Map<string, NeolitComponent>();
    private _mountTarget: HTMLElement | null = null;
    private _currentElement: NeolitNode[] | NeolitNode | null = null;
    private _unsubscribers: Array<() => void> = [];
    private key: string;

    constructor(_properties?: Record<string, any>, key?: string) {
        this.key = key ?? Math.random().toString(36).substring(2, 9);
        NeolitComponent.componentInstances.set(this.key, this);
        console.log("NeolitComponent created");
    }

    abstract render(): NeolitNode | NeolitNode[];

    watchToRerender<T>(state: State<T>): void {
        const listener = () => this._rerender();
        state.subscribe(listener);
        this._unsubscribers.push(() => state.unsubscribe(listener));
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

    mount(target: HTMLElement, initialElement?: NeolitNode): NeolitNode | NeolitNode[] {
        this._mountTarget = target;
        target.attributes.setNamedItem(document.createAttribute("data-neolit-mounted"));
        target.setAttribute("data-neolit-key", this.key);

        const currentEls = initialElement ?? this.render();
        this._currentElement = currentEls;

        if (!Array.isArray(this._currentElement)) {

            if (!target.contains(this._currentElement as Node)) {
                target.appendChild(this._currentElement as Node);
            }
            return this._currentElement;
        }

        (this._currentElement as NeolitNode[]).forEach(el => {
            if (!target.contains(el)) {
                target.appendChild(el);
            }
        });


        return this._currentElement;
    }

    private _rerender(): void {
        if (!this._mountTarget || !this._currentElement) return;
        const newElement = this.render();

        if (Array.isArray(this._currentElement)) {
            this._currentElement.forEach(el => {
                if (el.parentNode === this._mountTarget) {
                    this._mountTarget!.removeChild(el);
                }
            });

            (newElement as NeolitNode[]).forEach(el => {
                if (!this._mountTarget!.contains(el)) {
                    this._mountTarget!.appendChild(el);
                }
            });
          
        } else {
            this._mountTarget.replaceChild(newElement as Node, this._currentElement as Node);
        }
        this._currentElement = newElement;
    }

    public rerender(): void {
        this._rerender();
    }


}

