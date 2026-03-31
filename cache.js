/**
 * Generic cache service with optional distributed invalidation.
 *
 * Supports two in-memory backends:
 *   - Plain `node-cache` (default, single-process)
 *   - `cluster-node-cache` (pass via `clusterCache` option for Node.js cluster mode)
 *
 * Supports an optional Redis backend (pass `redisUrl` option) which supersedes
 * in-memory caching entirely and makes broadcast invalidation a simple DEL.
 *
 * Usage:
 *   const { createCacheService } = require('mr365-utils/cache');
 *   const cache = createCacheService({ invalidationEndpoints: [...] });
 */
var NodeCache = require('node-cache');
var fetch = require('node-fetch');

/**
 * @param {object} [options]
 * @param {object} [options.clusterCache] - A cluster-node-cache instance (Promise-based API).
 *   If provided, used instead of creating a local node-cache instance.
 * @param {number} [options.defaultTTL=10000] - Default TTL in seconds.
 * @param {string[]} [options.invalidationEndpoints] - Full URLs to GET for distributed
 *   cache invalidation (e.g. ['https://app1.example.com/delCache']).
 *   Each URL will have `/<encodedKey>?<cacheBuster>` appended.
 * @param {number} [options.broadcastDelay=450] - Delay in ms before local delete
 *   after broadcasting invalidation.
 * @param {string} [options.redisUrl] - Redis connection URL. If provided, Redis is
 *   used as the cache backend and broadcast invalidation becomes a simple DEL.
 * @returns {object} Cache service API
 */
function createCacheService(options) {
    var opts = options || {};
    var defaultTTL = opts.defaultTTL || 10000;
    var endpoints = opts.invalidationEndpoints || [];
    var broadcastDelay = opts.broadcastDelay != null ? opts.broadcastDelay : 450;
    var redisUrl = opts.redisUrl || null;

    var backend;

    if (redisUrl) {
        backend = createRedisBackend(redisUrl, defaultTTL);
    } else if (opts.clusterCache) {
        backend = createClusterBackend(opts.clusterCache, defaultTTL);
    } else {
        backend = createNodeCacheBackend(defaultTTL);
    }

    function setCache(key, ttl, data, cb) {
        backend.set(key, data, ttl || defaultTTL, function () {
            if (typeof cb === 'function') cb(data);
        });
    }

    function getCache(key) {
        return backend.getSync(key);
    }

    function delCache(key, cb) {
        backend.del(key, function () {
            if (typeof cb === 'function') cb();
        });
    }

    /**
     * Get from cache, populating on miss.
     * @param {string} key
     * @param {number} ttl - TTL in seconds
     * @param {function} storeFn - Called on miss: storeFn(function(storeKey, data) { ... })
     * @param {function} thenFn - Called with data (hit or after store)
     */
    function getFromCache(key, ttl, storeFn, thenFn) {
        backend.get(key, function (value) {
            if (value !== undefined) {
                if (typeof thenFn === 'function') thenFn(value);
                return;
            }

            storeFn(function (storeKey, newData) {
                if (storeKey && storeKey !== 'nullsink') {
                    backend.set(storeKey, newData, ttl || defaultTTL, function () {
                        if (typeof thenFn === 'function') thenFn(newData);
                    });
                } else {
                    if (typeof thenFn === 'function') thenFn(newData);
                }
            });
        });
    }

    /**
     * Delete a key from cache across all configured endpoints, then delete locally.
     * When Redis is the backend, endpoints are skipped since all instances share the store.
     */
    function broadcastDelCache(key, cb) {
        if (!key) {
            if (typeof cb === 'function') cb();
            return;
        }

        if (redisUrl || endpoints.length === 0) {
            delCache(key, cb);
            return;
        }

        var rint = Math.floor(Math.random() * 33923232);
        var encodedKey = encodeURIComponent(key);
        var noop = function () {};

        endpoints.forEach(function (endpoint) {
            var sep = endpoint.indexOf('?') === -1 ? '?' : '&';
            var url = endpoint + '/' + encodedKey + sep + rint;
            fetch(url).then(noop).catch(noop);
        });

        setTimeout(function () {
            delCache(key, cb);
        }, broadcastDelay);
    }

    function getStats() {
        return backend.getStats();
    }

    function flushAll() {
        backend.flushAll();
    }

    return {
        setCache: setCache,
        getCache: getCache,
        delCache: delCache,
        getFromCache: getFromCache,
        broadcastDelCache: broadcastDelCache,
        getStats: getStats,
        flushAll: flushAll,
    };
}

/**
 * Backend: plain node-cache (synchronous, single-process).
 */
function createNodeCacheBackend(defaultTTL) {
    var cache = new NodeCache({ stdTTL: defaultTTL, checkperiod: 600 });

    return {
        set: function (key, data, ttl, cb) {
            cache.set(key, data, ttl || defaultTTL);
            if (typeof cb === 'function') cb();
        },
        get: function (key, cb) {
            var value = cache.get(key);
            if (typeof cb === 'function') cb(value);
        },
        getSync: function (key) {
            return cache.get(key);
        },
        del: function (key, cb) {
            cache.del(key);
            if (typeof cb === 'function') cb();
        },
        getStats: function () {
            return cache.getStats();
        },
        flushAll: function () {
            cache.flushAll();
        },
    };
}

/**
 * Backend: cluster-node-cache (Promise-based, multi-worker).
 * The clusterCache instance is typically `global.nodeCache` created via
 * `require('cluster-node-cache')(cluster, { stdTTL: ... })`.
 */
function createClusterBackend(clusterCache, defaultTTL) {
    return {
        set: function (key, data, ttl, cb) {
            clusterCache.set(key, data, ttl || defaultTTL).then(function () {
                if (typeof cb === 'function') cb();
            });
        },
        get: function (key, cb) {
            clusterCache.get(key).then(function (results) {
                var value = results && results.value ? results.value[key] : undefined;
                if (typeof cb === 'function') cb(value);
            });
        },
        getSync: function (key) {
            return undefined;
        },
        del: function (key, cb) {
            clusterCache.del(key).then(function () {
                if (typeof cb === 'function') cb();
            });
        },
        getStats: function () {
            return clusterCache.getStats();
        },
        flushAll: function () {
            clusterCache.flushAll();
        },
    };
}

/**
 * Backend: Redis via ioredis (optional, activated by `redisUrl`).
 * ioredis must be installed by the consuming app.
 */
function createRedisBackend(redisUrl, defaultTTL) {
    var Redis;
    try {
        Redis = require('ioredis');
    } catch (e) {
        throw new Error(
            'ioredis is required when using the Redis cache backend. ' +
            'Install it with: npm install ioredis'
        );
    }

    var client = new Redis(redisUrl);

    return {
        set: function (key, data, ttl, cb) {
            var serialized = JSON.stringify(data);
            client.set(key, serialized, 'EX', ttl || defaultTTL).then(function () {
                if (typeof cb === 'function') cb();
            }).catch(function () {
                if (typeof cb === 'function') cb();
            });
        },
        get: function (key, cb) {
            client.get(key).then(function (raw) {
                var value;
                if (raw != null) {
                    try { value = JSON.parse(raw); } catch (e) { value = raw; }
                }
                if (typeof cb === 'function') cb(value);
            }).catch(function () {
                if (typeof cb === 'function') cb(undefined);
            });
        },
        getSync: function (key) {
            return undefined;
        },
        del: function (key, cb) {
            client.del(key).then(function () {
                if (typeof cb === 'function') cb();
            }).catch(function () {
                if (typeof cb === 'function') cb();
            });
        },
        getStats: function () {
            return { backend: 'redis', url: redisUrl };
        },
        flushAll: function () {
            client.flushdb();
        },
    };
}

module.exports = {
    createCacheService: createCacheService,
};
