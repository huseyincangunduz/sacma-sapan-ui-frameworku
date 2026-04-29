import {
  NeolitComponent,
  state,
  NeolitNode,
  State,
} from "@ubs-platform/neolit/core";
import { For, Forv2 } from "@ubs-platform/neolit/structural";
import { Input } from "../../general/input";
import { Button } from "../../general/button";

export class AdvancedTodoList extends NeolitComponent {
  static sampleDescription =
    "Basit bir yapılacaklar listesi örneği. Kullanıcıdan yapılacaklar listesini girmesini istiyor ve ardından listeyi güncelliyor.";
  static repoPath = "src/landing/samples/todo-list.tsx";

  todoItems = state<string[]>([]);
  doneMap: Record<string, State<boolean>> = {};
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
          <Forv2 items={this.todoItems} keyFn={(item: string) => item}>
            {(item: string) => {
              this.doneMap[item] = state<boolean>(false);
              this.doneMap[item].subscribe((value) => {
                console.log("ForV2 checked: ", value);
              });
              return (
                <li key={item}>
                  <div className="flex align-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      oninput={(e: InputEvent) => {
                        this.doneMap[item].set(
                          (e.target as HTMLInputElement).checked,
                        );
                      }}
                    />
                    <div
                      className={{
                        "mr-2": true,
                        "line-through": this.doneMap[item],
                      }}
                    >
                      {item}
                    </div>
                    <Button
                      onclick={() =>
                        this.todoItems.update((current) =>
                          current.filter((itemRemoval) => itemRemoval !== item),
                        )
                      }
                    >
                      Sil
                    </Button>
                  </div>
                </li>
              );
            }}
          </Forv2>
        </ul>
      </div>
    );
  }
}
