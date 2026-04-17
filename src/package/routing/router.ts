import { AsyncState, asyncState, State, state } from "../core";
import { RouteMap, RouteMatch } from "./route-map";

export interface RouterOptions {
    routeMap: RouteMap;
    initialPath?: string;
}

export class Router {
    readonly routeMap: RouteMap;
    readonly pathState: State<string>;
    readonly activeRouteState: AsyncState<RouteMatch | null> = asyncState<RouteMatch | null>(Promise.resolve(null));
    private readonly popStateHandler: () => void;

    constructor({ routeMap, initialPath }: RouterOptions) {
        this.routeMap = routeMap;

        const resolvedInitialPath = initialPath ?? this.getCurrentBrowserPath();
        this.pathState = state(resolvedInitialPath);

        this.popStateHandler = () => {
            this.sync(this.getCurrentBrowserPath());
        };

        window.addEventListener("popstate", this.popStateHandler);
        this.activatedRouteWork(resolvedInitialPath).then(() => {
            // No-op, just to ensure the initial route is processed.
        });
    }

    private async activatedRouteWork(resolvedInitialPath: string) {
        this.activeRouteState.setAsync(this.routeMap.getComponentForRoute(resolvedInitialPath));
    }

    navigate(path: string): void {
        window.history.pushState({}, "", path);
        this.sync(path);
    }

    replace(path: string): void {
        window.history.replaceState({}, "", path);
        this.sync(path);
    }

    async sync(path: string): Promise<void> {
        this.pathState.set(path);
        this.activeRouteState.setAsync(this.routeMap.getComponentForRoute(path));
    }

    destroy(): void {
        window.removeEventListener("popstate", this.popStateHandler);
    }

    private getCurrentBrowserPath(): string {
        return window.location.pathname + window.location.search;
    }
}