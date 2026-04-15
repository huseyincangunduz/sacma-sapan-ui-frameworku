import { NeolitNode } from "../core";

export interface UrlParameters {
    queryParameters: Record<string, string>;
    pathParameters: Record<string, string>;
    childrenPath?: string;
}

export interface PathSegment {
    name: string;
    dynamic: boolean;
}

export interface RouteInfo {
    path: string;
    componentFactory: (parameters: UrlParameters)  => NeolitNode;
    childRoutes?: RouteInfo[];
    pathSegments?: PathSegment[];
}


export interface RouteInfoInternal extends RouteInfo {
    path: string;
    componentFactory: (parameters: UrlParameters) => NeolitNode;
    childRoutes?: RouteInfoInternal[];
    pathSegments: PathSegment[];
}

export interface RouteMatch {
    route: RouteInfoInternal;
    parameters: UrlParameters;
}

export class RouteMap {
    private routes: RouteInfoInternal[] = [];

    constructor(initialRoutes?: RouteInfo[]) {
        if (initialRoutes) {
            this.routes = initialRoutes.map(route => this.createInternalRoute(route));
        }
    }

    registerRoute(
        path: string,
        componentFactory: (parameters: UrlParameters) => NeolitNode,
        childRoutes?: RouteInfo[]
    ) {
        this.routes.push(this.createInternalRoute({ path, componentFactory, childRoutes }));
    }

    getComponentForRoute(path: string, incomingParametersParent?: UrlParameters) : RouteMatch | null {
        const [pathWithoutQuery, queryString = ""] = path.split("?");
        const incomingPathSegments = this.parsePathSegments(pathWithoutQuery);
        const baseParameters = this.createUrlParameters(incomingParametersParent, queryString);
        const match = this.findMatch(this.routes, incomingPathSegments, baseParameters);

        if (match) {
            return match;
        }

        return null;
    }

    private createInternalRoute(route: RouteInfo): RouteInfoInternal {
        return {
            ...route,
            pathSegments: this.parsePathSegments(route.path).map(segment => ({
                name: segment,
                dynamic: segment.startsWith(":")
            })),
            childRoutes: route.childRoutes?.map(childRoute => this.createInternalRoute(childRoute))
        };
    }

    private parsePathSegments(path: string): string[] {
        return path.split("/").filter(Boolean);
    }

    private createUrlParameters(incomingParametersParent?: UrlParameters, queryString?: string): UrlParameters {
        const parameters: UrlParameters = {
            queryParameters: { ...(incomingParametersParent?.queryParameters ?? {}) },
            pathParameters: { ...(incomingParametersParent?.pathParameters ?? {}) }
        };

        if (incomingParametersParent?.childrenPath) {
            parameters.childrenPath = incomingParametersParent.childrenPath;
        }

        if (!queryString) {
            return parameters;
        }

        const queryParams = new URLSearchParams(queryString);
        queryParams.forEach((value, key) => {
            parameters.queryParameters[key] = value;
        });

        return parameters;
    }

    private cloneUrlParameters(parameters: UrlParameters): UrlParameters {
        return {
            queryParameters: { ...parameters.queryParameters },
            pathParameters: { ...parameters.pathParameters },
            childrenPath: parameters.childrenPath
        };
    }

    private findMatch(
        routes: RouteInfoInternal[],
        incomingPathSegments: string[],
        baseParameters: UrlParameters
    ): RouteMatch | null {
        for (const route of routes) {
            const matchedParameters = this.matchRoute(route, incomingPathSegments, baseParameters);

            if (matchedParameters) {
                return {
                    route,
                    parameters: matchedParameters
                };
            }
        }

        return null;
    }

    private matchRoute(
        route: RouteInfoInternal,
        incomingPathSegments: string[],
        baseParameters: UrlParameters
    ): UrlParameters | null {
        if (route.pathSegments.length > incomingPathSegments.length) {
            return null;
        }

        const nextParameters = this.cloneUrlParameters(baseParameters);

        for (let index = 0; index < route.pathSegments.length; index++) {
            const routeSegment = route.pathSegments[index];
            const incomingSegment = incomingPathSegments[index];

            if (!incomingSegment) {
                return null;
            }

            if (routeSegment.dynamic) {
                nextParameters.pathParameters[routeSegment.name.slice(1)] = incomingSegment;
                continue;
            }

            if (routeSegment.name !== incomingSegment) {
                return null;
            }
        }

        const remainingSegments = incomingPathSegments.slice(route.pathSegments.length);

        if (remainingSegments.length === 0) {
            delete nextParameters.childrenPath;
            return nextParameters;
        }

        if (!route.childRoutes || route.childRoutes.length === 0) {
            return null;
        }

        const childrenPath = remainingSegments.join("/");
        const childMatch = this.findMatch(route.childRoutes, remainingSegments, nextParameters);

        if (!childMatch) {
            return null;
        }

        return {
            ...childMatch.parameters,
            childrenPath
        };
    }

}