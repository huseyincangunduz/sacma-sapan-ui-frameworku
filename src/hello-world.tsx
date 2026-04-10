import { NeolitComponent, State } from "@ubs-platform/neolit/core";
import { Zikirmatik } from "./zikirmatik";
import { KyleBroflovski } from "./kyle";

export class SecondaryComponent extends NeolitComponent {
    render(): HTMLElement {
        return <h2>Secondary Component</h2>;
    }
}

export class HelloWorld extends NeolitComponent {
    name : State<string>;

    constructor() {
        super();
        this.name = new State("World");
        this.watch(this.name);
    }

    changeNamePrompt() {
        const newName = prompt("Enter a new name:", this.name.get());
        if (newName !== null) {
            this.name.set(newName);
        }
    }
    
    render(): HTMLElement {
        return <div>

            <h1 >Merhaba, {this.name}!</h1>
            <div>Monolit demosuna hoş geldin</div>
            <button onclick={() => this.changeNamePrompt()}>Change name</button>
            <h3>Çeşitli saçma sapan şeyleri buradan deneyebilirsiniz.</h3>
            <SecondaryComponent />
            <Zikirmatik />
            <KyleBroflovski></KyleBroflovski>
        </div>;
    }
}