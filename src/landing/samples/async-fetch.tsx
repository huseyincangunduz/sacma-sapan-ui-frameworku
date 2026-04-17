import {
  NeolitComponent,
  NeolitNode,
  AsyncState,
  asyncState,
} from "@ubs-platform/neolit/core";
import { Button } from "../../general/button";
import { fromState } from "@ubs-platform/neolit/structural";

export class AsyncFetch extends NeolitComponent {
  static sampleDescription =
    "Asenkron işlem örneği. Bir butona tıklayarak 5 saniye bekleyen bir promise başlatılıyor ve sonuç gösteriliyor.";
  static repoPath = "src/landing/samples/async-fetch.tsx";

  asyncData: AsyncState<string | null> = asyncState(
    Promise.resolve<string | null>(null),
    null,
  );

  constructor() {
    super();
  }

  startFail(): void {
    this.asyncData.setAsync(
      new Promise<string>((resolve, reject) =>
        setTimeout(
          () =>
            reject(new Error("İşlem başarısız oldu! ❌ 5 saniye beklendi.")),
          5000,
        ),
      ),
    );
  }

  start() {
    this.asyncData.setAsync(
      new Promise<string>((resolve) =>
        setTimeout(
          () => resolve("İşlem tamamlandı! 🎉 5 saniye beklendi."),
          5000,
        ),
      ),
    );
  }

  render(): NeolitNode {

    
    return (
      <div>
        {/* Durumlar */}
        {fromState(this.asyncData.allInComputed()).stateful((values) => {
          return (
            <>
              {values.error && (
                <p style={{ color: "red", marginTop: "8px" }}>
                  {values.error.message}
                </p>
              )}
              {values.data && (
                <p style={{ color: "green", marginTop: "8px" }}>
                  {values.data}
                </p>
              )}
            </>
          );
        })}
        {/* Aksiyon butonları */}
        {fromState(this.asyncData.busy)
          .renderIf(() => (
            <p style={{ marginTop: "8px" }}>
              İşlem devam ediyor... Lütfen bekleyin.
            </p>
          ))
          .else(() => {
            return (
              <div className="flex gap-1">
                <Button onclick={() => this.start()}>
                  Başarılı işlem başlat
                </Button>

                <Button onclick={() => this.startFail()}>
                  Hatalı işlem başlat
                </Button>
              </div>
            );
          })}
      </div>
    );
  }
}
