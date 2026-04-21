import { NeolitComponent, state, NeolitNode } from "@ubs-platform/neolit/core";
import { Button } from "../../general/button";

export class IncreaseCounter extends NeolitComponent {
  static sampleDescription =
    "Basit bir sayaç örneği. Bir butona tıklayarak sayacı arttırıyor.";
  static repoPath = "src/landing/samples/increase-counter.tsx";

  counter = state(0);

  constructor() {
    super();
  }

  increaseCounter() {
    this.counter.set(this.counter.get() + 1);
  }

  render(): NeolitNode {
    return (
      <div>
        Sayaç: {this.counter}
        <div></div>
        <Button onclick={() => this.increaseCounter()}>Arttır</Button>
      </div>
    );
  }
}
