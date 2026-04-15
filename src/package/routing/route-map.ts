import { NeolitComponent } from "../core";

interface UrlParameters {
    queryParameters: Record<string, string>;
    pathParameters: Record<string, string>;
}

interface PathSegment {
    name: string;
    dynamic: boolean;
}

export interface RouteInfo {
    path: string;
    componentFactory: (parameters: UrlParameters) => NeolitComponent;
    childRoutes?: RouteInfo[];
    pathSegments?: PathSegment[]; // Populated internally for easier matching
}


export interface RouteInfoInternal extends RouteInfo {
    path: string;
    componentFactory: (parameters: UrlParameters) => NeolitComponent;
    childRoutes?: RouteInfo[];
    pathSegments: PathSegment[]; // Populated internally for easier matching
}

export class RouteMap {
    private routes: RouteInfoInternal[] = [];

    registerRoute(path: string, componentFactory: (parameters: UrlParameters) => NeolitComponent) {
        const pathSegments = path.split("/").filter(Boolean).map(segment => ({
            name: segment,
            dynamic: segment.startsWith(":")
        }));
        this.routes.push({ path, componentFactory, pathSegments });
    }

    getComponentForRoute(path: string): NeolitComponent | null {
        // sondaki query parametrelerini ayır
        const [pathWithoutQuery, queryString] = path.split("?");
        const incomingPathSegments = pathWithoutQuery.split("/").filter(Boolean).map(segment => ({
            name: segment,
            dynamic: segment.startsWith(":")
        }));

        const urlParameters: UrlParameters = {
            queryParameters: {},
            pathParameters: {}
        };

        if (queryString) {
            const queryParams = new URLSearchParams(queryString);
            queryParams.forEach((value, key) => {
                urlParameters.queryParameters[key] = value;
            });
        }

        for (const systemRoute of this.routes) {
            // if (route.pathSegments.length !== incomingPathSegments.length) {
            //     continue;
            // }
            // Eğer child rotalar varsa o kendi içinde de aynı işlemi yaparak devam etmesi lazım.
            // Yani önce parent rotayı bulup sonra child rotaya bakması lazım.

            let match = true;
            for (let i = 0; i < incomingPathSegments.length; i++) {
                // dinamik segmentler her zaman eşleşir, bu yüzden onları kontrol etmeden geçiyoruz. Ancak statik segmentler tam olarak eşleşmelidir.
                // eğer son segment ise ve child route'lar varsa, parent rotanın son segmenti tam eşleşmek zorunda değil, çünkü child route'lar parent rotanın devamı olarak kabul edilir. Bu yüzden i == route.pathSegments.length - 1 && route.childRoutes kontrolünü ekliyoruz.
                if (
                    !systemRoute.pathSegments[i].dynamic &&
                    (systemRoute.pathSegments[i].name !== incomingPathSegments[i].name ||
                        i == systemRoute.pathSegments.length - 1 && systemRoute.childRoutes) // Eğer child route varsa, parent rotanın son segmenti tam eşleşmek zorunda değil
                ) {
                    match = false;
                    break;
                }
                if (systemRoute.pathSegments[i].dynamic) {
                    const paramName = systemRoute.pathSegments[i].name.slice(1);
                    urlParameters.pathParameters[paramName] = incomingPathSegments[i].name;
                }
            }

            if (match) {
                return systemRoute.componentFactory(urlParameters);
            }
        }

        return null;
    }

}