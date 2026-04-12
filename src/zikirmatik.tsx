import { NeolitComponent, NeolitNode, state } from "./package/core";

export class Zikirmatik extends NeolitComponent {
    count = state(0);
    /**
     *
     */
    constructor() {
        super();
        this.watchToRerender(this.count);
    }

    increment() {
        this.count.update((c) => c + 1);
    }


    render(): NeolitNode {
        return <div>
            <h1>Zikirmatik</h1>
            <p>Count: {this.count}</p>
            <button onClick={() => this.increment()}>Increment</button>
        </div>
    }

}