let memoryStorage : { [key: string] : string } = {};

const inMemoryStorageProvider : Storage = {
    getItem (key : string) : string | null {
        return memoryStorage[key] || null;
    },

    setItem (key: string, data : string) : void {
        memoryStorage[key] = data;
    },

    removeItem (key: string) : void
    {
        if (key in memoryStorage === false)
        {
            return;
        }

        delete memoryStorage[key];
    },

    clear() : void {
        memoryStorage = {};
    },

    get length() : number {
        return Object.getOwnPropertyNames(memoryStorage).length;
    },

    key(index: number): string | null {
        return Object.getOwnPropertyNames(memoryStorage)[index];
    }
};

export default inMemoryStorageProvider;