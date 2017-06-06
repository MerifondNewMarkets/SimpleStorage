import inMemoryStorage from './in-memory-storage';

// Checks (haha) whether the selected storage provider is supported by the environment.
function isSupported(storageType : Storage) : boolean {
    try {
        storageType.setItem('localStorage', 'test');
        storageType.removeItem('localStorage');
        return true;
    }
    catch (e)
    {
        return false;
    }
}

// Options object interface
export interface ISimpleStorageOpts
{
    namespace?   : string;
    storageType? : 'InMemory' | 'SessionStorage' | 'LocalStorage' | Storage;
}

export default class SimpleStorage {
    // Instance vars
    private readonly _storage   : Storage;
    private readonly _namespace : string;
    
    private _watchers : { [key:string] : ((oldValue : any, newValue : any)=>void)[] } = {};

    // Constructor
    constructor (opts : ISimpleStorageOpts = {
        namespace   : '',
        storageType : 'LocalStorage'
    }){
        switch (opts.storageType)
        {
            case 'InMemory':
                this._storage = inMemoryStorage;
                break;
            case 'SessionStorage':
                this._storage = isSupported(window.sessionStorage)
                    ? window.sessionStorage
                    : inMemoryStorage;
                break;
            case 'LocalStorage' :
                this._storage = isSupported(window.localStorage)
                    ? window.localStorage
                    : inMemoryStorage;
                break;
            default:
                if (typeof opts.storageType === 'string')
                {
                    throw new Error("Unsupported storage type!");
                }
                this._storage = isSupported(opts.storageType)
                    ? opts.storageType
                    : inMemoryStorage;
        }

        this._namespace = opts.namespace;
    }

    // Public API

    get(key : string | string[]) : any | any[] {
        return (Array.isArray(key))
            ? key.map(this.getSingle)
            : this.getSingle(key);
    }

    set(key: string | Array<Array<string | any>>, data? : any) : void {
        if (!Array.isArray(key))
        {
            this.setSingle(key, data);
            return;
        }

        if (data !== void 0)
        {
            throw new Error("Cannot set both array key and data!");
        }

        key.forEach(pair => { 
            const [ k, v ] = pair;
            this.setSingle(k, v);
        });
    }

    remove(key : string | string[]) {
        if (!Array.isArray(key))
        {
            key = [key];
        }

        key.forEach(this.removeSingle);
    }

    clear() {
        let valuesAndWatchers = this.getAllRegisteredWatcherNames()
            .map(x => {
                return { key : x, value : this.getSingle(x) }
            });

        this._storage.clear();

        valuesAndWatchers.forEach(x => this.notifyWatchers(x.key, x.value, null));
    }

    watch(key : string, callback : (oldValue : any, newValue : any)=>void) : SimpleStorage {
        this.getWatchers(key, true)
            .push(callback);

        return this;
    }

    getStorageType() {
        return typeof(this._storage);
    }

    // Private helpers
    // Do NOT remove the fat arrow; otherwise, map() operations will fail! 
    private getNamespacedKey = (key : string) : string => `${this._namespace}:${key}`;

    // Do NOT remove the fat arrow; otherwise, map() operations will fail! 
    private getSingle = (key : string) : any => {
        const namespacedKey = this.getNamespacedKey(key);
        return JSON.parse(this._storage.getItem(namespacedKey));
    };

    // Do NOT remove the fat arrow; otherwise, map() operations will fail! 
    private setSingle = (key : string, data : any) => {
        const valueBefore = this.getSingle(key);

        const namespacedKey = this.getNamespacedKey(key);
        this._storage.setItem(namespacedKey, JSON.stringify(data));

        this.notifyWatchers(key, valueBefore, data);
    };

    // Do NOT remove the fat arrow; otherwise, map() operations will fail! 
    private removeSingle = (key : string) => {
        const valueBefore = this.getSingle(key);

        const namespacedKey = this.getNamespacedKey(key);
        this._storage.removeItem(namespacedKey);

        this.notifyWatchers(key, valueBefore, null);
    };

    // Do NOT remove the fat arrow; otherwise, map() operations will fail! 
    private getWatchers = (key : string, forceCreate = false) => {
        return (forceCreate)
            ? this._watchers[key] || (this._watchers[key] = [])
            : this._watchers[key];
    }

    private notifyWatchers(key : string, oldValue : any, newValue : any) {
        let watchers = this.getWatchers(key);
        if (watchers != null)
        {
            watchers.forEach(watcher => watcher(oldValue, newValue));
        }
    }

    private getAllRegisteredWatcherNames() : string[] {
        return Object.getOwnPropertyNames(this._watchers);
    }
}