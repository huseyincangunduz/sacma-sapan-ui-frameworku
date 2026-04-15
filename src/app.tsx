import { Introduction } from "./landing/introduction";
import { BookList } from "./lotus-app/components/book-list";
import { NeolitComponent, NeolitNode } from "./package/core";
import { Outlet } from "./package/routing/outlet";
import { RouteMap } from "./package/routing/route-map";
import { Router } from "./package/routing/router";
import { HelloWorld } from "./tester/hello-world";

const routeMap = new RouteMap([
    {
        path: "/",
        componentFactory: () => {
            return <Introduction />
        },
    },
    {
        path: "/samples",
        componentFactory: () => {
            return <HelloWorld />
        }
    },
    {
        path: "/lotus-books",
        componentFactory: () => {
            return <BookList />
        }
    },
]);

const router = new Router({
    routeMap,
    initialPath: window.location.pathname + window.location.search
});

export class App extends NeolitComponent {
    /**
     *
     */
    constructor() {
        super();
    }

    render(): NeolitNode {
        return <div className="h-screen w-screen flex flex-col">
            <div className="bg-gray-800 text-white p-4 gap-2 ">
                <div className="flex justify-content-between">
                    <div className="flex items-center">
                        <img src="assets/logo.svg" alt="Logo" className="h-8 inline-block mr-4" />
                        <button className="px-3 py-1 rounded hover:bg-gray-700" onclick={() => router.navigate("/")}>
                            Ana sayfa
                        </button>
                        <button className="px-3 py-1 rounded hover:bg-gray-700" onclick={() => router.navigate("/samples")}>
                            Örnekler
                        </button>
                    </div>
                    <div>
                        {/* TODO: Dil seçimi */}
                        <button className="px-3 py-1 rounded hover:bg-gray-700">
                            🇹🇷 Türkçe
                        </button>
                        {/* TODO: Repoyu bir ara neolit ismiyle ubs-platform içine alacağım. ilk projeye başlarken geyiğine dalgasına başlamıştım ama bu kadar ciddi ciddi ilerleyeceğimi asla düşünmezdim.... */}
                        <button className="px-3 py-1 rounded hover:bg-gray-700" onclick={() => window.open("https://github.com/huseyincangunduz/sacma-sapan-ui-frameworku")}>
                            Github
                        </button>
                    </div>

                </div>
            </div>

            <div className="flex-grow-1 overflow-auto">
                <Outlet router={router} />
            </div>
        </div>

    }
}