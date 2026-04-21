import {
  NeolitComponent,
  NeolitNode,
  AsyncState,
  asyncState,
} from "@ubs-platform/neolit/core";
import { Button } from "../../general/button";
import { If, Stateful } from "@ubs-platform/neolit/structural";

export class AsyncFetch extends NeolitComponent {
  static sampleDescription =
    "Asenkron işlem örneği. Bir butona tıklayarak 5 saniye bekleyen bir promise başlatılıyor ve sonuç gösteriliyor.";
  static repoPath = "src/landing/samples/async-fetch.tsx";

  asyncData: AsyncState<string | null> = asyncState(
    Promise.resolve<string | null>(null),
    null,
  );

  startFail(): void {
    this.asyncData.setAsync(
      new Promise<string>((_resolve, reject) =>
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
    const allIn = this.asyncData.allInComputed();

    return (
      <div>
        <div>{this.asyncData.busy}</div>
        {/* Durumlar */}
        <Stateful state={allIn}>
          {(values: {
            data: string | null;
            busy: boolean;
            error: Error | null;
          }) => (
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
          )}
        </Stateful>
        {/* Aksiyon butonları */}
        <If
          condition={this.asyncData.busy}
          elseChildren={() => (
            <div className="flex gap-1">
              <Button onclick={() => this.start()}>
                Başarılı işlem başlat
              </Button>
              <Button onclick={() => this.startFail()}>
                Hatalı işlem başlat
              </Button>
            </div>
          )}
        >
          {() => (
            <p style={{ marginTop: "8px" }}>
              İşlem devam ediyor... Lütfen bekleyin.
            </p>
          )}
        </If>
      </div>
    );
  }
}
