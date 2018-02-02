var assert = require('assert')



console.log('# Main implementation')
var safeMemoryCache = require('./index')

var c = safeMemoryCache({
    limit:5,
    refreshF: function(key, value, cache) {
        cache.set(key, value + 'r')
    }
})

console.log('Empty state', c._get_buckets())
assert.equal(c.get('a'), null, 'expected nothing')
console.log('ok')

c.set('a','x')
c.set('a','x')
c.set('a','x')
c.set('a','x')

console.log('After adding the same item multiple times', c._get_buckets())
assert.equal(c.get('a'), 'x', 'expected b')
console.log('ok')


c.set('1','x')
c.set('2','x')
c.set('3','x')
c.set('4','x')


console.log('After adding 4 more items to a collection limited to 5', c._get_buckets())
assert.equal(c.get('a'), 'x', 'a should be still available from second bucket')
console.log('Refreshed state', c._get_buckets())
assert.equal(c.get('a'), 'xr', 'a should be refreshed')
console.log('After running a .get', c._get_buckets())
console.log('ok')

c.set('q1','x')
c.set('q2','x')
c.set('q3','x')
c.set('q4','x')
c.set('q5','x')
c.set('q6','x')
c.set('q7','x')

console.log('After adding even more items', c._get_buckets())
assert.equal(c.get('a'), null, 'a should no longer be in the set')
console.log('ok')


console.log('# Map implementation')

var safeMemoryCache = require('./map')


var c = safeMemoryCache({
    limit:5,
    refreshF: function(key, value, cache) {
      cache.set(key, value + 'r')
    }
})

console.log('Empty state', c._get_buckets())
assert.equal(c.get('a'), null, 'expected nothing')
console.log('ok')

c.set('a','x')
c.set('a','x')
c.set('a','x')
c.set('a','x')

console.log('After adding the same item multiple times', c._get_buckets())
assert.equal(c.get('a'), 'x', 'expected b')
console.log('ok')


c.set('1','x')
c.set('2','x')
c.set('3','x')
c.set('4','x')


console.log('After adding 4 more items to a collection limited to 5', c._get_buckets())
assert.equal(c.get('a'), 'x', 'a should be still available from second bucket')
console.log('After refresh', c._get_buckets())
assert.equal(c.get('a'), 'xr', 'a should be refreshed')
console.log('After running a .get', c._get_buckets())
console.log('ok')

c.set('q1','x')
c.set('q2','x')
c.set('q3','x')
c.set('q4','x')
c.set('q5','x')
c.set('q6','x')
c.set('q7','x')

console.log('After adding even more items', c._get_buckets())
assert.equal(c.get('a'), null, 'a should no longer be in the set')
console.log('ok')
