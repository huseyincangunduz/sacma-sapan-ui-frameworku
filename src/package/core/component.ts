import { NeolitNode } from "./neolit-node";
import { isState, State, StateOrPlain } from "./state";

export abstract class NeolitComponent<PROPERTIES = Record<string, any>> {
    static isNeolitComponent = true;
    static componentInstances = new Map<string, NeolitComponent>();
    private _mountTarget: HTMLElement | null = null;
    private _currentElement: NeolitNode[] | NeolitNode | null = null;
    private _unsubscribers: Array<() => void> = [];
    private key: string;
    public properties: Partial<PROPERTIES> = {};
    // public abstract initialProperties?: Partial<PROPERTIES>;

    // Property'ler sonra uygulanıyor, böylece component instance'ı oluşturulduktan sonra props'lara erişilebilir oluyor. Bu sayede onInit gibi lifecycle metodlarında props'lara erişim sağlanabilir.
    constructor(properties?: any, key?: string) {
        properties;
        // propertyler sonradan atanıyor ama jsx tagte alıyor propsları o yüzden kızıyor. Eğer kullanmazsam da eslint hata veriyor
        this.key = key ?? Math.random().toString(36).substring(2, 9);
        NeolitComponent.componentInstances.set(this.key, this);
        console.info(this.properties);
    }

    assignProperties(newProperties: Partial<PROPERTIES>): void {
        // if (this.initialProperties) {
        //     this.properties = this.initialProperties;
        // }
        if (newProperties) {
            Object.entries(newProperties).forEach(([propKey, propValue]) => {
                const key = propKey as keyof PROPERTIES;
                if (propValue === undefined) {
                    return;
                }

                if (typeof this.properties[key] === "object" && this.properties[key] instanceof State) {
                    (this.properties[key] as State<typeof propValue>).set(propValue, { notifyIncoming: true, subscribeIncoming: true });
                } else {
                    this.properties[key] = propValue as any;
                }
            });
        }
    }

    onInit?(): void;

    abstract render(): NeolitNode | NeolitNode[] | NeolitComponent | null;

    watchToRerender<T>(state: StateOrPlain<T>): void {
        if (!isState(state)) return;
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

    mount(target: HTMLElement): NeolitNode | NeolitNode[] | null {

        this._mountTarget = target;
        target.attributes.setNamedItem(document.createAttribute("data-neolit-mounted"));
        target.setAttribute("data-neolit-key", this.key);

        let currentEls = this.render();

        // Eğer currentEls bir NeolitComponent ise, componentInstance'ın render metodunu çağırarak gerçek elementleri elde edelim.
        while (currentEls && currentEls instanceof NeolitComponent) {
            currentEls = currentEls.render();
        }
        // Eğer initialElement sağlanmışsa ve sonradan render edilen elementin tipi initialElement ile uyuşmuyorsa, bu durumun render işlemi üzerinde sorunlara yol açabileceği konusunda bir uyarı verelim.
        if (this._currentElement != null && typeof currentEls !== typeof this._currentElement) {
            console.error("NEOLIT : Initial element type does not match rendered element type. This may cause issues with rendering. Please ensure that the initial element and rendered element are of the same type (either both should be NeolitNode or both should be NeolitNode[]).");
        }
        if (this._currentElement && this._currentElement instanceof NeolitComponent) {
            console.warn("NEOLIT : Detected a component instance in the rendered output. This may indicate that a component is being returned directly from the render method instead of its rendered output. Please ensure that the render method returns the output of the component's render method, not the component instance itself.");

        }
        // Artık component render result'ı işlenmiş olduğundan, currentEls'in NeolitNode veya NeolitNode[] olduğunu varsayabiliriz.
        this._currentElement = currentEls as NeolitNode | NeolitNode[] | null;

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
        let newElement = this.render();
        // Eğer currentEls bir NeolitComponent ise, componentInstance'ın render metodunu çağırarak gerçek elementleri elde edelim.
        if (newElement && newElement instanceof NeolitComponent) {
            newElement = newElement.render();
        }
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
        this._currentElement = newElement as NeolitNode | NeolitNode[] | null;
    }

    public rerender(): void {
        this._rerender();
    }


}

