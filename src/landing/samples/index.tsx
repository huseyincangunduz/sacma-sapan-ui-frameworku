import { NeolitNode, NeolitComponent } from "@ubs-platform/neolit/core";
import { HelloWorld } from "./hello-world";
import { TodoList } from "./todo-list";
import { IncreaseCounter } from "./increase-counter";
import { inject } from "@ubs-platform/neolit/injectables";
import { appContextInjector } from "../../app-context";
import { TodoListWithoutCustomComponent } from "./todo-list-without-custom-component";
import { AsyncFetch } from "./async-fetch";
import { AdvancedTodoList } from "./advanced-todo-list";

export class SampleListPage extends NeolitComponent {
  samples = [
    {
      name: "Merhaba Dünya",
      description:
        "Basit merhaba dünya örneği. Bir butona tıklayarak kullanıcıdan adını girmesini istiyor ve ardından merhaba mesajını güncelliyor.",
      repoPath: "/blob/main/src/landing/samples/hello-world.tsx",
      componentClass: HelloWorld,
    },
    {
      name: "Normal input kullanarak Yapılacaklar Listesi",
      description:
        "Basit bir yapılacaklar listesi örneği. Kullanıcıdan yapılacaklar listesini girmesini istiyor ve ardından listeyi güncelliyor. Bu örnek normal todo-list örneğinden farklı olarak, özel bir TodoItem bileşeni kullanmadan sadece temel HTML öğeleriyle yapılmıştır.",
      repoPath:
        "/blob/main/src/landing/samples/todo-list-without-custom-component.tsx",
      componentClass: TodoListWithoutCustomComponent,
    },
    {
      name: "Yapılacaklar Listesi",
      description:
        "Basit bir yapılacaklar listesi örneği. Kullanıcıdan yapılacaklar listesini girmesini istiyor ve ardından listeyi güncelliyor.",
      repoPath: "/blob/main/src/landing/samples/todo-list.tsx",
      componentClass: TodoList,
    },
    {
      name: "Çok daha gelişmiş yapılacaklar listesi (galiba emin değilim)",
      description:
        "İkinci bir yapılacaklar listesi örneği. Bu örnek normal todo-list örneğinden farklı olarak, Karmaşık state yapısını ve ForV2 bileşeninin performans farkını göstermek için yazıldı.",
      repoPath: "/blob/main/src/landing/samples/advanced-todo-list.tsx",
      componentClass: AdvancedTodoList,
    },
    {
      name: "Sayaç",
      description:
        "Basit bir sayaç örneği. Bir butona tıklayarak sayacı arttırıyor.",
      repoPath: "/blob/main/src/landing/samples/increase-counter.tsx",
      componentClass: IncreaseCounter,
    },
    {
      name: "Async İşlem",
      description:
        "Asenkron işlem örneği. Bir butona tıklayarak 5 saniye bekleyen bir promise başlatılıyor ve sonuç ekrana yazdırılıyor.",
      repoPath: "/blob/main/src/landing/samples/async-fetch.tsx",
      componentClass: AsyncFetch,
    },
  ];

  readonly git = inject("github-repo", appContextInjector);

  constructor() {
    super();
  }

  render(): NeolitNode {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Neolit Örnekleri</h1>
        <ul className="space-y-4">
          {this.samples.map((sample) => (
            <li key={sample.name} className="border p-4 rounded">
              <h2 className="text-xl font-semibold">{sample.name}</h2>
              <p>{sample.description}</p>
              {sample.componentClass && <sample.componentClass />}
              <button
                className="mt-2 px-3 py-1 rounded bg-blue-500 text-white"
                onclick={() => window.open(this.git + sample.repoPath)}
              >
                Koda Git
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
