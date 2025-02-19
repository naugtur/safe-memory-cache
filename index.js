const { create, freeze, defineProperties } = Object
const { bind } = Function.prototype
const uncurryThis = bind.bind(bind.call)
const { setTimeout, setInterval, clearInterval } = globalThis

const arrayUnshift = uncurryThis(Array.prototype.unshift)
const arrayPush = uncurryThis(Array.prototype.push)
const arrayPop = uncurryThis(Array.prototype.pop)

const mapHas = uncurryThis(Map.prototype.has)
const mapGet = uncurryThis(Map.prototype.get)
const mapSet = uncurryThis(Map.prototype.set)

const priv = new WeakMap()
const getPriv = priv.get.bind(priv)
const setPriv = priv.set.bind(priv)

function spawnBucket(buckets) {
    arrayUnshift(buckets, new Map())
}

function rotateBuckets(buckets, rotationHook) {
    let i = 0
    while (i<buckets.length && buckets[i].size === 0) {
        i++
    }
    if (i === buckets.length) {
        // nothing to do, all buckets empty
        return
    }
    const dropped = arrayPop(buckets)
    spawnBucket(buckets)
    if (rotationHook) {
        rotationHook(dropped)
    }
}

var bucketsProto = {
    clear: function clear() {
        const buckets = []
        setPriv(this, buckets)
        for (var i = 0; i < this.N; i++) {
            spawnBucket(buckets)
        }
    },
    set: function set(key, value) {
        const buckets = getPriv(this)
        if (!(mapHas(buckets[0], key))) {
            if (this.max && buckets[0].size >= Math.ceil(this.max / this.N)) {
                rotateBuckets(buckets, this.rotationHook)
            }
        }
        mapSet(buckets[0], key, value)
        return value
    },
    get: function get(key) {
        const buckets = getPriv(this)
        const retain = this.retainUsed

        for (var i = 0; i < buckets.length; i++) {
            if (mapHas(buckets[i], key)) {
                const value = mapGet(buckets[i], key)
                if (i && retain) {
                    //put a reference in the newest bucket to retain most used refs longer
                    return this.set(key, value)
                }
                return value
            }
        }
    },
    _get_buckets: function () { return getPriv(this) },
}

const weakRotate = (memWeakRef) => {
    const mem = memWeakRef.deref()
    if (mem) {
        rotateBuckets(getPriv(mem), mem.rotationHook)
        return true
    } else {
        return false
    }
}

function rotateBucketsPeriodically(memWeakRef, interval) {
    const handle = setInterval(() => {
        if (false === weakRotate(memWeakRef)) {
            clearInterval(handle)
        }
    }, interval)
    // don't keep node live
    if (handle.unref) {
        handle.unref()
    }
}


module.exports = {
    /**
     *
     * @param {object} opts
     * @param {number} [opts.buckets] - number of buckets to use (default 2)
     * @param {number} [opts.limit] - max number of items to store (default unlimited)
     * @param {number} [opts.maxTTL] - max time to live for an item
     * @param {boolean} [opts.retainUsed] - retain most used items longer if possible
     * @param {function} [opts.cleanupListener] - callback to call when a bucket is rotated
     */
    safeMemoryCache(opts) {
        const number = ~~(opts.buckets) || 2;

        const mem = create(bucketsProto)

        defineProperties(mem, {
            N: { value: number, enumerable: false },
            max: { value: opts.limit, enumerable: false },
            rotationHook: { value: opts.cleanupListener || null, enumerable: false },
            retainUsed: { value: opts.retainUsed || false, enumerable: false }
        })
        mem.clear()

        if (opts.maxTTL) {
            // use a weakref to not retain mem while accessing rotateBucket
            const memWeakRef = new WeakRef(mem)
            rotateBucketsPeriodically(memWeakRef, ~~(opts.maxTTL / number))
        }
        return freeze(mem)
    }
}
