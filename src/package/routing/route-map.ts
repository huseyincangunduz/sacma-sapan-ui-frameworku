import { NeolitNode } from "../core";

export interface UrlParameters {
    queryParameters: Record<string, string>;
    pathParameters: Record<string, string>;
    childrenPath?: string;

}

export interface PathSegment {
    name: string;
    dynamic: boolean;
    reservedForChildren: boolean;
}

export interface RouteInfo {
    path: string;
    componentFactory: (parameters: UrlParameters) => NeolitNode;
    pathSegments?: PathSegment[];
    // Eğer false ya da string dönerse, yönlendirme engellenir. String dönerse bu string'e yönlendirilir.
    canActivate?: (parameters: UrlParameters) => boolean | string | Promise<boolean | string>;
}


export interface RouteInfoInternal extends RouteInfo {
    path: string;
    componentFactory: (parameters: UrlParameters) => NeolitNode;
    childRoutes?: RouteInfoInternal[];
    pathSegments: PathSegment[];
    canActivate?: (parameters: UrlParameters) => boolean | string | Promise<boolean | string>;
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
    ) {
        this.routes.push(this.createInternalRoute({ path, componentFactory }));
    }

    async getComponentForRoute(path: string, incomingParametersParent?: UrlParameters): Promise<RouteMatch | null> {
        const [pathWithoutQuery, queryString = ""] = path.split("?");
        const incomingPathSegments = this.parsePathSegments(pathWithoutQuery);
        const baseParameters = this.createUrlParameters(incomingParametersParent, queryString);
        const match = await this.findMatch(this.routes, incomingPathSegments, baseParameters);

        if (match) {
            if (match.route.canActivate) {
                const canActivateResult = await match.route.canActivate(match.parameters);

                if (typeof canActivateResult === "string") {
                    return this.getComponentForRoute(canActivateResult);
                }

                if (canActivateResult === false) {
                    return null;
                }
            }
            return match;
        }

        return null;
    }

    private createInternalRoute(route: RouteInfo): RouteInfoInternal {
        return {
            ...route,
            pathSegments: this.parsePathSegments(route.path).map(segment => ({
                name: segment,
                dynamic: segment.startsWith(":"),
                reservedForChildren: segment === "**"
            })),
            // Childroutes ** ile belirtilebilir. Gerisi component altında yüklenebilir.
            // childRoutes: route.childRoutes?.map(childRoute => this.createInternalRoute(childRoute))
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

    private async findMatch(
        routes: RouteInfoInternal[],
        incomingPathSegments: string[],
        baseParameters: UrlParameters
    ): Promise<RouteMatch | null> {
        for (const route of routes) {
            const matchedParameters = await this.matchRoute(route, incomingPathSegments, baseParameters);

            if (matchedParameters) {
                return {
                    route,
                    parameters: matchedParameters
                };
            }
        }

        return null;
    }

    private async matchRoute(
        route: RouteInfoInternal,
        incomingPathSegments: string[],
        baseParameters: UrlParameters
    ): Promise<UrlParameters | null> {
        if (route.pathSegments.filter(a => !a.reservedForChildren).length > incomingPathSegments.length) {
            return null;
        }

        const nextParameters = this.cloneUrlParameters(baseParameters);
        let hasWildcard = false;
        for (let index = 0; index < route.pathSegments.length; index++) {
            const routeSegment = route.pathSegments[index];
            const incomingSegment = incomingPathSegments[index];
            if (route.pathSegments[index + 1]?.reservedForChildren) {
                // Eğer ** ile bitiyorsa artık gerisini componente havale edeceğiz. Orada kendine göre ayarlar artık
                hasWildcard = true;
                break;
            }
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
        const remainingSegments = incomingPathSegments.slice((route.pathSegments.length - (hasWildcard ? 1 : 0)));
        if (remainingSegments.length === 0 || hasWildcard) {
            if (!hasWildcard) {
                // 
                delete nextParameters.childrenPath;

            } else {
                nextParameters.childrenPath = remainingSegments.join("/")
            }

            return nextParameters;
        }
        return null;

    }

}