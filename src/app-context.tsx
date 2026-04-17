import { Introduction } from "./landing/introduction";
import { SampleListPage } from "./landing/samples";
import {
  createInjector,
  rootInjector,
  provideValue,
} from "./package/injectables";
import { RouteMap, Router } from "./package/routing";
import { KyleBroflovski } from "./tester/kyle";

export const appContextInjector = createInjector(rootInjector);

export const routeMap = new RouteMap([
  {
    path: "/",
    componentFactory: () => {
      return <Introduction />;
    },
  },
  {
    path: "/samples",
    componentFactory: () => {
      return <SampleListPage />;
    },
  },
  {
    path: "/lotus-books",
    componentFactory: () => {
      return <KyleBroflovski />;
    },
    async canActivate() {
      // Kyle'landın
      return Math.random() > 0.5
        ? (() => {
            alert("Kylelandın");
            return true;
          })()
        : "/";
    },
  },
]);

const router = new Router({
  routeMap,
  initialPath: window.location.pathname + window.location.search,
});

provideValue(Router, router, appContextInjector);
provideValue(RouteMap, routeMap, appContextInjector);
provideValue("appName", "Neolit", appContextInjector);
provideValue(
  "github-repo",
  "https://github.com/huseyincangunduz/sacma-sapan-ui-frameworku",
  appContextInjector,
);
