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

export function isStateOrPlain<T>(value: any): value is StateOrPlain<T> {
    return value instanceof State || typeof value !== "object" || value === null;
}

export function isStateOrPlainArray<T>(value: any): value is StateOrPlain<T>[] {
    return Array.isArray(value) && value.every(item => isStateOrPlain(item));
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

