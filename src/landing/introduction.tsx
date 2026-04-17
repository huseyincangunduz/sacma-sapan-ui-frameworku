import { NeolitComponent, State, state } from "@ubs-platform/neolit/core";
import { For, fromState, Stateful } from "@ubs-platform/neolit/structural";
import { inject } from "../package/injectables/root-container";
import { Router } from "../package/routing";
import { appContextInjector } from "../app-context";

export interface SampleComponentItem {
  name: string;
  source: string;
  note: string;
  componentConstructor: () => NeolitComponent;
}

export class Introduction extends NeolitComponent {
  counter = state(0);
  activeTab = state("state");

  apiCards = state([
    {
      title: "State",
      signature: "const count = state(0)",
      summary: "Reaktif veriyi tutar ve set/update ile güncellenir.",
    },
    {
      title: "Stateful",
      signature: "fromState(flag).stateful(() => <A flag={flag} />)",
      summary:
        "Yalnızca ilgili alt bloğu yeniden çizerek daha verimli günceller.",
    },
    {
      title: "For",
      signature: "fromState(items).renderFor(item => <li>{item}</li>)",
      summary: "Dinamik listeleri state üzerinden yönetir ve render eder.",
    },
    {
      title: "watchToRerender",
      signature: "this.watchToRerender(count)",
      summary:
        "Eğer akıcı structural API yeterli gelmediyse manuel olarak bileşeni yeniden render etmeye yarar. Ancak buna ihtiyacınız olmamasını umuyoruz :)",
    },
  ]);

  activeSampleComponent = state<SampleComponentItem | null>(null);
  router = inject(Router, appContextInjector);
  githubRepoLink = inject<string>("github-repo", appContextInjector);

  constructor() {
    super();
    // this.watchToRerender(this.activeTab);
  }

  incrementCounter(): void {
    this.counter.update((value) => value + 1);
  }

  switchTab(tab: string): void {
    this.activeTab.set(tab);
  }

  render(): HTMLElement {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-orange-50 px-4 py-10 text-slate-800 sm:px-8">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <section className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-white/90 p-8 shadow-xl shadow-cyan-100 sm:p-12">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl"></div>
            <div className="absolute -bottom-20 -left-12 h-64 w-64 rounded-full bg-orange-200/35 blur-3xl"></div>

            <div className="relative z-10 flex flex-col gap-6">
              <img src="/assets/neolit-full.png" alt="Neolit Logo" />

              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                  Neolit ile modern, yalın ve hızlı UI geliştirme
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                  Neolit ile tanışın: Modern web uygulamaları için yalın,
                  performans odaklı ve geliştirici dostu bir UI framework.
                  İhtiyacınıza göre render kontrolü, reaktif state yönetimi ve
                  esnek yapısıyla, hızlı ve etkili kullanıcı arayüzleri
                  oluşturmanızı sağlar.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-900">
                  @ubs-platform/neolit/core
                </span>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-900">
                  @ubs-platform/neolit/structural
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Tailwind v4
                </span>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <For items={this.apiCards}>
              {(card) => (
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <h2 className="text-lg font-bold text-slate-900">
                    {card.title}
                  </h2>
                  <p className="mt-2 rounded-lg bg-slate-900/95 px-3 py-2 font-mono text-xs text-cyan-200">
                    {card.signature}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {card.summary}
                  </p>
                </article>
              )}
            </For>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-black">Canlı Mini Demo</h2>
              <div className="flex flex-wrap gap-2">
                <Stateful state={this.activeTab}>
                  {() => {
                    const tabButtonClass = (tabName: string): string =>
                      [
                        "dont-touch rounded-full border px-4 py-2 text-sm font-semibold transition",
                        this.activeTab.get() === tabName
                          ? "border-cyan-500 bg-cyan-500 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700",
                      ].join(" ");
                    return (
                      <>
                        <button
                          className={tabButtonClass("state")}
                          onclick={() => this.switchTab("state")}
                        >
                          State
                        </button>
                        <button
                          className={tabButtonClass("stateful")}
                          onclick={() => this.switchTab("stateful")}
                        >
                          Stateful
                        </button>
                        <button
                          className={tabButtonClass("for")}
                          onclick={() => this.switchTab("for")}
                        >
                          For
                        </button>
                      </>
                    );
                  }}
                </Stateful>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <Stateful state={this.activeTab}>
                {() =>
                  this.activeTab.get() === "state" ? (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-600">
                        Counter state'i güncelleniyor, ekranda anlık değeri
                        görüyorsun.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                          onclick={() => this.incrementCounter()}
                        >
                          +1 artır
                        </button>
                        <Stateful state={this.counter}>
                          {() => (
                            <strong className="text-xl text-cyan-700">
                              {this.counter}
                            </strong>
                          )}
                        </Stateful>
                      </div>
                    </div>
                  ) : this.activeTab.get() === "stateful" ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">
                        Stateful yalnızca kendi children bloğunu tekrar render
                        eder.
                      </p>
                      <p className="rounded-lg bg-white p-3 font-mono text-xs text-slate-700">
                        {
                          "<Stateful state={flag}>{() => flag.get() ? <A/> : <B/>}</Stateful>"
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">
                        For ile dizi state'ini declarative şekilde
                        listeleyebilirsin.
                      </p>
                      <p className="rounded-lg bg-white p-3 font-mono text-xs text-slate-700">
                        {"<For items={items}>{(item) => <li>{item}</li>}</For>"}
                      </p>
                    </div>
                  )
                }
              </Stateful>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900">
              Neolit'i daha fazla keşfet
            </h2>

            <div className="grid">
              <div className="col-6">
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Neolit API'lerini kullanarak oluşturulmuş örnek bileşenler
                  var. Bunlar gerçek kullanım örnekleri sunuyor. Neolit'in
                  API'lerinin nasıl çalıştığını görmenin harika bir yolu.
                </p>
              </div>
              <div className="col-6">
                <button
                  className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
                  onclick={() => this.router.navigate("/samples")}
                >
                  Örnekler sayfası
                </button>
              </div>
              <div className="col-6">
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Neolit açık kaynaklıdır ve herkesin kullanımına açıktır.
                  GitHub reposunda kaynak kodunu inceleyebilir, katkıda
                  bulunabilir veya kendi projelerinde kullanmaya
                  başlayabilirsin.
                </p>
              </div>
              <div className="col-6">
                <button
                  className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
                  onclick={() => window.open(this.githubRepoLink, "_blank")}
                >
                  Github reposu
                </button>
              </div>
            </div>
          </section>

          {/* <section className="rounded-3xl border border-orange-200 bg-orange-50/60 p-6 sm:p-8">
            <h2 className="text-2xl font-black text-slate-900">
              Test Klasorunden Ornekler
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Asagidaki bu salak salak componentler, projenin [test] klasorunde
              bulunuyor ve Neolit API'lerinin gercek kullanimlarini gosteriyor.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {fromState(this.sampleComponents).renderFor((item) => (
                <article className="rounded-xl border border-orange-200 bg-white p-4">
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <p className="mt-1 font-mono text-xs text-orange-700">
                    {item.source}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                  <button
                    onClick={() => this.activeSampleComponent.set(item)}
                    className="mt-3 rounded-lg bg-orange-500 px-3 py-1 text-sm font-semibold text-white"
                  >
                    Componenti dene{" "}
                  </button>
                </article>
              ))}
            </div>

            {fromState(this.activeSampleComponent).renderIf(() => (
              <div className="mt-8 rounded-lg border border-slate-300 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">
                  {this.activeSampleComponent.get()?.name} Canlı Demo
                </h3>
                {(() => {
                  const activeItem = this.activeSampleComponent.get();
                  if (!activeItem) return <div></div>;
                  const ComponentConstructor =
                    activeItem.componentConstructor();
                  return <ComponentConstructor />;
                })()}
              </div>
            ))}
          </section> */}
        </main>
      </div>
    );
  }
}
