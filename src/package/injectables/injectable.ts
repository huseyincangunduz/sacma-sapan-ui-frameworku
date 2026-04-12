import { rootInjector } from "./root-container";
import { Constructable, InjectionToken } from "./injectholder";

export interface InjectableOptions {
    providedIn?: "root";
    token?: InjectionToken;
    deps?: InjectionToken[];
    singleton?: boolean;
}

type InjectableClass<T = any> = Constructable<T> & { inject?: InjectionToken[] };

export function Injectable(options: InjectableOptions = {}): ClassDecorator {
    const {
        providedIn,
        token,
        deps,
        singleton = true,
    } = options;

    return (target) => {
        const targetClass = target as unknown as InjectableClass;

        if (deps) {
            targetClass.inject = deps;
        }

        if (providedIn === "root") {
            rootInjector.registerClass(token ?? targetClass, targetClass, deps, singleton);
        }
    };
}
