# safe-memory-cache
Secure and size-limited in-memory cache for Node.js and browsers.

Updated with defensive coding (for prototype poisoning immunity)

## Why another cache package?

- Is lightweight and has trivial API
- Can't be broken by a malicious key (`__proto__`) or a prototype poisoning of intrinsics
- Limits the number of items without the use of `delete` (and no memory leaks caused by `delete`), plays well with garbage collector. But also **doesn't drop the whole cache when full, frees up gradually**
- Doesn't waste your eventloop ticks with timeouts set to remove single items from cache, but still deletes oldest items first

## Usage

```
var {safeMemoryCache} = require('safe-memory-cache')
var cache = safeMemoryCache(options)

cache.set("key1","value1")
cache.get("key1") === "value1"

cache.clear()
cache.get("key1") === undefined

```

### options:

name | type | required | description
 --- | --- | --- | ---
 limit | number | Y | Maximum number of items to store in cache. When cache length is close to the limit, oldest items are removed to make more room.
 maxTTL | number | N | Time in miliseconds within which an element should no longer be in cache if it was not accessed. Actual time is approximate and will be less or equal `maxTTL`
 buckets | number | N | Overrides the number of buckets used internally. Default is 2
 cleanupListener | function | N | Calls the function with a storage bucket that's been removed
 retainUsed | boolean | N | Keep items longer than the maxTTL if they are used

#### What limit should I set ?
If you expect N keys to be used most frequently, (limit/buckets) >= N


## What is it fit for?

Caching in general. When you need to cache results of some long running process or a lot of them and you **don't** have a strong requirement to keep every item until its exact expiry time.

## Technicalities

### How do you know items added to native prototypes won't affect the cache?

Objects used for storing key/value pairs don't inherit from any of the native prototypes, nor `Object`
The implementation uses defensive coding to avoid relying on intrinsics that could be modified later.

### What's with the memory leaks, buckets and delete?

`delete` keyword removes fields from objects, but changes the `hidden class` aka `shape` of the object which takes up some memory. As a result, adding and deleting unique fields to a plain JavaScript object may cause memory consumption to grow. Some JavaScript engines had it leak memory in various ways.

*Then how do you remove old items from cache if you can't use delete?*

Cache consists of a number of buckets and the oldest bucket is removed when new room is needed. Therefore the oldest (1/buckets) of entries gets removed.

There's only one interval created per cache instance.
