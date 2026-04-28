import { NeolitNode } from "./neolit-node";
import { isState, State, StateOrPlain } from "./state";

export abstract class NeolitComponent<PROPERTIES = Record<string, any>> {
  static isNeolitComponent = true;
  static componentInstances = new Map<string, NeolitComponent>();
  private _mountTarget: HTMLElement | null = null;
  private _currentElement: NeolitNode[] = [];
  private _unsubscribers: Array<() => void> = [];
  private key: string;
  public properties: Partial<PROPERTIES> = {};
  public initialProperties?: Partial<PROPERTIES>;

  // Property'ler sonra uygulanıyor, böylece component instance'ı oluşturulduktan sonra props'lara erişilebilir oluyor. Bu sayede onInit gibi lifecycle metodlarında props'lara erişim sağlanabilir.
  /**
   *
   * @param properties Component'e ilk oluşturulurken verilen props'lar. Bu props'lar component instance'ı oluşturulduktan sonra properties alanına atanır ve onInit gibi lifecycle metodlarında erişilebilir olur. Eğer component instance'ı oluşturulurken props verilmezse, properties alanı boş bir nesne olarak başlatılır.
   * @param key Component'e atanacak benzersiz anahtar. Eğer verilmezse otomatik olarak oluşturulur.
   */
  constructor(properties?: PROPERTIES, key?: string) {
    this.initialProperties = properties;
    this.key = key ?? crypto.randomUUID();
    NeolitComponent.componentInstances.set(this.key, this);
  }

  assignProperties(): void {
    // if (this.initialProperties) {
    //     this.properties = this.initialProperties;
    // }
    const newProperties = this.initialProperties;
    if (newProperties) {
      Object.entries(newProperties).forEach(([propKey, propValue]) => {
        const key = propKey as keyof PROPERTIES;
        if (propValue === undefined) {
          return;
        }

        if (
          typeof this.properties[key] === "object" &&
          this.properties[key] instanceof State
        ) {
          (this.properties[key] as State<typeof propValue>).set(propValue);
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
    this._unsubscribers.forEach((unsubscribe) => unsubscribe());
    this._unsubscribers = [];

    if (this._mountTarget) {
      this._mountTarget.removeAttribute("data-neolit-mounted");
      this._mountTarget.removeAttribute("data-neolit-key");
    }
    NeolitComponent.componentInstances.delete(this.key);
  }


  private regularizeIncomingElements(incomingElements: NeolitComponent | NeolitNode | NeolitNode[] | NeolitComponent[] | null | undefined): NeolitNode[] {
    const incomingElementsConverted: NeolitNode[] = []
    if (incomingElements instanceof NeolitComponent) {
      let el: NeolitNode | NeolitNode[] | NeolitComponent | null = null;
      do {
        el = this.regularizeIncomingElements(incomingElements.render());
      } while (el instanceof NeolitComponent);
      incomingElementsConverted.push(...el);

    } else if (Array.isArray(incomingElements)) {
      incomingElements.forEach((el) => {
        incomingElementsConverted.push(...this.regularizeIncomingElements(el));
      });
    } else if (incomingElements != null) {
      incomingElementsConverted.push(incomingElements as NeolitNode);
    }
    return incomingElementsConverted.filter((el) => el != null && el != undefined);
  }

  mount(target: HTMLElement): NeolitNode[] {
    this._mountTarget = target;
    target.attributes.setNamedItem(
      document.createAttribute("data-neolit-mounted"),
    );
    target.setAttribute("data-neolit-key", this.key);

    let incomingElements = this.render();

    // Eğer currentEls bir NeolitComponent ise, componentInstance'ın render metodunu çağırarak gerçek elementleri elde edelim.
    while (incomingElements && incomingElements instanceof NeolitComponent) {
      incomingElements = incomingElements.render();
    }
    // Eğer initialElement sağlanmışsa ve sonradan render edilen elementin tipi initialElement ile uyuşmuyorsa, bu durumun render işlemi üzerinde sorunlara yol açabileceği konusunda bir uyarı verelim.
    const incomingElementsConverted = this.regularizeIncomingElements(incomingElements);

    incomingElementsConverted.forEach((el) => {
      if (!target.contains(el)) {
        target.appendChild(el);
      }
    })
    this._currentElement = incomingElementsConverted;
    return incomingElementsConverted;

  }


  private _rerender(): void {
    // if (!this._mountTarget || (!this._currentElement || this._currentElement.length == 0)) return;
    let newElement = this.render();
    // Eğer currentEls bir NeolitComponent ise, componentInstance'ın render metodunu çağırarak gerçek elementleri elde edelim.
    const newElementConverted = this.regularizeIncomingElements(newElement);
    this._currentElement.forEach((el) => {
      if (el.parentNode === this._mountTarget) {
        this._mountTarget!.removeChild(el);
      }
    });

    (newElementConverted as NeolitNode[]).forEach((el) => {
      if (!this._mountTarget!.contains(el)) {
        this._mountTarget!.appendChild(el);
      }
    });

    this._currentElement = newElementConverted as NeolitNode[];
  }

  public rerender(): void {
    this._rerender();
  }

  static constructInitialize<T>(
    cpClass: new (properties: T) => NeolitComponent<T>,
    properties: T,
  ) {
    const instance = new cpClass(properties);
    instance.assignProperties();
    instance.onInit?.();
    return instance;
  }
}
