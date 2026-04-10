import { NeolitComponent, State } from "@ubs-platform/neolit/core";

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

            <h1 >Hello, {this.name.get()}!</h1>
            <button onclick={() => this.changeNamePrompt()}>Change name</button>
            <SecondaryComponent />
        </div>;
    }
}