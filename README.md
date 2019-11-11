# safe-memory-cache
Secure and size-limited in-memory cache for Node.js and browsers.

## Why another cache package?

- Is lightweight and has trivial API
- Can't be broken by a malicious key (`__proto__`)
- Limits the number of items without the use of `delete` (and no memory leaks caused by `delete`), plays well with garbage collector. But also **doesn't drop the whole cache when full, frees up gradually**
- Doesn't waste your eventloop ticks with timeouts set to remove single items from cache, but still deletes oldest items first

## Usage

```
var {safeMemoryCache} = require('safe-memory-cache')
var cache = safeMemoryCache(options)

cache.set("key1","value1")
cache.get("key1") == "value1"

cache.clear()
cache.get("key1") == undefined

cache.destroy() //only needed if you use maxTTL
```

If your engine doesn't support `Map`, you can use the legacy version. It does manual sanitization on keys and it uses plain objects as buckets for storage.

```
const safeMemoryCache = require('safe-memory-cache/legacy')
```

### options:

name | type | required | description
 --- | --- | --- | ---
 limit | number | Y | Maximum number of items to store in cache. When cache length is close to the limit, oldest items are removed to make more room.
 maxTTL | number | N | Time in miliseconds within which an element should no longer be in cache if it was not accessed. Actual time is approximate and will be less or equal `maxTTL`
 strongSanitizer | bool | N | When set to `true` sanitizes keys to prevent memory issues in older JS engines. Defaults to `false`. No sanitization if you use the Map based version.
 buckets | number | N | Overrides the number of buckets used internally. Default is 2
 cleanupListener | function | N | Calls the function with a storage bucket that's been removed

#### What limit should I set ?
If you expect N keys to be used most frequently, limit/buckets should be at least N.




## What is it fit for?

 Caching in general. When you need to cache results of some long running process or a lot of them and you **don't** have a strong requirement to keep every item until its exact expiry time.

## Technicalities

### What's the point of strongSanitizer?

Some older JavaScript engines had memory leaks triggered by object keys which contain control characters like `-` or `.`
`strongSanitizer:true` makes sure the keys are converted to alphanumeric characters only.

Prevents any potential hacks like overwriting `__proto__` too.

Default sanitizer is only preventing `__proto__` key from breaking the functionality.

### How do you know items added to native prototypes won't affect the cache?

Objects used for storing key/value pairs don't inherit from any of the native prototypes, nor `Object`

### What's with the memory leaks, buckets and delete?

`delete` keyword removes fields from objects, but changes the hidden class of the object which takes up some memory. As a result, adding and deleting unique fields to a plain JavaScript object may cause memory consumption to grow. Some JavaScript engines had it leak memory in various ways.

*Then how do you remove old items from cache if you can't use delete?*

Cache consists of a number of buckets and the oldest bucket is removed when new room is needed. Therefore the oldest (1/buckets) of entries gets removed.
