import { AsyncState, asyncState, State, state } from "../core";
import { RouteMap, RouteMatch } from "./route-map";

export interface RouterOptions {
    routeMap: RouteMap;
    initialPath?: string;
    parentPath?: string;
}

export class Router {
    readonly routeMap: RouteMap;
    readonly pathState: State<string>;
    readonly activeRouteState: AsyncState<RouteMatch | null> = asyncState<RouteMatch | null>(Promise.resolve(null));
    private readonly popStateHandler: () => void;
    private readonly parentPath: string;

    constructor({ routeMap, initialPath, parentPath }: RouterOptions) {
        this.routeMap = routeMap;
        this.parentPath = parentPath ?? "";

        const resolvedInitialPath = initialPath ?? this.getCurrentBrowserPath();
        this.pathState = state(resolvedInitialPath);

        this.popStateHandler = () => {
            this.sync(this.resolveLocalPath(this.getCurrentBrowserPath()));
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
        window.history.pushState({}, "", this.resolveBrowserPath(path));
        this.sync(path);
    }

    replace(path: string): void {
        window.history.replaceState({}, "", this.resolveBrowserPath(path));
        this.sync(path);
    }

    async sync(path: string): Promise<void> {
        this.pathState.set(path);
        this.activeRouteState.setAsync(this.routeMap.getComponentForRoute(path));
    }

    destroy(): void {
        window.removeEventListener("popstate", this.popStateHandler);
    }

    private resolveBrowserPath(path: string): string {
        if (!this.parentPath) return path;
        return `${this.parentPath}/${path}`;
    }

    private resolveLocalPath(fullPath: string): string {
        if (!this.parentPath) return fullPath;
        const [pathPart, queryPart] = fullPath.split("?");
        if (pathPart.startsWith(this.parentPath)) {
            const local = pathPart.slice(this.parentPath.length).replace(/^\//, "") || "/";
            return queryPart ? `${local}?${queryPart}` : local;
        }
        return fullPath;
    }

    private getCurrentBrowserPath(): string {
        return window.location.pathname + window.location.search;
    }
}