"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var memoryStorage = {};
var inMemoryStorageProvider = {
    getItem: function (key) {
        return memoryStorage[key] || null;
    },
    setItem: function (key, data) {
        memoryStorage[key] = data;
    },
    removeItem: function (key) {
        if (key in memoryStorage === false) {
            return;
        }
        delete memoryStorage[key];
    },
    clear: function () {
        memoryStorage = {};
    },
    get length() {
        return Object.getOwnPropertyNames(memoryStorage).length;
    },
    key: function (index) {
        return Object.getOwnPropertyNames(memoryStorage)[index];
    }
};
exports.default = inMemoryStorageProvider;
//# sourceMappingURL=in-memory-storage.js.map