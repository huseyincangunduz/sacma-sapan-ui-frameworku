import {
  asyncState,
  computed,
  NeolitComponent,
  NeolitNode,
} from "@ubs-platform/neolit/core";
import { inject } from "@ubs-platform/neolit/injectables";
import { BookService } from "../services/book.service";
import { fromState } from "@ubs-platform/neolit/structural";

export class BookList extends NeolitComponent {
  bookService = inject(BookService);
  bookList = asyncState(
    this.bookService.getBooks({ bookPublisherType: "ALL" }),
    { data: [] },
  );


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
        
        {fromState(this.bookList.errorObject).renderIf((error) => (
          <div style={{ color: "red" }}>Hata: {error.message}</div>
        ))}

        {fromState(this.bookList.busy).renderIf(() => (
          <div
            className="h-full w-full opacity-50 bg-gray-500 flex items-center justify-center"
            style={{ position: "fixed", top: 0, left: 0 }}
          >
            <h1 style={{ color: "white", fontSize: "2rem" }}>Yükleniyor...</h1>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          {fromState(this.bookList.map(a => a.data)).keyFn(a => a._id).renderFor((item) => (
            <div className="card" key={item._id}>
              <img
                height="100px"
                width="100px"
                class="rounded"
                src={`http://localhost:3000/api/file/BOOK_THUMB/${item._id}`}
                alt={item.metaInfo.name}
              ></img>
              <div>{item.metaInfo.name}</div>
            </div>
          ))}
        </div>
      </>
    );
  }
}

