import { NeolitComponent, state, NeolitNode } from "@ubs-platform/neolit/core";
import { Button } from "../../general/button";

export class HelloWorld extends NeolitComponent {
  static sampleDescription =
    "Basit merhaba dünya örneği. Bir butona tıklayarak kullanıcıdan adını girmesini istiyor ve ardından merhaba mesajını güncelliyor.";
  static repoPath = "src/landing/samples/hello-world.tsx";

  name = state("Dünya");

  askUsersName() {
    const userName = prompt("Adınız nedir?");
    if (userName) {
      this.name.set(userName);
    }
  }

  render(): NeolitNode {
    return (
      <div>
        <h1 style={{ fontSize: "32px" }}> Merhaba, {this.name}!</h1>
        <div></div>
        <Button onclick={() => this.askUsersName()}>Adı değiştir</Button>
      </div>
    );
  }
}
