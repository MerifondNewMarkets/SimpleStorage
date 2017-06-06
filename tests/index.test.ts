import SimpleStorage from '../src/index';
import InMemoryStorage from '../src/in-memory-storage';

const faultyStorageTypeProvider : Storage = {
    getItem(key : string) {
        return null;
    },
    setItem(key: string, data : any){},
    removeItem(key: string){},
    clear(){},
    get length() : number {
        return 0;
    },
    key(index: number): string | null {
        return null;
    }
}

describe('The basics', () => {
    test('should export', () => {
        expect(SimpleStorage).toBeDefined();
    });

    test('should create new instance', () => {
        expect(new SimpleStorage()).toBeInstanceOf(SimpleStorage);
    });

    test('should fall back to memory storage on unsupported storage type', () => {
        expect(new SimpleStorage({ storageType : faultyStorageTypeProvider }).getStorageType())
            .toEqual(typeof(InMemoryStorage));
    });
});

describe('Basic CRUD', () => {
    test('should set/get value', () => {
        const foo = new SimpleStorage()

        expect(foo.set('foo', {})).toBeUndefined();
        expect(foo.set('bar', 'hello')).toBeUndefined();
        expect(foo.set('baz', 5)).toBeUndefined();

        expect(foo.get('foo')).toMatchObject({});
        expect(foo.get('bar')).toBe('hello');
        expect(foo.get('baz')).toBe(5);
    });

    test('should remove value', () => {
        const foo = new SimpleStorage();

        foo.set('foo', 1);

        expect(foo.get('foo')).toBe(1);
        expect(foo.remove('foo')).toBeUndefined();
        expect(foo.get('foo')).toBeNull();
    });

    test('should clear storage', () => {
        const foo = new SimpleStorage();

        foo.set('foo', 1);

        expect(foo.get('foo')).toBe(1);

        foo.clear();

        expect(foo.get('foo')).toBeNull();
    });

    test('should handle removal of non-existing value without throwing', () => {
        const foo = new SimpleStorage();

        expect(foo.remove('foo')).toBeUndefined();
        expect(foo.get('foo')).toBeNull();
    });
});

describe('Multi-CRUD', () => {
    test('multi-set should work', () => {
        const inst = new SimpleStorage();

        inst.set([ ['foo', 'bar'], ['baz', 'bing'] ]);

        expect(inst.get('foo')).toBe('bar');
        expect(inst.get('baz')).toBe('bing');
    });

    test('multi-set should fail with two arguments', () => {
        const inst = new SimpleStorage();

        expect(() => inst.set([ ['foo', 'bar'], ['baz', 'bing'] ], 'foo'))
            .toThrow();
    });

    test('multi-get should work', () => {
        const inst = new SimpleStorage();

        inst.set([ ['foo', 'bar'], ['baz', 'bing'] ]);

        expect(inst.get(['foo', 'baz'])).toEqual(['bar', 'bing']);
    });

    test('multi-remove should work', () => {
        const inst = new SimpleStorage();

        inst.set('foo', 1);
        inst.set('bar', 2);
        inst.set('baz', 3);
        
        expect(inst.get('foo')).toEqual(1);
        expect(inst.get('bar')).toEqual(2);
        expect(inst.get('baz')).toEqual(3);

        inst.remove(['foo', 'baz']);

        expect(inst.get('foo')).toBeNull();
        expect(inst.get('bar')).toEqual(2);
        expect(inst.get('baz')).toBeNull();
    });
});

describe('Namespacing', () => {
    test('namespaces should not collide', () => {
        const inst1 = new SimpleStorage({ namespace : 'foo' });
        const inst2 = new SimpleStorage({ namespace : 'bar' });

        inst1.set('foo', 1);
        expect(inst1.get('foo')).toBe(1);
        expect(inst2.get('foo')).toBeNull();

        inst2.set('foo', 2);
        expect(inst1.get('foo')).toBe(1);
        expect(inst2.get('foo')).toBe(2);

        inst1.remove('foo');
        expect(inst1.get('foo')).toBeNull();
        expect(inst2.get('foo')).toBe(2);
    });

    test('two instances in same namespace should share data', () => {
        const inst1 = new SimpleStorage({ namespace : 'foo' });
        const inst2 = new SimpleStorage({ namespace : 'foo' });

        inst1.set('foo', 1);
        expect(inst1.get('foo')).toBe(1);
        expect(inst2.get('foo')).toBe(1);

        inst2.set('foo', 2);
        expect(inst1.get('foo')).toBe(2);
        expect(inst2.get('foo')).toBe(2);

        inst1.remove('foo');
        expect(inst1.get('foo')).toBeNull();
        expect(inst2.get('foo')).toBeNull();
    });
});

describe("Watching for changes is good for you", () => {
    test('should be able to watch for changes', () => {
        const inst = new SimpleStorage();
        
        let oldVal = null;
        let newVal = null;
        let execed = 0;

        inst.watch('foo', (oldValue, newValue) => {
            oldVal = oldValue;
            newVal = newValue;
            execed++;
        });

        inst.set('foo', 1);
        inst.set('bar', 2);
        inst.set('baz', 3);
        
        expect(oldVal).toEqual(null);
        expect(newVal).toEqual(1);
        expect(execed).toEqual(1);

        inst.set('foo', 9);

        expect(oldVal).toEqual(1);
        expect(newVal).toEqual(9);
        expect(execed).toEqual(2);

        inst.remove('foo');

        expect(oldVal).toEqual(9);
        expect(newVal).toEqual(null);
        expect(execed).toEqual(3);
    });

    test('changes should fire on clear', () => {
        const inst = new SimpleStorage();

        let oldVal = null;
        let newVal = null;
        let execed = 0;

        inst.watch('foo', (oldValue, newValue) => {
            oldVal = oldValue;
            newVal = newValue;
            execed++;
        });


        inst.set('foo', 1);

        expect(oldVal).toBe(null);
        expect(newVal).toBe(1);
        expect(execed).toBe(1);

        inst.clear();

        expect(oldVal).toBe(1);
        expect(newVal).toBe(null);
        expect(execed).toBe(2);
    });


    describe("Performance could be f*cked by too many watchers", () => {
        test('lots of watchers should not kill it', () => {
            const inst = new SimpleStorage();
            
            let oldVal = null;
            let newVal = null;
            let execed = 0;

            for (let i = 0; i < 100000; i++)
            {
                inst.watch('foo', (oldValue, newValue) => {
                    oldVal = oldValue;
                    newVal = newValue;
                    execed++;
                });
            }

            inst.set('foo', 1);
            inst.set('bar', 2);
            inst.set('baz', 3);
            
            expect(oldVal).toEqual(null);
            expect(newVal).toEqual(1);
            expect(execed).toEqual(100000);

            inst.set('foo', 9);

            expect(oldVal).toEqual(1);
            expect(newVal).toEqual(9);
            expect(execed).toEqual(200000);

            inst.remove('foo');

            expect(oldVal).toEqual(9);
            expect(newVal).toEqual(null);
            expect(execed).toEqual(300000);
        });

        test('lots of watchers and fires should not kill it', () => {
            const inst = new SimpleStorage();
            
            let oldVal = null;
            let newVal = null;
            let execed = 0;

            for (let i = 0; i < 10000; i++)
            {
                inst.watch('foo', (oldValue, newValue) => {
                    oldVal = oldValue;
                    newVal = newValue;
                    execed++;
                });
            }

            for (let i = 0; i < 10000; i++)
            {
                inst.set('foo', 1);
            }

            expect(execed).toEqual(10000 * 10000);
        });
    });
});