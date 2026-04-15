export type StateOrPlain<T> = State<T> | T;
export class State<DATA> {

    private data: DATA;

    changeListeners: Array<(newData: DATA) => void> = [];

    constructor(initialData: DATA) {
        this.data = initialData;
    }

    get(): DATA {
        return this.data;
    }

    set(newData: DATA): void {
        const triggerFlag = this.determineTriggerIsRequired(newData);
        this.data = newData;

        if (triggerFlag) {
            this.changeListeners.forEach(listener => listener(newData));
        }
    }

    determineTriggerIsRequired(newData: DATA) {
        return (typeof newData === "object" || Array.isArray(newData)) || this.data !== newData;
    }

    update(updater: (currentData: DATA) => DATA): void {
        const newData = updater(this.data);
        const triggerFlag = this.determineTriggerIsRequired(newData);
        this.data = newData;

        if (triggerFlag) {
            this.changeListeners.forEach(listener => listener(newData));
        }
    }

    subscribe(listener: (newData: DATA) => void): void {
        this.changeListeners.push(listener);
    }

    unsubscribe(listener: (newData: DATA) => void): void {
        const index = this.changeListeners.indexOf(listener);
        if (index !== -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    toString(): string {
        return this.data?.toString() ?? "";
    }


}


export class ComputedState<DATA> extends State<DATA> {

    private computeFn: () => DATA;

    constructor(statesListened: StateOrPlain<any>[], computeFn: () => DATA) {
        super(computeFn());
        this.computeFn = computeFn;
        for (const stateOrPlain of statesListened) {
            if (stateOrPlain instanceof State) {
                stateOrPlain.subscribe(() => this.recompute());
            }
        }
    }

    recompute(): void {
        const newData = this.computeFn();
        const triggerFlag = this.determineTriggerIsRequired(newData);
        (this as any).data = newData;

        if (triggerFlag) {
            this.changeListeners.forEach(listener => listener(newData));
        }
    }

}

export function computed<DATA>(statesListened: StateOrPlain<any>[], computeFn: () => DATA): ComputedState<DATA> {
    return new ComputedState(statesListened, computeFn);
}

export function state<DATA>(initialData: DATA): State<DATA> {
    return new State(initialData);
}

export function isTheyEqual<T>(a: StateOrPlain<T>, b: StateOrPlain<T>): boolean {
    const aValue: T = a instanceof State ? a.get() : a;
    const bValue: T = b instanceof State ? b.get() : b;
    return aValue === bValue;
}

export function getStateValue<T>(stateOrPlain: StateOrPlain<T>): T {
    return stateOrPlain instanceof State ? stateOrPlain.get() : stateOrPlain;
}

export function isState<T>(value: any): value is State<T> {
    return value instanceof State;
}

export function isStateArray<T>(value: any): value is State<T[]> {
    return value instanceof State && Array.isArray(value.get());
}

export function isPlainArray<T>(value: any): value is T[] {
    return Array.isArray(value) && value.every(item => !isState(item));
}

export function isStateOrPlainObject<T>(value: any): value is StateOrPlain<T> {
    return (value instanceof State && typeof value.get() === "object" && value.get() !== null) || (typeof value === "object" && value !== null);
}

export function isStateObject<T>(value: any): value is State<T> {
    return value instanceof State && typeof value.get() === "object" && value.get() !== null;
}

export function isPlainObject<T>(value: any): value is T {
    return typeof value === "object" && value !== null && !(value instanceof State);
}

export function isTheyEqualArrays<T>(a: StateOrPlain<T>[], b: StateOrPlain<T>[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((item, index) => isTheyEqual(item, b[index]));
}

export class AsyncState<T> extends State<T> {
    activePromise: Promise<T> | null = null;
    busy = state(false);
    /**
     * Holds the error object if the promise is rejected, otherwise null. 
     * This allows components to react to errors in asynchronous 
     * operations without needing try-catch blocks around their async calls.
     */
    errorObject = state<Error | null>(null);

    constructor(promise: Promise<T>, initialData?: T) {
        super(initialData as T);
        this.setAsync(promise);
    }

    public setAsync(promise: Promise<T>): void {
        if (this.activePromise === promise) {
            return; // Same promise, do nothing
        }
        if (this.busy.get()) {
            console.warn("AsyncState is already processing a promise. Ignoring new promise until the current one resolves.");
            return; // Already processing a promise, ignore new one
            // TODO: Queue the new promise or cancel the previous one if possible, depending on the use case
        }
        // this.set(promise);
        this.activePromise = promise;
        this.busy.set(true);
        promise.then(result => {
            this.set(result);
            this.busy.set(false);
            this.errorObject.set(null);
        }).catch(error => {
            console.error("Error in AsyncState:", error);
            this.errorObject.set(error);
            this.busy.set(false);
        });
    }
}

export function asyncState<T>(promise: Promise<T>, initialData?: T): AsyncState<T> {
    return new AsyncState(promise, initialData) as AsyncState<T>;
}

