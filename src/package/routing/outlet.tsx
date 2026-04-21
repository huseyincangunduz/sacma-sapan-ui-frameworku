import { NeolitComponent, NeolitNode } from "../core";
import { fromState } from "../structural";
import { RouteMap } from "./route-map";
import { Router } from "./router";

export interface OutletProps {
  router?: Router;
  routeMap?: RouteMap;
  initialPath?: string;
}

export class Outlet extends NeolitComponent {
  router?: Router;
  private ownsRouter: boolean = false;
  /**
   *
   */
  onInit(): void {
    if (this.properties.router) {
      this.router = this.properties.router;
      this.ownsRouter = false;
      return;
    }

    if (!this.properties.routeMap) {
      throw new Error("Outlet requires either a router or routeMa p prop.");
    }

    this.router = new Router({
      routeMap: this.properties.routeMap,
      initialPath: this.properties.initialPath,
    });
    this.ownsRouter = true;
  }

  updatePath(path: string) {
    this.router?.navigate(path);
  }

  override destroy(): void {
    if (this.ownsRouter) {
      this.router?.destroy();
    }

    super.destroy();
  }

  render(): NeolitNode | NeolitNode[] {
    return (
      <>
        {fromState(this.router!.activeRouteState).stateful(() => {
          const activeRoute = this.router!.activeRouteState.get();

          if (activeRoute) {
            return activeRoute.route.componentFactory(activeRoute.parameters);
          } else {
            return <div>404 Not Found</div>;
          }
        })}
      </>
    );
  }
}
