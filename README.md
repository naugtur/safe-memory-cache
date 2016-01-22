# safe-memory-cache
Secure and size-limited in-memory cache for Node.js and browsers.

## Why another cache package?

- Is lightweight and has trivial API
- Can't be broken by a malicious key (like `__proto__`)
- Can't be affected by modifications to native prototypes
- Limits the number of items without the use of `delete` (and no memory leaks caused by `delete`), plays well with garbage collector. But also doesn't drop the whole cache when full, frees up gradually
- Doesn't waste your eventloop ticks with timeouts set to remove single items from cache, but still deletes oldest items first

## Usage

```
var safeMemoryCache = require('safe-memory-cache')
var cache = safeMemoryCache(options)

cache.set("key1","value1")
cache.get("key1") == "value1"

cache.clear()
cache.get("key1") == undefined

cache.destroy() //only needed if you use maxTTL
```

### options:

name | type | required | description
 --- | --- | --- | ---
 limit | number | Y | Maximum number of items to store in cache. When limit is reached, oldest items are removed to make room.
 maxTTL | number | N | Time in miliseconds within which an element should no longer be in cache. Actual time is approximate and will be less or equal `maxTTL`
 strongSanitizer | bool | N | When set to `true` sanitizes keys very carefully. Defaults to `false` - simpler sanitization
 buckets | number| N | overrides the number of buckets used internally

## Technicalities

### What's the point of strongSanitizer?

Some older JavaScript engines have memory leaks triggered by object keys which contain control characters like `-` or `.`
`strongSanitizer:true` makes sure the keys are converted to alphanumeric characters only

### How do you know items added to native prototypes won't affect the cache?

Objects used for storing key/value pairs don't inherit from any of the native prototypes, nor `Object`

### What's with the memory leaks, buckets and delete?

Simple version: `delete` keyword removes fields from objects, but doesn't release the memory used by the key entry. As a result, adding and deleting unique fields to a plain JavaScript object will cause memory consumption to grow. Some JavaScript engines had it also leak memory.

*How do you remove old items from cache if you can't use delete?*

Cache consists of a number of buckets and the oldest bucket is removed when new room is needed. Therefore the oldest (100/buckets) percent of entries gets removed.

## What is it fit for?

Caching in general. When you need to cache results of some long running function and you don't have a strong requirement to forget every item after its exact expiry time, no sooner.
