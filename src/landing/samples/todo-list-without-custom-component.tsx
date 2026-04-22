import { NeolitComponent, state, NeolitNode } from "@ubs-platform/neolit/core";
import { For } from "@ubs-platform/neolit/structural";
import { Button } from "../../general/button";

export class TodoListWithoutCustomComponent extends NeolitComponent {
  static sampleDescription =
    "Basit bir yapılacaklar listesi örneği. Kullanıcıdan yapılacaklar listesini girmesini istiyor ve ardından listeyi güncelliyor. Bu örnek normal todo-list örneğinden farklı olarak, Özel input bileşeni kullanmadan sadece temel HTML öğeleriyle yapılmıştır.";
  static repoPath =
    "src/landing/samples/todo-list-without-custom-component.tsx";

  todoItems = state<string[]>([]);
  newTodo = state("");

  constructor() {
    super();
  }

  addTodo() {
    if (this.newTodo.get().trim() !== "") {
      this.todoItems.set([...this.todoItems.get(), this.newTodo.get()]);
      this.newTodo.set("");
    }
  }

  render(): NeolitNode {
    return (
      <div>
        <h2>Yapılacaklar Listesi</h2>
        <input
          value={this.newTodo}
          placeholder="Yeni yapılacak..."
          onInput={(e: InputEvent) =>
            this.newTodo.set((e.target as HTMLInputElement).value)
          }
        ></input>
        <Button onclick={() => this.addTodo()}>Ekle</Button>
        <ul>
          <For items={this.todoItems} keyFn={(item: string) => item}>
            {(item: string, index: number) => <li key={index}>{item}</li>}
          </For>
        </ul>
      </div>
    );
  }
}
