import { Constructable, InjectHolder, InjectionToken } from "./injectholder";

export const rootInjector = new InjectHolder();

export function inject<T>(token: InjectionToken<T>, injector: InjectHolder = rootInjector): T {
    return injector.resolve(token);
}

export function createInjector(parent?: InjectHolder): InjectHolder {
    return new InjectHolder(parent);
}

export function provideValue<T>(token: InjectionToken<T>, value: T, injector: InjectHolder = rootInjector): void {
    injector.registerValue(token, value);
}

export function provideClass<T>(
    token: InjectionToken<T>,
    useClass: Constructable<T>,
    injector: InjectHolder = rootInjector,
): void {
    injector.registerClass(token, useClass);
}
