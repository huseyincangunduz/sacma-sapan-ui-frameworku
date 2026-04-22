import { NeolitComponent, state, NeolitNode } from "@ubs-platform/neolit/core";
import { For } from "@ubs-platform/neolit/structural";
import { Input } from "../../general/input";
import { Button } from "../../general/button";

export class TodoList extends NeolitComponent {
  static sampleDescription =
    "Basit bir yapılacaklar listesi örneği. Kullanıcıdan yapılacaklar listesini girmesini istiyor ve ardından listeyi güncelliyor.";
  static repoPath = "src/landing/samples/todo-list.tsx";

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
        <Input value={this.newTodo} placeholder="Yeni yapılacak..." />
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
