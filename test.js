const assert = require('assert');
const { describe, it } = require('node:test');
const { safeMemoryCache } = require('./index');
const { setTimeout } = require('timers/promises');

describe('Safe Memory Cache', () => {
    it('should handle size limit correctly', () => {
        const c = safeMemoryCache({
            limit: 5
        });

        console.log('Empty state', c._get_buckets());
        assert.strictEqual(c.get('a'), undefined, 'expected nothing');

        c.set('a', 'x');
        c.set('a', 'x');
        c.set('a', 'x');
        c.set('a', 'x');

        console.log('After adding the same item multiple times', c._get_buckets());
        assert.strictEqual(c.get('a'), 'x', 'expected b');

        c.set('1', 'x');
        c.set('2', 'x');
        c.set('3', 'x');
        c.set('4', 'x');

        console.log('After adding 4 more items to a collection limited to 5', c._get_buckets());
        assert.strictEqual(c.get('a'), 'x', 'a should be still available from second bucket');
        console.log('After running a .get', c._get_buckets());

        c.set('q1', 'x');
        c.set('q2', 'x');
        c.set('q3', 'x');
        c.set('q4', 'x');
        c.set('q5', 'x');
        c.set('q6', 'x');
        c.set('q7', 'x');

        console.log('After adding even more items', c._get_buckets());
        assert.strictEqual(c.get('a'), undefined, 'a should no longer be in the set');
    });

    it('should implement ttl transparently; clean up its own interval when collected', async () => {
        let count = 0;
        let countSnapshot;
        const rotateListener = (bucket) => {
            count++;
        }
        await (async function () {
            const c = safeMemoryCache({
                limit: 5,
                buckets: 5,
                maxTTL: 100,
                cleanupListener: rotateListener
            });
            c.set('a', 'x');
            await setTimeout(100);
            countSnapshot = count;
        })()
        gc();
        await setTimeout(100);
        assert(countSnapshot > 0, 'expected bucket rotation to ocur while the cache was alive');
        assert.strictEqual(count, countSnapshot, 'expected no bucket rotation after cache was garbage-collected');
    });

    it('should not rotate if all buckets are empty', async () => {
        let count = 0;
        const rotateListener = (bucket) => {
            count++;
        }
            const c = safeMemoryCache({
                limit: 5,
                buckets: 5,
                maxTTL: 100,
                cleanupListener: rotateListener
            });
            await setTimeout(100);
        assert.strictEqual(count, 0, 'expected no bucket rotation to trigger');
    });
});
