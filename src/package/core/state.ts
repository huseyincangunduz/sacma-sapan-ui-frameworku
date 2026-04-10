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
        this.data = newData;

        this.changeListeners.forEach(listener => listener(newData));
    }

    subscribe(listener: (newData: DATA) => void): void {
        this.changeListeners.push(listener);
    }
}