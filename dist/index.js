"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var in_memory_storage_1 = require("./in-memory-storage");
function isSupported(storageType) {
    try {
        storageType.setItem('localStorage', 'test');
        storageType.removeItem('localStorage');
        return true;
    }
    catch (e) {
        return false;
    }
}
var SimpleStorage = (function () {
    function SimpleStorage(opts) {
        if (opts === void 0) { opts = {
            namespace: '',
            storageType: 'LocalStorage'
        }; }
        var _this = this;
        this._watchers = {};
        this.getNamespacedKey = function (key) { return _this._namespace + ":" + key; };
        this.getSingle = function (key) {
            var namespacedKey = _this.getNamespacedKey(key);
            return JSON.parse(_this._storage.getItem(namespacedKey));
        };
        this.setSingle = function (key, data) {
            var valueBefore = _this.getSingle(key);
            var namespacedKey = _this.getNamespacedKey(key);
            _this._storage.setItem(namespacedKey, JSON.stringify(data));
            _this.notifyWatchers(key, valueBefore, data);
        };
        this.removeSingle = function (key) {
            var valueBefore = _this.getSingle(key);
            var namespacedKey = _this.getNamespacedKey(key);
            _this._storage.removeItem(namespacedKey);
            _this.notifyWatchers(key, valueBefore, null);
        };
        this.getWatchers = function (key, forceCreate) {
            if (forceCreate === void 0) { forceCreate = false; }
            return (forceCreate)
                ? _this._watchers[key] || (_this._watchers[key] = [])
                : _this._watchers[key];
        };
        switch (opts.storageType) {
            case 'InMemory':
                this._storage = in_memory_storage_1.default;
                break;
            case 'SessionStorage':
                this._storage = isSupported(window.sessionStorage)
                    ? window.sessionStorage
                    : in_memory_storage_1.default;
                break;
            case 'LocalStorage':
                this._storage = isSupported(window.localStorage)
                    ? window.localStorage
                    : in_memory_storage_1.default;
                break;
            default:
                if (typeof opts.storageType === 'string') {
                    throw new Error("Unsupported storage type!");
                }
                this._storage = isSupported(opts.storageType)
                    ? opts.storageType
                    : in_memory_storage_1.default;
        }
        this._namespace = opts.namespace;
    }
    SimpleStorage.prototype.get = function (key) {
        return (Array.isArray(key))
            ? key.map(this.getSingle)
            : this.getSingle(key);
    };
    SimpleStorage.prototype.set = function (key, data) {
        var _this = this;
        if (!Array.isArray(key)) {
            this.setSingle(key, data);
            return;
        }
        if (data !== void 0) {
            throw new Error("Cannot set both array key and data!");
        }
        key.forEach(function (pair) {
            var k = pair[0], v = pair[1];
            _this.setSingle(k, v);
        });
    };
    SimpleStorage.prototype.remove = function (key) {
        if (!Array.isArray(key)) {
            key = [key];
        }
        key.forEach(this.removeSingle);
    };
    SimpleStorage.prototype.clear = function () {
        var _this = this;
        var valuesAndWatchers = this.getAllRegisteredWatcherNames()
            .map(function (x) {
            return { key: x, value: _this.getSingle(x) };
        });
        this._storage.clear();
        valuesAndWatchers.forEach(function (x) { return _this.notifyWatchers(x.key, x.value, null); });
    };
    SimpleStorage.prototype.watch = function (key, callback) {
        this.getWatchers(key, true)
            .push(callback);
        return this;
    };
    SimpleStorage.prototype.getStorageType = function () {
        return typeof (this._storage);
    };
    SimpleStorage.prototype.notifyWatchers = function (key, oldValue, newValue) {
        var watchers = this.getWatchers(key);
        if (watchers != null) {
            watchers.forEach(function (watcher) { return watcher(oldValue, newValue); });
        }
    };
    SimpleStorage.prototype.getAllRegisteredWatcherNames = function () {
        return Object.getOwnPropertyNames(this._watchers);
    };
    return SimpleStorage;
}());
exports.default = SimpleStorage;
//# sourceMappingURL=index.js.map