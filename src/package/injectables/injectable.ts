import { rootInjector } from "./root-container";
import { Constructable, InjectHolder, InjectionToken } from "./injectholder";

const INJECT_TOKENS_KEY = "__injectTokens__";

export type InjectableScope = "root" | InjectHolder | (() => InjectHolder);

export interface InjectableOptions {
    providedIn?: InjectableScope;
    token?: InjectionToken;
    deps?: InjectionToken[];
    singleton?: boolean;
}

type InjectableClass<T = any> = Constructable<T> & {
    inject?: InjectionToken[];
    [INJECT_TOKENS_KEY]?: InjectionToken[];
};

function setInjectTokens(targetClass: InjectableClass, tokens: InjectionToken[]): void {
    targetClass.inject = tokens;
    targetClass[INJECT_TOKENS_KEY] = tokens;
}

function getInjectTokens(targetClass: InjectableClass): InjectionToken[] {
    if (Array.isArray(targetClass.inject)) {
        return [...targetClass.inject];
    }
    if (Array.isArray(targetClass[INJECT_TOKENS_KEY])) {
        return [...(targetClass[INJECT_TOKENS_KEY] as InjectionToken[])];
    }
    return [];
}

export function Inject(token: InjectionToken): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        if (propertyKey !== undefined) {
            throw new Error("@Inject can only be used on constructor parameters.");
        }

        const targetClass = target as unknown as InjectableClass;
        const existingTokens = getInjectTokens(targetClass);
        existingTokens[parameterIndex] = token;
        setInjectTokens(targetClass, existingTokens);
    };
}

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
            setInjectTokens(targetClass, deps);
        }

        const injector = resolveProvidedIn(providedIn);
        if (injector) {
            injector.registerClass(token ?? targetClass, targetClass, deps, singleton);
        }
    };
}

function resolveProvidedIn(providedIn?: InjectableScope): InjectHolder | null {
    if (!providedIn) {
        return null;
    }

    if (providedIn === "root") {
        return rootInjector;
    }

    if (typeof providedIn === "function") {
        return providedIn();
    }

    return providedIn;
}
