export type Constructable<T> = new (...args: any[]) => T;
export type InjectionToken<T = unknown> = string | symbol | object | Constructable<T>;

export interface ClassProvider<T> {
    useClass: Constructable<T>;
    deps?: InjectionToken[];
    singleton?: boolean;
}

export interface ValueProvider<T> {
    useValue: T;
}

export interface FactoryProvider<T> {
    useFactory: (injector: InjectHolder) => T;
    singleton?: boolean;
}

export type Provider<T> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;

interface ProviderRecord<T> {
    provider: Provider<T>;
    cached?: T;
    hasCache: boolean;
}

export class InjectHolder {
    private providerMap: Map<InjectionToken, ProviderRecord<any>>;
    private resolvingStack: InjectionToken[];

    constructor() {
        this.providerMap = new Map();
        this.resolvingStack = [];
    }

    register<T>(token: InjectionToken<T>, providerOrValue: Provider<T> | T): void {
        const provider = this.toProvider(providerOrValue);
        this.providerMap.set(token, {
            provider,
            hasCache: false,
        });
    }

    registerClass<T>(token: InjectionToken<T>, useClass: Constructable<T>, deps?: InjectionToken[], singleton = true): void {
        this.register(token, { useClass, deps, singleton });
    }

    registerFactory<T>(token: InjectionToken<T>, useFactory: (injector: InjectHolder) => T, singleton = true): void {
        this.register(token, { useFactory, singleton });
    }

    registerValue<T>(token: InjectionToken<T>, useValue: T): void {
        this.register(token, { useValue });
    }

    resolve<T>(token: InjectionToken<T>): T {
        const providerRecord = this.getOrCreateProviderRecord(token);

        if (providerRecord.hasCache) {
            return providerRecord.cached as T;
        }

        if (this.resolvingStack.includes(token)) {
            const cycle = [...this.resolvingStack, token].map((item) => this.describeToken(item)).join(" -> ");
            throw new Error(`Circular dependency detected: ${cycle}`);
        }

        this.resolvingStack.push(token);
        try {
            const instance = this.instantiateProvider(providerRecord.provider);
            if (this.shouldCache(providerRecord.provider)) {
                providerRecord.cached = instance;
                providerRecord.hasCache = true;
            }
            return instance;
        } finally {
            this.resolvingStack.pop();
        }
    }

    private getOrCreateProviderRecord<T>(token: InjectionToken<T>): ProviderRecord<T> {
        const existing = this.providerMap.get(token) as ProviderRecord<T> | undefined;
        if (existing) {
            return existing;
        }

        if (this.isConstructable(token)) {
            const autoProvider: ProviderRecord<T> = {
                provider: { useClass: token as Constructable<T>, singleton: true },
                hasCache: false,
            };
            this.providerMap.set(token, autoProvider as ProviderRecord<any>);
            return autoProvider;
        }

        throw new Error(`No injectable found for token: ${this.describeToken(token)}`);
    }

    private instantiateProvider<T>(provider: Provider<T>): T {
        if (this.isValueProvider(provider)) {
            return provider.useValue;
        }

        if (this.isFactoryProvider(provider)) {
            return provider.useFactory(this);
        }

        const deps = provider.deps ?? this.readStaticInjectTokens(provider.useClass);
        const args = deps.map((depToken) => this.resolve(depToken));
        return new provider.useClass(...args);
    }

    private shouldCache<T>(provider: Provider<T>): boolean {
        if (this.isValueProvider(provider)) {
            return true;
        }
        if (this.isFactoryProvider(provider)) {
            return provider.singleton !== false;
        }
        return provider.singleton !== false;
    }

    private toProvider<T>(providerOrValue: Provider<T> | T): Provider<T> {
        if (this.isProvider(providerOrValue)) {
            return providerOrValue;
        }

        if (this.isConstructable(providerOrValue)) {
            return { useClass: providerOrValue, singleton: true } as Provider<T>;
        }

        return { useValue: providerOrValue as T };
    }

    private readStaticInjectTokens<T>(targetClass: Constructable<T>): InjectionToken[] {
        const injectTokens = (targetClass as any).inject;
        const decoratorInjectTokens = (targetClass as any).__injectTokens__;
        const tokens = Array.isArray(injectTokens) ? injectTokens : decoratorInjectTokens;

        if (!Array.isArray(tokens)) {
            return [];
        }

        return tokens;
    }

    private describeToken(token: InjectionToken): string {
        if (typeof token === "string") return token;
        if (typeof token === "symbol") return token.toString();
        if (this.isConstructable(token)) return token.name || "[AnonymousClass]";
        return Object.prototype.toString.call(token);
    }

    private isConstructable<T>(value: unknown): value is Constructable<T> {
        return typeof value === "function";
    }

    private isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
        return Object.prototype.hasOwnProperty.call(provider, "useValue");
    }

    private isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
        return Object.prototype.hasOwnProperty.call(provider, "useFactory");
    }

    private isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
        return Object.prototype.hasOwnProperty.call(provider, "useClass");
    }

    private isProvider<T>(value: Provider<T> | T): value is Provider<T> {
        if (typeof value !== "object" || value === null) {
            return false;
        }

        return this.isValueProvider(value as Provider<T>)
            || this.isFactoryProvider(value as Provider<T>)
            || this.isClassProvider(value as Provider<T>);
    }
}
