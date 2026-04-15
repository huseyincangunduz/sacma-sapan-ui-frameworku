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

    mount(target: HTMLElement, initialElement?: NeolitNode | NeolitNode[]): NeolitNode | NeolitNode[] | null {

        this._mountTarget = target;
        target.attributes.setNamedItem(document.createAttribute("data-neolit-mounted"));
        target.setAttribute("data-neolit-key", this.key);

        const currentEls = initialElement ?? this.render();

        // Eğer initialElement sağlanmışsa ve sonradan render edilen elementin tipi initialElement ile uyuşmuyorsa, bu durumun render işlemi üzerinde sorunlara yol açabileceği konusunda bir uyarı verelim.
        if (this._currentElement != null && typeof initialElement !== typeof currentEls) {
            console.error("NEOLIT : Initial element type does not match rendered element type. This may cause issues with rendering. Please ensure that the initial element and rendered element are of the same type (either both should be NeolitNode or both should be NeolitNode[]).");
        }
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
            if (newElement === null) {
                this._mountTarget.removeChild(this._currentElement as Node);
            } else {
                this._mountTarget.replaceChild(newElement as Node, this._currentElement as Node);
            }
        }
        this._currentElement = newElement;
    }

    public rerender(): void {
        this._rerender();
    }


}

