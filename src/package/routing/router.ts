import { State, state } from "../core";
import { RouteMap, RouteMatch } from "./route-map";

export interface RouterOptions {
    routeMap: RouteMap;
    initialPath?: string;
}

export class Router {
    readonly routeMap: RouteMap;
    readonly pathState: State<string>;
    readonly activeRouteState: State<RouteMatch | null>;
    private readonly popStateHandler: () => void;

    constructor({ routeMap, initialPath }: RouterOptions) {
        this.routeMap = routeMap;

        const resolvedInitialPath = initialPath ?? this.getCurrentBrowserPath();
        this.pathState = state(resolvedInitialPath);
        this.activeRouteState = state(this.routeMap.getComponentForRoute(resolvedInitialPath));
        this.popStateHandler = () => {
            this.sync(this.getCurrentBrowserPath());
        };

        window.addEventListener("popstate", this.popStateHandler);
    }

    navigate(path: string): void {
        window.history.pushState({}, "", path);
        this.sync(path);
    }

    replace(path: string): void {
        window.history.replaceState({}, "", path);
        this.sync(path);
    }

    sync(path: string): void {
        this.pathState.set(path);
        this.activeRouteState.set(this.routeMap.getComponentForRoute(path));
    }

    destroy(): void {
        window.removeEventListener("popstate", this.popStateHandler);
    }

    private getCurrentBrowserPath(): string {
        return window.location.pathname + window.location.search;
    }
}