import { appContextInjector } from "./app-context";
import { Introduction } from "./landing/introduction";
import { BookList } from "./lotus-app/components/book-list";
import { NeolitComponent, NeolitNode } from "./package/core";
import {
  createInjector,
  inject,
  provideClass,
  provideValue,
  rootInjector,
} from "./package/injectables";
import { Outlet } from "./package/routing/outlet";
import { RouteMap } from "./package/routing/route-map";
import { Router } from "./package/routing/router";
import { HelloWorld } from "./tester/hello-world";

export class App extends NeolitComponent {
  /**
   *
   */
  readonly router = inject(Router, appContextInjector);
  readonly routeMap = inject(RouteMap, appContextInjector);
  readonly languageWarning = 'For english, please follow README from github link. English language is under construction.'
  constructor() {
    super();
  }

  render(): NeolitNode {
    return (
      <div className="h-screen w-screen flex flex-col">
        <div className="bg-gray-800 text-white p-4 gap-2 w-full flex items-center">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <img update
                src="assets/logo.svg"
                alt="Logo"
                className="h-8 inline-block mr-4"
              />
              <button
                className="px-3 py-1 rounded hover:bg-gray-700"
                onclick={() => this.router.navigate("/")}
              >
                Ana sayfa
              </button>
              <button
                className="px-3 py-1 rounded hover:bg-gray-700"
                onclick={() => this.router.navigate("/samples")}
              >
                Örnekler
              </button>
            </div>
            <div
              style={{
                whiteSpace: "pre-line",
              }}
              className="hidden md:block px-3 py-1 font-mono  mr-2 text-sm text-slate-500"
            >
              { this.languageWarning }
            </div>
            <div>
              {/* TODO: Dil seçimi */}

              {/* TODO: Repoyu bir ara neolit ismiyle ubs-platform içine alacağım. ilk projeye başlarken geyiğine dalgasına başlamıştım ama bu kadar ciddi ciddi ilerleyeceğimi asla düşünmezdim.... */}
              <button
                className="px-3 py-1 rounded hover:bg-gray-700"
                onclick={() =>
                  window.open(
                    "https://github.com/huseyincangunduz/sacma-sapan-ui-frameworku",
                  )
                }
              >
                Github
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            whiteSpace: "pre-line",
          }}
          className="block md:hidden px-3 py-1 font-mono  mr-2 text-sm text-slate-500"
        >
          { this.languageWarning }
        </div>
        <div className="flex-grow-1 overflow-auto">
          <Outlet router={this.router} />
          <footer className="w-full border border-slate-200 bg-blue-300 p-8 text-center text-sm text-slate-500 shadow-sm">
            <p className="mt-10 text-center text-sm text-slate-500">
              © 2026 Tetakent (Hüseyin Can Gündüz). Tüm hakları saklıdır.
              Projenin kaynak kodları MIT lisansı ile dağıtılmaktadır. 
            </p>
            <div className="w-full flex items-center justify-center mt-4">
              <img src="assets/tk.svg" alt="TK Logo" className="inline-block mr-2 mb-3 cursor-pointer" style={{ height: "40px" }} onclick={() => window.open("https://tetakent.com", "_blank")} />
              <img src="assets/neolit-full.png" alt="Logo" className="h-8 inline-block mr-4" />
            </div>
          </footer>
        </div>
      </div>
    );
  }
}
