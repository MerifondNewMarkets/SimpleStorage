export interface ISimpleStorageOpts {
    namespace?: string;
    storageType?: 'InMemory' | 'SessionStorage' | 'LocalStorage' | Storage;
}
export default class SimpleStorage {
    private readonly _storage;
    private readonly _namespace;
    private _watchers;
    constructor(opts?: ISimpleStorageOpts);
    get(key: string | string[]): any | any[];
    set(key: string | Array<Array<string | any>>, data?: any): void;
    remove(key: string | string[]): void;
    clear(): void;
    watch(key: string, callback: (oldValue: any, newValue: any) => void): SimpleStorage;
    getStorageType(): "string" | "number" | "boolean" | "symbol" | "undefined" | "object" | "function";
    private getNamespacedKey;
    private getSingle;
    private setSingle;
    private removeSingle;
    private getWatchers;
    private notifyWatchers(key, oldValue, newValue);
    private getAllRegisteredWatcherNames();
}
