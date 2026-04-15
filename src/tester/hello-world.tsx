import { NeolitComponent, State } from "@ubs-platform/neolit/core";
import { Zikirmatik } from "./zikirmatik";
import { KyleBroflovski } from "./kyle";
import { fromState } from "@ubs-platform/neolit/structural";

export class SecondaryComponent extends NeolitComponent {
  constructor() {
    super();
  }

  render(): HTMLElement {
    return <h2>Secondary Component</h2>;
  }
}

export class ConditionalBlockDemo extends NeolitComponent {
  showDetails: State<boolean>;

  constructor() {
    super();
    this.showDetails = new State(true);
  }

  toggle() {
    this.showDetails.set(!this.showDetails.get());
  }

  render(): HTMLElement {
    return (
      <section>
        <h4>Yapisal Ornek 1: Conditional Block</h4>
        <button onclick={() => this.toggle()}>Detay blogunu ac/kapat</button>
        <div>{this.showDetails}</div>

        {fromState(this.showDetails)
          .renderIf(() => (
            <p testProperty={() => console.log("Test property")}>
              ANA BLOK: Bu blok true iken var olur.
            </p>
          ))
          .else(() => (
            <small testProperty={() => console.log("Test property")}>
             ELSE BLOĞU: Bu blok false iken var olur.
            </small>
          ))}
      </section>
    );
  }
}

export class DynamicListDemo extends NeolitComponent {
  items: State<string[]>;

  constructor() {
    super();
    this.items = new State(["Alpha", "Beta", "Gamma"]);
  }

  addItem() {
    const next = `Item-${this.items.get().length + 1}`;
    this.items.update((curr) => [...curr, next]);
  }

  removeFirst() {
    this.items.update((curr) => curr.slice(1));
  }

  reverseItems() {
    this.items.update((curr) => [...curr].reverse());
  }

  render(): HTMLElement {
    return (
      <section>
        <h4>Yapisal Ornek 2: Dynamic List</h4>
        <button onclick={() => this.addItem()}>Ekle</button>
        <button onclick={() => this.removeFirst()}>Ilki Sil</button>
        <button onclick={() => this.reverseItems()}>Ters Cevir</button>
        <ul>
          {fromState(this.items).renderFor((item) => <li>{item}</li>)}
        </ul>
      </section>
    );
  }
}

export class ChildA extends NeolitComponent {
  render(): HTMLElement {
    return <div>A Child</div>;
  }
}

export class ChildB extends NeolitComponent {
  render(): HTMLElement {
    return <div>B Child</div>;
  }
}

export class SiblingSwapDemo extends NeolitComponent {
  swap: State<boolean>;

  constructor() {
    super();
    this.swap = new State(false);
    this.watchToRerender(this.swap);
  }

  toggleOrder() {
    this.swap.set(!this.swap.get());
  }

  render(): HTMLElement {
    return (
      <section>
        <h4>Yapisal Ornek 3: Sibling Order</h4>
        <button onclick={() => this.toggleOrder()}>Sirayi Degistir</button>
        <div>
          {this.swap.get() ? <ChildB /> : <ChildA />}
          {this.swap.get() ? <ChildA /> : <ChildB />}
        </div>
      </section>
    );
  }
}

export class HelloWorld extends NeolitComponent {
  name: State<string>;

  constructor() {
    super();
    this.name = new State("World");
  }

  changeNamePrompt() {
    const newName = prompt("Enter a new name:", this.name.get());
    if (newName !== null) {
      this.name.set(newName);
    }
  }

  render(): HTMLElement {
    return (
      <div>
        <h1>a***oğlu react</h1>
        <img
          src="https://media.tenor.com/44qGjGLCKDYAAAAe/meth-mark-zuckerberg.png"
          alt="Instagram'dan banlandın zaa xd"
        ></img>
        <h1>Merhaba, {this.name}!</h1>
        <div>Monolit demosuna hoş geldin</div>
        <button onclick={() => this.changeNamePrompt()}>Change name</button>
        <h3>Çeşitli saçma sapan şeyleri buradan deneyebilirsiniz.</h3>
        <SecondaryComponent />
        <ConditionalBlockDemo />
        <DynamicListDemo />
        <SiblingSwapDemo />
        <Zikirmatik />
        <KyleBroflovski></KyleBroflovski>
      </div>
    );
  }
}
