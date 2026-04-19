export type StateOrPlain<T> = State<T> | T;
export class State<DATA> {

    private data: DATA;

    changeListeners: Array<(newData: DATA, oldData?: DATA) => void> = [];

    constructor(initialData: DATA) {
        this.data = initialData;
    }

    get(): DATA {
        return this.data;
    }

    set(_newData: DATA | State<DATA>): void {
        const oldValue = this.data;
        const newData = _newData instanceof State ? _newData.get() : _newData;
        const triggerFlag = this.determineTriggerIsRequired(newData);
        this.data = newData;

        if (triggerFlag) {
            this.changeListeners.forEach(listener => listener(this.data, oldValue));
        }

        if (_newData instanceof State) {
            _newData.subscribe((newData) => {
                const triggerFlag = this.determineTriggerIsRequired(newData);
                this.data = newData;

                if (triggerFlag) {
                    this.changeListeners.forEach(listener => listener(this.data, oldValue));
                }
            });
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
            this.changeListeners.forEach(listener => listener(newData, this.data));
        }
    }

    map<NEW_DATA>(mapper: (currentData: DATA) => NEW_DATA): State<NEW_DATA> {
        const mappedState = new State<NEW_DATA>(mapper(this.data));
        this.subscribe((newData) => {
            const mappedValue = mapper(newData);
            mappedState.set(mappedValue);
        });
        return mappedState;
    }

    subscribe(listener: (newData: DATA, oldData?: DATA) => void): void {
        this.changeListeners.push(listener);
    }

    unsubscribe(listener: (newData: DATA, oldData?: DATA) => void): void {
        const index = this.changeListeners.indexOf(listener);
        if (index !== -1) {
            this.changeListeners.splice(index, 1);
        }
    }

    toString(): string {
        return this.data?.toString() ?? "";
    }

    arrayMap<NEW_DATA>(mapper: (item: any, index: number) => NEW_DATA): State<NEW_DATA[]> {
        if (!Array.isArray(this.data)) {
            throw new Error("Current state data is not an array");
        }
        const mappedState = new State<NEW_DATA[]>(this.data.map(mapper));
        this.subscribe((newData) => {
            if (!Array.isArray(newData)) {
                throw new Error("New state data is not an array");
            }
            const mappedValue = newData.map(mapper);
            mappedState.set(mappedValue);
        });
        return mappedState;
    }

    arrayFilter(predicate: (item: any, index: number) => boolean): State<any[]> {
        if (!Array.isArray(this.data)) {
            throw new Error("Current state data is not an array");
        }
        const filteredState = new State<any[]>(this.data.filter(predicate));
        this.subscribe((newData) => {
            if (!Array.isArray(newData)) {
                throw new Error("New state data is not an array");
            }
            const filteredValue = newData.filter(predicate);
            filteredState.set(filteredValue);
        });
        return filteredState;
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
        const oldValue = this.get();
        const newData = this.computeFn();
        const triggerFlag = this.determineTriggerIsRequired(newData);
        (this as any).data = newData;

        if (triggerFlag) {
            this.changeListeners.forEach(listener => listener(newData, oldValue));
        }
    }

}

export class CombinedStateUpdateInfo {
    constructor(public updatedState: StateOrPlain<any>, public newValue: any, public oldValue: any = null) {
    }
}

export class CombinedState extends State<CombinedStateUpdateInfo> {



    constructor(statesListened: StateOrPlain<any>[]) {
        super({} as CombinedStateUpdateInfo);
        for (const stateOrPlain of statesListened) {
            if (stateOrPlain instanceof State) {
                stateOrPlain.subscribe(() => this.recompute(new CombinedStateUpdateInfo(stateOrPlain, stateOrPlain.get(), stateOrPlain.get())));
            }
        }
    }

    recompute(updateInfo: CombinedStateUpdateInfo): void {
        this.set(updateInfo);
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
    initialData: T | undefined;
    /**
     * Holds the error object if the promise is rejected, otherwise null. 
     * This allows components to react to errors in asynchronous 
     * operations without needing try-catch blocks around their async calls.
     */
    errorObject = state<Error | null>(null);

    constructor(promise: Promise<T>, initialData?: T) {
        super(initialData as T);
        this.setAsync(promise);
        this.initialData = initialData;
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
        this.errorObject.set(null); // Reset error state when starting a new async operation
        this.busy.set(true);
        // this.set(promise);
        this.activePromise = promise;
        promise.then(result => {
            this.errorObject.set(null);
            this.busy.set(false);
            this.set(result);
        }).catch(error => {
            this.errorObject.set(error);
            this.busy.set(false);
            this.set(this.initialData as T); // Optionally reset the data to initialData or keep the old data depending on the use case
            console.error("Error in AsyncState:", error);
        });
    }

    public allInComputed(): ComputedState<{ data: T; busy: boolean; error: Error | null }> {
        return computed([this, this.busy, this.errorObject], () => ({
            data: this.busy.get() ? this.initialData as T : this.get(),
            busy: this.busy.get(),
            error: this.errorObject.get(),
        }));
    }
}

export function asyncState<T>(promise: Promise<T>, initialData?: T): AsyncState<T> {
    return new AsyncState(promise, initialData) as AsyncState<T>;
}

