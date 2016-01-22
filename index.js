function createMem(number, limit) {
    var mem = Object.create(bucketsProto)
    mem.N = number
    mem.max = limit
    return mem
}

var bucketsProto = {
    clear: function clear() {
        this.size = 0
        for (var i = 0; i < this.N; i++) {
            this.spawnBucket()
        }
    },
    spawnBucket: function spawnBucket() {
        this.buckets.unshift(Object.create(null))
    },
    rotateBuckets: function rotateBuckets() {
        this.buckets.pop()
        this.spawnBucket()
        this.size = 0
    },
    set: function set(key, value) {
        this.buckets[0][key] = value
        if (!(key in this.buckets[0])) {
            this.size++;
            if (this.max && size >= ~~(this.max / this.buckets.length)) {
                this.rotateBuckets()
            }
        }
    },
    get: function get(key) {
        for (var i = 0; i < this.buckets.length; i++) {
            if (key in this.buckets[i]) {
                //todo: this should be configurable
                if (i) {
                    //put a reference in the newest bucket
                    this.set(key,this.buckets[i][key])
                }
                return this.buckets[i][key]
            }
        }
    }
}

var protoRegex = /__proto__/g;

function sanitizeSimple(key) {
    return '' + key.replace(protoRegex, 'z__proto__')
}

function sanitizeHeavy(key) {
    return ('' + key).split('').map(function(char) {
        return char.charCodeAt(0).toString(32)
    }).join('z')
}


module.exports = function(opts) {
    var buckets = ~~(opts.buckets) || 2;
    var mem = createMem(buckets, ~~(opts.limit))
    var sanitize = (opts.strongSanitizer ? sanitizeHeavy : sanitizeSimple)

    if (opts.maxTTL) {
        var intervalHandle = setInterval(mem.rotateBuckets.bind(mem), ~~(opts.maxTTL / buckets))
    }

    return {
        set: function(key, value) {
            mem.set(sanitize(key), value)
        },
        get: function(key) {
            mem.get(sanitize(key))
        },
        clear: mem.clear.bind(mem),
        destroy: function() {
            clearInterval(intervalHandle)
        }
    }


}
