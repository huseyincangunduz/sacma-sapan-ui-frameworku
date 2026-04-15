import { NeolitComponent, NeolitNode } from "../core";
import { fromState, Stateful } from "../structural";
import { RouteMap } from "./route-map";
import { Router } from "./router";

export interface OutletProps {
    router?: Router;
    routeMap?: RouteMap;
    initialPath?: string;
}

export class Outlet extends NeolitComponent {
    router: Router;
    private ownsRouter: boolean;
    /**
     *
     */
    constructor({ router, routeMap, initialPath = "/" }: OutletProps) {
        super();

        if (router) {
            this.router = router;
            this.ownsRouter = false;
            return;
        }

        if (!routeMap) {
            throw new Error("Outlet requires either a router or routeMap prop.");
        }

        this.router = new Router({ routeMap, initialPath });
        this.ownsRouter = true;
    }

    updatePath(path: string) {
        this.router.navigate(path);
    }

    override destroy(): void {
        if (this.ownsRouter) {
            this.router.destroy();
        }

        super.destroy();
    }


    render(): NeolitNode | NeolitNode[] {
        return <>
            {
                fromState(this.router.activeRouteState).stateful(() => {
                    const activeRoute = this.router.activeRouteState.get();

                    if (activeRoute) {
                        return activeRoute.route.componentFactory(activeRoute.parameters);
                    } else {
                        return <div>404 Not Found</div>;
                    }
                })
            }
        </>



    }

}