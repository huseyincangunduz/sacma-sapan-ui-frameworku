import {
  asyncState,
  computed,
  NeolitComponent,
  NeolitNode,
  state,
} from "@ubs-platform/neolit/core";
import { For } from "../../package/structural/forloop";
import { inject } from "@ubs-platform/neolit/injectables";
import { BookService } from "../services/book.service";
import { If, Stateful } from "@ubs-platform/neolit/structural";

export class BookList extends NeolitComponent {
  bookService = inject(BookService);
  bookList = asyncState(
    this.bookService.getBooks({ bookPublisherType: "ALL" }),
    { data: [] },
  );
  bookListMapped = computed([this.bookList], () => this.bookList.get().data);

  constructor() {
    super();
  }

  setList(bookType: "ALL" | "COMMUNITY" | "REGISTERED") {
    this.bookList.setAsync(
      this.bookService.getBooks({ bookPublisherType: bookType }),
    );
  }

  render(): NeolitNode {
    return (
      <>
        <button onclick={() => this.setList("COMMUNITY")}>
          Community kitapları
        </button>
        <button onclick={() => this.setList("REGISTERED")}>
          Registered kitapları
        </button>
        <button onclick={() => this.setList("ALL")}>Tüm kitaplar</button>

        <If condition={this.bookList.busy}>
          {() => (
            <div className="h-full w-full opacity-50 bg-gray-500 flex items-center justify-center"
            style={{ position: "fixed", top: 0, left: 0 }}>
              <h1 style={{ color: "white", fontSize: "2rem" }}>Yükleniyor...</h1>
            </div>
          )}
        </If>
        
        <div className="flex flex-wrap gap-2">
          <For items={this.bookListMapped} keyFn={(item) => item._id} let-item>
            {(item) => (
              <div className="card">
                <img
                  height="100px"
                  width="100px"
                  class="rounded"
                  src={`http://localhost:3000/api/file/BOOK_THUMB/${item._id}`}
                  alt={item.metaInfo.name}
                ></img>
                <div>{item.metaInfo.name}</div>
              </div>
            )}
          </For>
        </div>
      </>
    );   
  }
}

{
  /* <ubs-table-ngx style="width: 100%" [items]="books">
  <column name="fullname">
    <ng-template header> {{ 'fullname' | translate }}</ng-template>
    <ng-template data let-item="item">
      <div class="flex gap-1 align-items-center">
        <img
          height="30px"
          class="rounded"
          src="/api/file/BOOK_THUMB/{{ item._id }}"
        />
        {{ item.metaInfo.name }}
      </div>
    </ng-template>
  </column>

  <column name="actions">
    <ng-template header>Aksiyonlar </ng-template>
    <ng-template data let-item="item">
      <block-button
        [hasContent]="false"
        iconClass="pi pi-pencil"
        (click)="openInLotus(item._id)"
        buttonClass="border mr-1"

      ></block-button>
      <block-button
        [hasContent]="false"
        iconClass="pi pi-key"
        buttonClass="border"
        [routerLink]="['admin-tools', item._id]"
        ></block-button
      >
    </ng-template>
  </column>
</ubs-table-ngx> */
}
