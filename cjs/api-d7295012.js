'use strict';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
    return commonjsRequire();
  }
	}, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var browser = createCommonjsModule(function (module, exports) {

// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
};

var global = getGlobal();

module.exports = exports = global.fetch;

// Needed for TypeScript and Webpack.
exports.default = global.fetch.bind(global);

exports.Headers = global.Headers;
exports.Request = global.Request;
exports.Response = global.Response;
});

async function series (array) {
  let results = [];

  for (let i = 0; i !== array.length; i++) {
    results.push(await array[i]());
  }

  return results
}

function parallel (array) {
  return Promise.all(array.map(func => func()))
}

var flow = {
  series,
  parallel
};

const defaultOptions = {
  type: 'json',
  method: 'GET',
  headers: {},
  body: undefined
};

let internalRetry = () => false;
let internalRetryWait = () => false;

var src = { retry, retryWait, single, many };

// Set a custom decider function that decides to retry
// based on the number of tries and the previous error
function retry (decider) {
  internalRetry = decider;
}

// Set a custom function that sets how long we should
// sleep between each failed request
function retryWait (callback) {
  internalRetryWait = callback;
}

// Request a single url
function single (url, options = {}) {
  let tries = 1;

  // Execute the request and retry if there are errors (and the
  // retry decider decided that we should try our luck again)
  const callRequest = () => request(url, options).catch(err => {
    if (internalRetry(++tries, err)) {
      return wait(callRequest, internalRetryWait(tries))
    }

    throw err
  });

  return callRequest()
}

// Send a request using the underlying fetch API
function request (url, options) {
  options = Object.assign({}, defaultOptions, options);
  let savedContent;
  let savedResponse;

  return new Promise((resolve, reject) => {
    browser(url, options)
      .then(handleResponse)
      .then(handleBody)
      .catch(handleError);

    function handleResponse (response) {
      // Save the response for checking the status later
      savedResponse = response;

      // Decode the response body
      switch (options.type) {
        case 'response':
          return response
        case 'json':
          return response.json()
        default:
          return response.text()
      }
    }

    function handleBody (content) {
      // Bubble an error if the response status is not okay
      if (savedResponse && savedResponse.status >= 400) {
        savedContent = content;
        throw new Error(`Response status indicates error`)
      }

      // All is well!
      resolve(content);
    }

    function handleError (err) {
      // Overwrite potential decoding errors when the actual problem was the response
      if (savedResponse && savedResponse.status >= 400) {
        err = new Error(`Status ${savedResponse.status}`);
      }

      // Enrich the error message with the response and the content
      let error = new Error(err.message);
      error.response = savedResponse;
      error.content = savedContent;
      reject(error);
    }
  })
}

// Request multiple pages
function many (urls, options = {}) {
  let flowMethod = (options.waitTime) ? flow.series : flow.parallel;

  // Call the single method while respecting the wait time in between tasks
  const callSingle = (url) => single(url, options)
    .then(content => wait(() => content, options.waitTime));

  // Map over the urls and call them using the method the user chose
  let promises = urls.map(url => () => callSingle(url));
  return flowMethod(promises)
}

// Wait a specific time before executing a callback
function wait (callback, ms) {
  return new Promise(resolve => {
    setTimeout(() => resolve(callback()), ms || 0);
  })
}

var _null = function () {
  return { get, set, mget, mset, flush }
};

function get () {
  return Promise.resolve(null)
}

function set () {
  return Promise.resolve(true)
}

function mget (keys) {
  const values = keys.map(x => null);
  return Promise.resolve(values)
}

function mset () {
  return Promise.resolve(true)
}

function flush () {
  return Promise.resolve(true)
}

var has = Object.prototype.hasOwnProperty
  , undef;

/**
 * Decode a URI encoded string.
 *
 * @param {String} input The URI encoded string.
 * @returns {String|Null} The decoded string.
 * @api private
 */
function decode(input) {
  try {
    return decodeURIComponent(input.replace(/\+/g, ' '));
  } catch (e) {
    return null;
  }
}

/**
 * Simple query string parser.
 *
 * @param {String} query The query string that needs to be parsed.
 * @returns {Object}
 * @api public
 */
function querystring(query) {
  var parser = /([^=?&]+)=?([^&]*)/g
    , result = {}
    , part;

  while (part = parser.exec(query)) {
    var key = decode(part[1])
      , value = decode(part[2]);

    //
    // Prevent overriding of existing properties. This ensures that build-in
    // methods like `toString` or __proto__ are not overriden by malicious
    // querystrings.
    //
    // In the case if failed decoding, we want to omit the key/value pairs
    // from the result.
    //
    if (key === null || value === null || key in result) continue;
    result[key] = value;
  }

  return result;
}

/**
 * Transform a query string to an object.
 *
 * @param {Object} obj Object that should be transformed.
 * @param {String} prefix Optional prefix.
 * @returns {String}
 * @api public
 */
function querystringify(obj, prefix) {
  prefix = prefix || '';

  var pairs = []
    , value
    , key;

  //
  // Optionally prefix with a '?' if needed
  //
  if ('string' !== typeof prefix) prefix = '?';

  for (key in obj) {
    if (has.call(obj, key)) {
      value = obj[key];

      //
      // Edge cases where we actually want to encode the value to an empty
      // string instead of the stringified value.
      //
      if (!value && (value === null || value === undef || isNaN(value))) {
        value = '';
      }

      key = encodeURIComponent(key);
      value = encodeURIComponent(value);

      //
      // If we failed to encode the strings, we should bail out as we don't
      // want to add invalid strings to the query.
      //
      if (key === null || value === null) continue;
      pairs.push(key +'='+ value);
    }
  }

  return pairs.length ? prefix + pairs.join('&') : '';
}

//
// Expose the module.
//
var stringify = querystringify;
var parse = querystring;

var querystringify_1 = {
	stringify: stringify,
	parse: parse
};

var arrayUnique = createCommonjsModule(function (module) {

module.exports = function unique(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array.');
  }

  var len = arr.length;
  var i = -1;

  while (i++ < len) {
    var j = i + 1;

    for (; j < arr.length; ++j) {
      if (arr[i] === arr[j]) {
        arr.splice(j--, 1);
      }
    }
  }
  return arr;
};

module.exports.immutable = function uniqueImmutable(arr) {
  if (!Array.isArray(arr)) {
    throw new TypeError('array-unique expects an array.');
  }

  var arrLen = arr.length;
  var newArr = new Array(arrLen);

  for (var i = 0; i < arrLen; i++) {
    newArr[i] = arr[i];
  }

  return module.exports(newArr);
};
});

var chunk = createCommonjsModule(function (module, exports) {

(function () {

    function chunk (collection, size) {
    
        var result = [];
        
        // default size to two item
        size = parseInt(size) || 2;
        
        // add each chunk to the result
        for (var x = 0; x < Math.ceil(collection.length / size); x++) {
            
            var start = x * size;
            var end = start + size;
            
            result.push(collection.slice(start, end));
            
        }
        
        return result;
        
    }
    // export in node or browser
    {
        if ( module.exports) {
            exports = module.exports = chunk;
        }
        exports.chunk = chunk;
    }

}.call(commonjsGlobal));
});

var hash_browser_cjs = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

/* eslint-disable */
// murmurhash2 via https://github.com/garycourt/murmurhash-js/blob/master/murmurhash2_gc.js
function murmurhash2_32_gc(str) {
  var l = str.length,
      h = l ^ l,
      i = 0,
      k;

  while (l >= 4) {
    k = str.charCodeAt(i) & 0xff | (str.charCodeAt(++i) & 0xff) << 8 | (str.charCodeAt(++i) & 0xff) << 16 | (str.charCodeAt(++i) & 0xff) << 24;
    k = (k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0x5bd1e995 & 0xffff) << 16);
    k ^= k >>> 24;
    k = (k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0x5bd1e995 & 0xffff) << 16);
    h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0x5bd1e995 & 0xffff) << 16) ^ k;
    l -= 4;
    ++i;
  }

  switch (l) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;

    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;

    case 1:
      h ^= str.charCodeAt(i) & 0xff;
      h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0x5bd1e995 & 0xffff) << 16);
  }

  h ^= h >>> 13;
  h = (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0x5bd1e995 & 0xffff) << 16);
  h ^= h >>> 15;
  return (h >>> 0).toString(36);
}

exports.default = murmurhash2_32_gc;
});

unwrapExports(hash_browser_cjs);

const emotionHash = hash_browser_cjs.default;

let cache = {};

function hash (string) {
  if (!cache[string]) {
    cache[string] = emotionHash(string);
  }

  return cache[string]
}

var hash_1 = hash;

const clone = (x) => JSON.parse(JSON.stringify(x));

var endpoint = class AbstractEndpoint {
  constructor (parent) {
    this.client = parent.client;
    this.schemaVersion = parent.schemaVersion || '2019-03-20T00:00:00.000Z';
    this.lang = parent.lang;
    this.apiKey = parent.apiKey;
    this.fetch = parent.fetch;
    this.caches = parent.caches;
    this.debug = parent.debug;

    this.baseUrl = 'https://api.guildwars2.com';
    this.isPaginated = false;
    this.maxPageSize = 200;
    this.isBulk = false;
    this.supportsBulkAll = true;
    this.isLocalized = false;
    this.isAuthenticated = false;
    this.isOptionallyAuthenticated = false;
    this.credentials = false;

    this._skipCache = false;
  }

  // Set the schema version
  schema (schema) {
    this.schemaVersion = schema;
    this.debugMessage(`set the schema to ${schema}`);
    return this
  }

  // Check if the schema version includes a specific version
  _schemaIncludes (date) {
    return this.schemaVersion >= date
  }

  // Set the language for locale-aware endpoints
  language (lang) {
    this.lang = lang;
    this.debugMessage(`set the language to ${lang}`);
    return this
  }

  // Set the api key for authenticated endpoints
  authenticate (apiKey) {
    this.apiKey = apiKey;
    this.debugMessage(`set the api key to ${apiKey}`);
    return this
  }

  // Set the debugging flag
  debugging (flag) {
    this.debug = flag;
    return this
  }

  // Print out a debug message if debugging is enabled
  debugMessage (string) {
    if (this.debug) {
      console.log(`[gw2api-client] ${string}`);
    }
  }

  // Skip caching and get the live data
  live () {
    this._skipCache = true;
    this.debugMessage(`skipping cache`);
    return this
  }

  // Get all ids
  ids () {
    this.debugMessage(`ids(${this.url}) called`);

    if (!this.isBulk) {
      return Promise.reject(new Error('"ids" is only available for bulk expanding endpoints'))
    }

    // There is no cache time set, so always use the live data
    if (!this.cacheTime) {
      return this._ids()
    }

    // Get as much as possible out of the cache
    const hash = this._cacheHash('ids');
    const handleCacheContent = (cached) => {
      if (cached) {
        this.debugMessage(`ids(${this.url}) resolving from cache`);
        return cached
      }

      return this._ids().then(content => {
        this._cacheSetSingle(hash, content);
        return content
      })
    };

    // Get the content either from the cache or API, write it into the cache and return a clone
    const contentPromise = this._skipCache
      ? Promise.resolve(false).then(handleCacheContent)
      : this._cacheGetSingle(hash).then(handleCacheContent);

    return contentPromise.then(clone)
  }

  // Get all ids from the live API
  _ids () {
    this.debugMessage(`ids(${this.url}) requesting from api`);
    return this._request(this.url)
  }

  // Get a single entry by id
  get (id, url = false) {
    this.debugMessage(`get(${this.url}) called`);

    if (!id && this.isBulk && !url) {
      return Promise.reject(new Error('"get" requires an id'))
    }

    // There is no cache time set, so always use the live data
    if (!this.cacheTime) {
      return this._get(id, url)
    }

    // Get as much as possible out of the cache
    const hash = this._cacheHash(id);
    const handleCacheContent = (cached) => {
      if (cached) {
        this.debugMessage(`get(${this.url}) resolving from cache`);
        return cached
      }

      return this._get(id, url).then(content => {
        this._cacheSetSingle(hash, content);
        return content
      })
    };

    // Get the content either from the cache or API, write it into the cache and return a clone
    const contentPromise = this._skipCache
      ? Promise.resolve(false).then(handleCacheContent)
      : this._cacheGetSingle(hash).then(handleCacheContent);

    return contentPromise.then(clone)
  }

  // Get a single entry by id from the live API
  _get (id, url) {
    this.debugMessage(`get(${this.url}) requesting from api`);

    // Request the single id if the endpoint a bulk endpoint
    if (this.isBulk && !url) {
      return this._request(`${this.url}?id=${id}`)
    }

    // We are dealing with a custom url instead
    if (url) {
      return this._request(this.url + id)
    }

    // Just request the base url
    return this._request(this.url)
  }

  // Get multiple entries by ids
  many (ids) {
    this.debugMessage(`many(${this.url}) called (${ids.length} ids)`);

    if (!this.isBulk) {
      return Promise.reject(new Error('"many" is only available for bulk expanding endpoints'))
    }

    // Exit out early if we don't request any ids
    if (ids.length === 0) {
      return Promise.resolve([])
    }

    // Always only work on unique ids, since that's how the API works
    ids = arrayUnique.immutable(ids);

    // There is no cache time set, so always use the live data
    if (!this.cacheTime) {
      return this._many(ids)
    }

    // Get as much as possible out of the cache
    const hashes = ids.map(id => this._cacheHash(id));
    const handleCacheContent = (cached) => {
      cached = cached.filter(x => x);

      if (cached.length === ids.length) {
        this.debugMessage(`many(${this.url}) resolving fully from cache`);
        return cached
      }

      this.debugMessage(`many(${this.url}) resolving partially from cache (${cached.length} ids)`);
      const missingIds = getMissingIds(ids, cached);
      return this._many(missingIds, cached.length > 0).then(content => {
        const cacheContent = content.map(value => [this._cacheHash(value.id), value]);
        this._cacheSetMany(cacheContent);

        // Merge the new content with the cached content and guarantee element order
        content = content.concat(cached);
        return this._sortByIdList(content, ids)
      })
    };

    // Find the ids that are missing in the cached data
    const getMissingIds = (ids, cached) => {
      const cachedIds = {};
      cached.map(x => {
        cachedIds[x.id] = 1;
      });

      return ids.filter(x => cachedIds[x] !== 1)
    };

    // Get the content either from the cache or API, write it into the cache and return a clone
    const contentPromise = this._skipCache
      ? Promise.resolve([]).then(handleCacheContent)
      : this._cacheGetMany(hashes).then(handleCacheContent);

    return contentPromise.then(clone)
  }

  // Get multiple entries by ids from the live API
  _many (ids, partialRequest = false) {
    this.debugMessage(`many(${this.url}) requesting from api (${ids.length} ids)`);

    // Chunk the requests to the max page size
    const pages = chunk(ids, this.maxPageSize);
    const requests = pages.map(page => `${this.url}?ids=${page.join(',')}`);

    // If we are partially caching and all not-cached ids are all invalid,
    // simulate the API behaviour by silently swallowing errors.
    let handleMissingIds = (err) => {
      /* istanbul ignore else */
      if (partialRequest && err.response && err.response.status === 404) {
        return Promise.resolve([])
      }

      /* istanbul ignore next */
      return Promise.reject(err)
    };

    // Work on all requests in parallel and then flatten the responses into one
    return this._requestMany(requests)
      .then(responses => responses.reduce((x, y) => x.concat(y), []))
      .catch(handleMissingIds)
  }

  // Get a single page
  page (page, size = this.maxPageSize) {
    this.debugMessage(`page(${this.url}) called`);

    if (!this.isBulk && !this.isPaginated) {
      return Promise.reject(new Error('"page" is only available for bulk expanding or paginated endpoints'))
    }

    if (size > this.maxPageSize || size <= 0) {
      return Promise.reject(new Error(`"size" has to be between 0 and ${this.maxPageSize}, was ${size}`))
    }

    if (page < 0) {
      return Promise.reject(new Error('page has to be 0 or greater'))
    }

    // There is no cache time set, so always use the live data
    if (!this.cacheTime) {
      return this._page(page, size)
    }

    // Get as much as possible out of the cache
    const hash = this._cacheHash('page-' + page + '/' + size);
    const handleCacheContent = (cached) => {
      if (cached) {
        this.debugMessage(`page(${this.url}) resolving from cache`);
        return cached
      }

      return this._page(page, size).then(content => {
        let cacheContent = [[hash, content]];

        if (this.isBulk) {
          cacheContent = cacheContent.concat(content.map(value => [this._cacheHash(value.id), value]));
        }

        this._cacheSetMany(cacheContent);
        return content
      })
    };

    // Get the content either from the cache or API, write it into the cache and return a clone
    const contentPromise = this._skipCache
      ? Promise.resolve(false).then(handleCacheContent)
      : this._cacheGetSingle(hash).then(handleCacheContent);

    return contentPromise.then(clone)
  }

  // Get a single page from the live API
  _page (page, size) {
    this.debugMessage(`page(${this.url}) requesting from api`);
    return this._request(`${this.url}?page=${page}&page_size=${size}`)
  }

  // Get all entries
  all () {
    this.debugMessage(`all(${this.url}) called`);

    if (!this.isBulk && !this.isPaginated) {
      return Promise.reject(new Error('"all" is only available for bulk expanding or paginated endpoints'))
    }

    // There is no cache time set, so always use the live data
    if (!this.cacheTime) {
      return this._all()
    }

    // Get as much as possible out of the cache
    const hash = this._cacheHash('all');
    const handleCacheContent = (cached) => {
      if (cached) {
        this.debugMessage(`all(${this.url}) resolving from cache`);
        return cached
      }

      return this._all().then(content => {
        let cacheContent = [[hash, content]];

        if (this.isBulk) {
          cacheContent = cacheContent.concat(content.map(value => [this._cacheHash(value.id), value]));
        }

        this._cacheSetMany(cacheContent);
        return content
      })
    };

    // Get the content either from the cache or API, write it into the cache and return a clone
    const contentPromise = this._skipCache
      ? Promise.resolve(false).then(handleCacheContent)
      : this._cacheGetSingle(hash).then(handleCacheContent);

    return contentPromise.then(clone)
  }

  // Get all entries from the live API
  _all () {
    this.debugMessage(`all(${this.url}) requesting from api`);

    // Use bulk expansion if the endpoint supports the "all" keyword
    if (this.isBulk && this.supportsBulkAll) {
      return this._request(`${this.url}?ids=all`)
    }

    // Get everything via all pages instead
    let totalEntries;
    return this._request(`${this.url}?page=0&page_size=${this.maxPageSize}`, 'response')
      .then(firstPage => {
        // Get the total number of entries off the first page's headers
        totalEntries = firstPage.headers.get('X-Result-Total');
        return firstPage.json()
      })
      .then(result => {
        // Return early if the first page already includes all entries
        if (totalEntries <= this.maxPageSize) {
          return result
        }

        // Request all missing pages in parallel
        let requests = [];
        for (let page = 1; page < Math.ceil(totalEntries / this.maxPageSize); page++) {
          requests.push(`${this.url}?page=${page}&page_size=${this.maxPageSize}`);
        }

        return this._requestMany(requests).then(responses => {
          responses = responses.reduce((x, y) => x.concat(y), []);
          return result.concat(responses)
        })
      })
  }

  // Set a single cache key in all connected cache storages
  _cacheSetSingle (key, value) {
    this.caches.map(cache => cache.set(key, value, this.cacheTime));
  }

  // Set multiples cache key in all connected cache storages
  _cacheSetMany (values) {
    values = values.map(value => [value[0], value[1], this.cacheTime]);
    this.caches.map(cache => cache.mset(values));
  }

  // Get a cached value out of the first possible connected cache storages
  _cacheGetSingle (key, index = 0) {
    return this.caches[index].get(key).then(value => {
      if (value || index === this.caches.length - 1) {
        return value
      }

      return this._cacheGetSingle(key, ++index)
    })
  }

  // Get multiple cached values out of the first possible connected cache storages
  _cacheGetMany (keys, index = 0) {
    return this.caches[index].mget(keys).then(values => {
      const cleanValues = values.filter(x => x);

      // We got all the requested keys or are through all storages
      if (cleanValues.length === keys.length || index === this.caches.length - 1) {
        return values
      }

      // Try to ask the next storage for the keys that we didn't get
      let missingKeys = values
        .map((value, i) => value ? false : keys[i])
        .filter(value => value);

      // Then merge the values of the next storage into the missing slots
      return this._cacheGetMany(missingKeys, ++index).then(missingValues => {
        let i = 0;
        return values.map(value => value || missingValues[i++])
      })
    })
  }

  // Get a cache hash for an identifier
  _cacheHash (id) {
    let hash = hash_1(this.baseUrl + this.url + ':' + this.schemaVersion);

    if (id) {
      hash += ':' + id;
    }

    if (this.isLocalized) {
      hash += ':' + this.lang;
    }

    if (this._usesApiKey()) {
      hash += ':' + hash_1(this.apiKey + '');
    }

    return hash
  }

  // Execute a single request
  _request (url, type = 'json') {
    url = this._buildUrl(url);

    /* istanbul ignore next */
    const credentials = this.credentials ? 'include' : undefined;

    return this.fetch.single(url, { type, credentials })
  }

  // Execute multiple requests in parallel
  _requestMany (urls, type = 'json') {
    urls = urls.map(url => this._buildUrl(url));

    /* istanbul ignore next */
    const credentials = this.credentials ? 'include' : undefined;

    return this.fetch.many(urls, { type, credentials })
  }

  // Build the headers for localization and authentication
  _buildUrl (url) {
    // Add the base url
    url = this.baseUrl + url;

    // Parse a possibly existing query
    const parsedUrl = url.split('?');
    let parsedQuery = querystringify_1.parse(parsedUrl[1] || '');

    let query = {};

    // Set the schema version
    query['v'] = this.schemaVersion;

    // Only set the API key for authenticated endpoints,
    // when it is required or optional and set on the client
    if (this._usesApiKey()) {
      query['access_token'] = this.apiKey;
    }

    // Set the language for localized endpoints
    if (this.isLocalized) {
      query['lang'] = this.lang;
    }

    // Merge the parsed query parts out of the url
    query = Object.assign(query, parsedQuery);

    // Build the url with the finished query
    query = querystringify_1.stringify(query, true).replace(/%2C/g, ',');
    return parsedUrl[0] + query
  }

  // Guarantee the element order of bulk results
  _sortByIdList (entries, ids) {
    // Hash map of the indexes for better time complexity on big arrays
    let indexMap = {};
    ids.map((x, i) => {
      indexMap[x] = i;
    });

    // Sort by the indexes
    entries.sort((a, b) => indexMap[a.id] - indexMap[b.id]);
    return entries
  }

  _usesApiKey () {
    return this.isAuthenticated && (!this.isOptionallyAuthenticated || this.apiKey)
  }
};

var characters = class CharactersEndpoint extends endpoint {
  constructor (client, name) {
    super(client);
    this.name = name;
    this.url = '/v2/characters';
    this.isPaginated = true;
    this.isBulk = true;
    this.supportsBulkAll = false;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  backstory () {
    return new BackstoryEndpoint(this, this.name)
  }

  core () {
    return new CoreEndpoint(this, this.name)
  }

  crafting () {
    return new CraftingEndpoint(this, this.name)
  }

  equipment () {
    return new EquipmentEndpoint(this, this.name)
  }

  heropoints () {
    return new HeropointsEndpoint(this, this.name)
  }

  inventory () {
    return new InventoryEndpoint(this, this.name)
  }

  quests () {
    return new QuestsEndpoint(this, this.name)
  }

  recipes () {
    return new RecipesEndpoint(this, this.name)
  }

  sab () {
    return new SabEndpoint(this, this.name)
  }

  skills () {
    return new SkillsEndpoint(this, this.name)
  }

  specializations () {
    return new SpecializationsEndpoint(this, this.name)
  }

  training () {
    return new TrainingEndpoint(this, this.name)
  }
};

class BackstoryEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/backstory`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  get () {
    return super.get().then(result => result.backstory)
  }
}

class CoreEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/core`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class CraftingEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/crafting`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  get () {
    return super.get().then(result => result.crafting)
  }
}

class EquipmentEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/equipment`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  get () {
    return super.get().then(result => result.equipment)
  }
}

class HeropointsEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/heropoints`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class InventoryEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/inventory`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  get () {
    return super.get().then(result => result.bags)
  }
}

class QuestsEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/quests`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class RecipesEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/recipes`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  get () {
    return super.get().then(result => result.recipes)
  }
}

class SabEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/sab`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class SkillsEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/skills`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  get () {
    return super.get().then(result => result.skills)
  }
}

class SpecializationsEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/specializations`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  get () {
    return super.get().then(result => result.specializations)
  }
}

class TrainingEndpoint extends endpoint {
  constructor (client, character) {
    super(client);
    this.url = `/v2/characters/${encodeURIComponent(character)}/training`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  get () {
    return super.get().then(result => result.training)
  }
}

var pvp = class PvpEndpoint extends endpoint {
  constructor (client, fromAccount) {
    super(client);
    this.fromAccount = fromAccount;
  }

  amulets () {
    return new AmuletsEndpoint(this)
  }

  games () {
    return new GamesEndpoint(this)
  }

  heroes () {
    if (this.fromAccount) {
      return new AccountHeroesEndpoint(this)
    }

    return new HeroesEndpoint(this)
  }

  ranks () {
    return new RanksEndpoint(this)
  }

  seasons (id) {
    return new SeasonsEndpoint(this, id)
  }

  standings () {
    return new StandingsEndpoint(this)
  }

  stats () {
    return new StatsEndpoint(this)
  }
};

class AccountHeroesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/pvp/heroes';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class AmuletsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/pvp/amulets';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class GamesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/pvp/games';
    this.isPaginated = true;
    this.isBulk = true;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class HeroesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/pvp/heroes';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class RanksEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/pvp/ranks';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class SeasonsEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.id = id;
    this.url = '/v2/pvp/seasons';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }

  leaderboards () {
    return new SeasonLeaderboardEndpoint(this, this.id)
  }
}

class SeasonLeaderboardEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.id = id;
    this.url = `/v2/pvp/seasons/${id}/leaderboards`;
    this.cacheTime = 24 * 60 * 60;
  }

  ids () {
    return super.get('', true)
  }

  board (board, region) {
    return new SeasonLeaderboardBoardEndpoint(this, this.id, board, region)
  }
}

class SeasonLeaderboardBoardEndpoint extends endpoint {
  constructor (client, id, board, region) {
    super(client);
    this.url = `/v2/pvp/seasons/${id}/leaderboards/${board}/${region}`;
    this.isPaginated = true;
    this.cacheTime = 5 * 60;
  }
}

class StandingsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/pvp/standings';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class StatsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/pvp/stats';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

var commerce = class CommerceEndpoint extends endpoint {
  // Current things to grab in the delivery box
  delivery () {
    return new DeliveryEndpoint(this)
  }

  // Current gem/coin exchange rates
  exchange () {
    return new ExchangeEndpoint(this)
  }

  // Current tradingpost listings
  listings () {
    return new ListingsEndpoint(this)
  }

  // Current tradingpost prices
  prices () {
    return new PricesEndpoint(this)
  }

  // Current and completed transactions
  transactions () {
    return {
      current: () => ({
        buys: () => new TransactionsEndpoint(this, 'current', 'buys'),
        sells: () => new TransactionsEndpoint(this, 'current', 'sells')
      }),
      history: () => ({
        buys: () => new TransactionsEndpoint(this, 'history', 'buys'),
        sells: () => new TransactionsEndpoint(this, 'history', 'sells')
      })
    }
  }
};

class DeliveryEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = `/v2/commerce/delivery`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class ExchangeEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/commerce/exchange';
    this.cacheTime = 10 * 60;
  }

  gems (quantity) {
    return super.get(`/gems?quantity=${quantity}`, true)
  }

  coins (quantity) {
    return super.get(`/coins?quantity=${quantity}`, true)
  }
}

class ListingsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/commerce/listings';
    this.isPaginated = true;
    this.isBulk = true;
    this.supportsBulkAll = false;
    this.cacheTime = 2 * 60;
  }
}

class PricesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/commerce/prices';
    this.isPaginated = true;
    this.isBulk = true;
    this.supportsBulkAll = false;
    this.cacheTime = 60;
  }
}

class TransactionsEndpoint extends endpoint {
  constructor (client, type, list) {
    super(client);
    this.url = `/v2/commerce/transactions/${type}/${list}`;
    this.isPaginated = true;
    this.isAuthenticated = true;
    this.cacheTime = 10 * 60;
  }
}

const regexCloseSquareBracket = /]|^\[/g;
const regexOpenSquareBracket = /\.?\[/g;

var src$1 = function (object, path, defaultValue) {
  // Handle the case that the object is undefined or not an object
  if (!object || Object(object) !== object) {
    return defaultValue
  }

  // A) If the path is an array, we can just use that
  // B) If the path is a string, convert it into an array by migrating
  //    array-style `[foo]` accessors into object-style `.foo` accessors
  const cleanPath = Array.isArray(path)
    ? path
    : path.replace(regexCloseSquareBracket, '').replace(regexOpenSquareBracket, '.').split('.');

  return get$1(object, cleanPath, defaultValue)
};

function get$1 (object, path, defaultValue) {
  let current = object;

  for (const segment of path) {
    current = current[segment];

    if (current == null) {
      return defaultValue
    }
  }

  return current
}

async function parallel$1 (promises) {
  const results = await Promise.all(
    Object.values(promises).map(func => func())
  );

  // If the initial structure was an array, just return the array of results
  if (Array.isArray(promises)) {
    return results
  }

  // If the initial structure was an object, rebuild an object with the results
  const keys = Object.keys(promises);
  return results.reduce((object, resultPart, index) => {
    object[keys[index]] = resultPart;
    return object
  }, {})
}

var flow$1 = { parallel: parallel$1 };

function blob (parent) {
  const client = parent.client;

  const requests = {
    account: wrap(() => client.account().get()),
    achievements: wrap(() => client.account().achievements().get()),
    bank: wrap(() => client.account().bank().get()),
    characters: wrap(() => client.characters().all()),
    'commerce.buys': wrap(() => client.commerce().transactions().current().buys().all()),
    'commerce.sells': wrap(() => client.commerce().transactions().current().sells().all()),
    'commerce.delivery': wrap(() => client.commerce().delivery().get()),
    dungeons: wrap(() => client.account().dungeons().get()),
    dyes: wrap(() => client.account().dyes().get()),
    gliders: wrap(() => client.account().gliders().get()),
    finishers: wrap(() => client.account().finishers().get()),
    'home.cats': wrap(() => client.account().home().cats().get()),
    'home.nodes': wrap(() => client.account().home().nodes().get()),
    guilds: wrap(() => accountGuilds(client)),
    luck: wrap(() => client.account().luck().get()),
    mailcarriers: wrap(() => client.account().mailcarriers().get()),
    masteries: wrap(() => client.account().masteries().get()),
    'mastery.points': wrap(() => client.account().mastery().points().get()),
    materials: wrap(() => client.account().materials().get()),
    minis: wrap(() => client.account().minis().get()),
    'mounts.skins': wrap(() => client.account().mounts().skins().get()),
    'mounts.types': wrap(() => client.account().mounts().types().get()),
    novelties: wrap(() => client.account().novelties().get()),
    outfits: wrap(() => client.account().outfits().get()),
    'pvp.games': wrap(() => client.account().pvp().games().all()),
    'pvp.heroes': wrap(() => client.account().pvp().heroes().get()),
    'pvp.standings': wrap(() => client.account().pvp().standings().get()),
    'pvp.stats': wrap(() => client.account().pvp().stats().get()),
    raids: wrap(() => client.account().raids().get()),
    recipes: wrap(() => client.account().recipes().get()),
    shared: wrap(() => client.account().inventory().get()),
    skins: wrap(() => client.account().skins().get()),
    titles: wrap(() => client.account().titles().get()),
    wallet: wrap(() => client.account().wallet().get())
  };

  return flow$1.parallel(requests).then(data => {
    data = unflatten(data);
    data.characters = filterBetaCharacters(data.characters);
    return data
  })
}

// Get the guild data accessible for the account
function accountGuilds (client) {
  return client.account().get().then(account => {
    if (!account.guild_leader) {
      return []
    }

    let requests = account.guild_leader.map(id => wrap(() => guildData(id)));
    return flow$1.parallel(requests)
  })

  function guildData (id) {
    let requests = {
      data: wrap(() => client.guild().get(id)),
      members: wrap(() => client.guild(id).members().get()),
      ranks: wrap(() => client.guild(id).ranks().get()),
      stash: wrap(() => client.guild(id).stash().get()),
      teams: wrap(() => Promise.resolve(null)),
      treasury: wrap(() => client.guild(id).treasury().get()),
      upgrades: wrap(() => client.guild(id).upgrades().get())
    };

    return flow$1.parallel(requests)
  }
}

// Filter out beta characters from the total account blob, since they are
// technically not part of the actual live account and live on a different server
function filterBetaCharacters (characters) {
  /* istanbul ignore next */
  if (!characters) {
    return null
  }

  return characters.filter(x => !x.flags || !x.flags.includes('Beta'))
}

// Wrap a promise function so all errors that have to do with the API
// just result in an empty response instead of throwing an error
// This prevents API errors / changes breaking the entire infrastructure
function wrap (func) {
  return () => new Promise((resolve, reject) => {
    func()
      .then(x => resolve(x))
      .catch(err => {
        let status = src$1(err, 'response.status');
        let text = src$1(err, 'content.text');

        if (status || text) {
          console.warn(`API error: ${text} (${status})`);
          return resolve(null)
        }

        reject(err);
      });
  })
}

// Unflatten an object with keys describing a nested structure
function unflatten (object) {
  let result = {};

  for (let key in object) {
    _set(result, key, object[key]);
  }

  return result
}

// Set the value of an object based on a flat key ("a.b.c")
function _set (object, key, value) {
  const keyParts = key.split('.');

  let walking = object;
  keyParts.forEach((key, index) => {
    // Create the nested object if it does not exist
    if (!walking[key]) {
      walking[key] = {};
    }

    // If we reached the last part, set the value and exit out
    if (index === keyParts.length - 1) {
      walking[key] = value;
      return
    }

    // Set the next part of the key
    walking = walking[key];
  });
}

var accountBlob = blob;
var wrap_1 = wrap;
accountBlob.wrap = wrap_1;

const DAY_MS = 24 * 60 * 60 * 1000;

function getDateAtTime (date, time) {
  return new Date(date.toISOString().replace(/T.*Z/, `T${time}.000Z`))
}

function getDailyReset (date) {
  date = date ? new Date(date) : new Date();

  date = new Date(date.getTime() + DAY_MS);
  return getDateAtTime(date, '00:00:00')
}

function getLastDailyReset (date) {
  return new Date(getDailyReset(date).getTime() - DAY_MS)
}

function getWeeklyReset (date) {
  date = date ? new Date(date) : new Date();

  const weekday = date.getUTCDay();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  let dayDiff = 0;

  switch (weekday) {
    case 0:
      // 0 -> 1 sunday
      dayDiff = 1;
      break
    case 1:
      // 1 -> 0 monday (if before reset)
      // 1 -> 7 monday (if after reset)
      const pastReset = hours > 7 || (hours === 7 && minutes >= 30);
      dayDiff = pastReset ? 7 : 0;
      break
    default:
      // 2 -> 6 tuesday
      // 3 -> 5 wednesday
      // 4 -> 4 thursday
      // 5 -> 3 friday
      // 6 -> 2 saturday
      dayDiff = 8 - weekday;
      break
  }

  date = new Date(date.getTime() + dayDiff * DAY_MS);
  return getDateAtTime(date, '07:30:00')
}

function getLastWeeklyReset (date) {
  return new Date(getWeeklyReset(date).getTime() - 7 * DAY_MS)
}

var resetTime = {
  getDateAtTime,
  getDailyReset,
  getLastDailyReset,
  getWeeklyReset,
  getLastWeeklyReset
};

class AccountEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  achievements () {
    return new AchievementsEndpoint(this)
  }

  bank () {
    return new BankEndpoint(this)
  }

  characters (name) {
    return new characters(this, name)
  }

  dailycrafting () {
    return new DailycraftingEndpoint(this)
  }

  delivery () {
    return new commerce(this).delivery()
  }

  dungeons () {
    return new DungeonsEndpoint(this)
  }

  dyes () {
    return new DyesEndpoint(this)
  }

  finishers () {
    return new FinishersEndpoint(this)
  }

  gliders () {
    return new GlidersEndpoint(this)
  }

  home () {
    return {
      cats: () => new HomeCatsEndpoint(this),
      nodes: () => new HomeNodesEndpoint(this)
    }
  }

  inventory () {
    return new InventoryEndpoint$1(this)
  }

  luck () {
    return new LuckEndpoint(this)
  }

  mailcarriers () {
    return new MailcarriersEndpoint(this)
  }

  masteries () {
    return new MasteriesEndpoint(this)
  }

  mapchests () {
    return new MapchestsEndpoint(this)
  }

  mastery () {
    return {
      points: () => new MasteryPointsEndpoint(this)
    }
  }

  materials () {
    return new MaterialsEndpoint(this)
  }

  minis () {
    return new MinisEndpoint(this)
  }

  mounts () {
    return {
      skins: () => new MountSkinsEndpoint(this),
      types: () => new MountTypesEndpoint(this)
    }
  }

  novelties () {
    return new NoveltiesEndpoint(this)
  }

  outfits () {
    return new OutfitsEndpoint(this)
  }

  pvp () {
    return new pvp(this, true)
  }

  raids () {
    return new RaidsEndpoint(this)
  }

  recipes () {
    return new RecipesEndpoint$1(this)
  }

  skins () {
    return new SkinsEndpoint(this)
  }

  titles () {
    return new TitlesEndpoint(this)
  }

  transactions () {
    return new commerce(this).transactions()
  }

  wallet () {
    return new WalletEndpoint(this)
  }

  worldbosses () {
    return new WorldbossesEndpoint(this)
  }

  // All data available for the account in a single object
  blob () {
    return accountBlob(this)
  }
}

class AchievementsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/achievements';
    this.isAuthenticated = true;
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 5 * 60;
  }

  ids () {
    return Promise.reject(new Error('method not supported for this endpoint'))
  }

  get (id) {
    if (id) {
      return super.get(id)
    }

    // This endpoint returns all entries if the url gets requested
    // without any parameters, analogue to the other account endpoints
    return this.all()
  }

  all () {
    return super.get('', true)
  }
}

class BankEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/bank';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class DailycraftingEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/dailycrafting';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  async get () {
    return await isStaleDailyData(this) ? [] : super.get()
  }
}

class DungeonsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/dungeons';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  async get () {
    return await isStaleDailyData(this) ? [] : super.get()
  }
}

class DyesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/dyes';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class FinishersEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/finishers';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class GlidersEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/gliders';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class HomeCatsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/home/cats';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class HomeNodesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/home/nodes';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class InventoryEndpoint$1 extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/inventory';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class LuckEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/luck';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  async get () {
    const response = await super.get();
    // [API PATCH #0] If the account does not have any luck, the API erroneously returns `[]`
    if (response.length === 0) return 0
    return response[0].value
  }
}

class MailcarriersEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/mailcarriers';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class MapchestsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/mapchests';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  async get () {
    return await isStaleDailyData(this) ? [] : super.get()
  }
}

class MasteriesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/masteries';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class MasteryPointsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/mastery/points';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class MaterialsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/materials';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class MinisEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/minis';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class MountSkinsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/mounts/skins';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class MountTypesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/mounts/types';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class NoveltiesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/novelties';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class OutfitsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/outfits';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class RaidsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/raids';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  async get () {
    return await isStaleWeeklyData(this) ? [] : super.get()
  }
}

class RecipesEndpoint$1 extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/recipes';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class SkinsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/skins';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class TitlesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/titles';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class WalletEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/wallet';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class WorldbossesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/account/worldbosses';
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  async get () {
    return await isStaleDailyData(this) ? [] : super.get()
  }
}

// Stale data can happen if the last account update was before the last daily reset
async function isStaleDailyData (endpointInstance) {
  const account = await new AccountEndpoint(endpointInstance).schema('2019-03-26').get();
  return new Date(account.last_modified) < resetTime.getLastDailyReset()
}

// Stale data can happen if the last account update was before the last weekly reset
async function isStaleWeeklyData (endpointInstance) {
  const account = await new AccountEndpoint(endpointInstance).schema('2019-03-26').get();
  return new Date(account.last_modified) < resetTime.getLastWeeklyReset()
}

var account = AccountEndpoint;

var achievements = class AchievementsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/achievements';
    this.isPaginated = true;
    this.isBulk = true;
    this.supportsBulkAll = false;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }

  categories () {
    return new CategoriesEndpoint(this)
  }

  groups () {
    return new GroupsEndpoint(this)
  }

  daily () {
    return new DailyEndpoint(this)
  }

  dailyTomorrow () {
    return new DailyTomorrowEndpoint(this)
  }
};

class CategoriesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/achievements/categories';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class GroupsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/achievements/groups';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class DailyEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/achievements/daily';
    this.cacheTime = 60 * 60;
  }
}

class DailyTomorrowEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/achievements/daily/tomorrow';
    this.cacheTime = 60 * 60;
  }
}

var backstory = class BackstoryEndpoint extends endpoint {
  answers () {
    return new AnswersEndpoint(this)
  }

  questions () {
    return new QuestionsEndpoint(this)
  }
};

class AnswersEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/backstory/answers';
    this.isPaginated = true;
    this.isBulk = true;
    this.supportsBulkAll = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class QuestionsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/backstory/questions';
    this.isPaginated = true;
    this.isBulk = true;
    this.supportsBulkAll = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

var build = class BuildEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/build';
    this.cacheTime = 60;
  }

  get () {
    return super.get().then(result => result.id)
  }
};

var cats = class CatsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/cats';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var colors = class ColorsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/colors';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var continents = class ContinentsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/continents';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }

  floors (id) {
    return new FloorsEndpoint(this, id)
  }
};

class FloorsEndpoint extends endpoint {
  constructor (client, continentId) {
    super(client);
    this.url = `/v2/continents/${continentId}/floors`;
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

var currencies = class CurrenciesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/currencies';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var dailycrafting = class DailycraftingEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/dailycrafting';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var dungeons = class DungeonsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/dungeons';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var emblem = class EmblemEndpoint extends endpoint {
  backgrounds () {
    return new LayersEndpoint(this, 'backgrounds')
  }

  foregrounds () {
    return new LayersEndpoint(this, 'foregrounds')
  }
};

class LayersEndpoint extends endpoint {
  constructor (client, layer) {
    super(client);
    this.url = `/v2/emblem/${layer}`;
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

var events = class EventsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v1/event_details.json';
    this.cacheTime = 24 * 60 * 60;
  }

  all () {
    return super.get().then(transformV1Format)
  }

  get (id) {
    return super.get(`?event_id=${id}`, true).then(json => transformV1Format(json)[0])
  }
};

function transformV1Format (json) {
  let events = json.events;
  let transformed = [];
  const keys = Object.keys(events);

  for (let i = 0; i !== keys.length; i++) {
    transformed.push(Object.assign({ id: keys[i] }, events[keys[i]]));
  }

  return transformed
}

var files = class FilesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/files';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var finishers = class FinishersEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/finishers';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var gliders = class GlidersEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/gliders';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var guild = class GuildEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.id = id;
    this.url = '/v2/guild';
    this.isAuthenticated = true;
    this.isOptionallyAuthenticated = true;
    this.cacheTime = 60 * 60;
  }

  get (id) {
    return super.get(`/${id}`, true)
  }

  permissions () {
    return new PermissionsEndpoint(this)
  }

  search (name) {
    return new SearchEndpoint(this, name)
  }

  upgrades () {
    if (this.id === undefined) {
      return new AllUpgradesEndpoint(this)
    }

    return new UpgradesEndpoint(this, this.id)
  }

  log () {
    return new LogEndpoint(this, this.id)
  }

  members () {
    return new MembersEndpoint(this, this.id)
  }

  ranks () {
    return new RanksEndpoint$1(this, this.id)
  }

  stash () {
    return new StashEndpoint(this, this.id)
  }

  storage () {
    return new StorageEndpoint(this, this.id)
  }

  teams () {
    return new TeamsEndpoint(this, this.id)
  }

  treasury () {
    return new TreasuryEndpoint(this, this.id)
  }
};

class PermissionsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/guild/permissions';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class SearchEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/guild/search';
    this.cacheTime = 60 * 60;
  }

  name (name) {
    return super.get(`?name=${encodeURIComponent(name)}`, true)
      .then(result => result[0])
  }
}

class AllUpgradesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/guild/upgrades';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class LogEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.url = `/v2/guild/${encodeURIComponent(id)}/log`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }

  since (logId) {
    return super.get(`?since=${logId}`, true)
  }
}

class MembersEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.url = `/v2/guild/${encodeURIComponent(id)}/members`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class RanksEndpoint$1 extends endpoint {
  constructor (client, id) {
    super(client);
    this.url = `/v2/guild/${encodeURIComponent(id)}/ranks`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class StashEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.url = `/v2/guild/${encodeURIComponent(id)}/stash`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class StorageEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.url = `/v2/guild/${encodeURIComponent(id)}/storage`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class TeamsEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.url = `/v2/guild/${encodeURIComponent(id)}/teams`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class TreasuryEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.url = `/v2/guild/${encodeURIComponent(id)}/treasury`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

class UpgradesEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.url = `/v2/guild/${encodeURIComponent(id)}/upgrades`;
    this.isAuthenticated = true;
    this.cacheTime = 5 * 60;
  }
}

var home = class HomeEndpoint extends endpoint {
  cats () {
    return new CatsEndpoint(this)
  }

  nodes () {
    return new NodesEndpoint(this)
  }
};

class CatsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/home/cats';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class NodesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/home/nodes';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

var items = class ItemsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/items';
    this.isPaginated = true;
    this.isBulk = true;
    this.supportsBulkAll = false;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var itemstats = class ItemstatsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/itemstats';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var legends = class LegendsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/legends';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var mailcarriers = class MailcarriersEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/mailcarriers';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var mapchests = class MapchestsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/mapchests';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var maps = class MapsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/maps';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var masteries = class MasteriesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/masteries';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var materials = class MaterialsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/materials';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var minis = class MinisEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/minis';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var mounts = class MountsEndpoint extends endpoint {
  skins () {
    return new SkinsEndpoint$1(this)
  }

  types () {
    return new TypesEndpoint(this)
  }
};

class SkinsEndpoint$1 extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/mounts/skins';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class TypesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/mounts/types';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

var nodes = class NodesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/nodes';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var novelties = class NoveltiesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/novelties';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var outfits = class OutfitsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/outfits';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var pets = class PetsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/pets';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var professions = class ProfessionsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/professions';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var quaggans = class QuaggansEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/quaggans';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var quests = class QuestsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/quests';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var races = class RacesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/races';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var raids = class RaidsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/raids';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var recipes = class RecipesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/recipes';
    this.isPaginated = true;
    this.isBulk = true;
    this.supportsBulkAll = false;
    this.cacheTime = 24 * 60 * 60;
  }

  search () {
    return new SearchEndpoint$1(this)
  }
};

class SearchEndpoint$1 extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/recipes/search';
    this.cacheTime = 24 * 60 * 60;
  }

  input (id) {
    return super.get(`?input=${id}`, true)
  }

  output (id) {
    return super.get(`?output=${id}`, true)
  }
}

var skills = class SkillsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/skills';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var skins = class SkinsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/skins';
    this.isPaginated = true;
    this.isBulk = true;
    this.supportsBulkAll = false;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var specializations = class SpecializationsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/specializations';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var stories = class StoriesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/stories';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }

  seasons () {
    return new SeasonsEndpoint$1(this)
  }
};

class SeasonsEndpoint$1 extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/stories/seasons';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

var titles = class TitlesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/titles';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var tokeninfo = class TokeninfoEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/tokeninfo';
    this.isAuthenticated = true;
    this.cacheTime = 60;
  }
};

var traits = class TraitsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/traits';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var worldbosses = class WorldbossesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/worldbosses';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var worlds = class WorldsEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/worlds';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
};

var wvw = class WvwEndpoint extends endpoint {
  abilities () {
    return new AbilitiesEndpoint(this)
  }

  matches () {
    return new MatchesEndpoint(this)
  }

  objectives () {
    return new ObjectivesEndpoint(this)
  }

  upgrades () {
    return new UpgradesEndpoint$1(this)
  }

  ranks () {
    return new RanksEndpoint$2(this)
  }
};

class AbilitiesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/wvw/abilities';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class MatchesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/wvw/matches';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 30;
  }

  world (worldId) {
    return super.get(`?world=${worldId}`, true)
  }

  overview () {
    return new MatchesOverviewEndpoint(this)
  }

  scores () {
    return new MatchesScoresEndpoint(this)
  }

  stats (id) {
    return new MatchesStatsEndpoint(this, id)
  }
}

class TeamsEndpoint$1 extends endpoint {
  constructor (client, id, team) {
    super(client);
    this.team = team;
    this.id = id;
    this.url = `/v2/wvw/matches/stats/${id}/teams`;
  }

  top (which) {
    return new TopStatsEndpoint(this, this.id, this.team, which)
  }
}

class TopStatsEndpoint extends endpoint {
  constructor (client, id, team, which) {
    super(client);
    this.which = which;
    this.url = `/v2/wvw/matches/stats/${id}/teams/${team}/top/${which}`;
  }
}

class MatchesOverviewEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/wvw/matches/overview';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 30;
  }

  world (worldId) {
    return super.get(`?world=${worldId}`, true)
  }
}

class MatchesScoresEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/wvw/matches/scores';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 30;
  }

  world (worldId) {
    return super.get(`?world=${worldId}`, true)
  }
}

class MatchesStatsEndpoint extends endpoint {
  constructor (client, id) {
    super(client);
    this.id = id;
    this.url = '/v2/wvw/matches/stats';
    this.isPaginated = true;
    this.isBulk = true;
    this.cacheTime = 30;
  }

  world (worldId) {
    return super.get(`?world=${worldId}`, true)
  }

  teams (team) {
    return new TeamsEndpoint$1(this, this.id, team)
  }
}

class ObjectivesEndpoint extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/wvw/objectives';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class UpgradesEndpoint$1 extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/wvw/upgrades';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

class RanksEndpoint$2 extends endpoint {
  constructor (client) {
    super(client);
    this.url = '/v2/wvw/ranks';
    this.isPaginated = true;
    this.isBulk = true;
    this.isLocalized = true;
    this.cacheTime = 24 * 60 * 60;
  }
}

var endpoints = {
  AccountEndpoint: account,
  AchievementsEndpoint: achievements,
  BackstoryEndpoint: backstory,
  BuildEndpoint: build,
  CatsEndpoint: cats,
  CharactersEndpoint: characters,
  ColorsEndpoint: colors,
  CommerceEndpoint: commerce,
  ContinentsEndpoint: continents,
  CurrenciesEndpoint: currencies,
  DailycraftingEndpoint: dailycrafting,
  DungeonsEndpoint: dungeons,
  EmblemEndpoint: emblem,
  EventsEndpoint: events,
  FilesEndpoint: files,
  FinishersEndpoint: finishers,
  GlidersEndpoint: gliders,
  GuildEndpoint: guild,
  HomeEndpoint: home,
  ItemsEndpoint: items,
  ItemstatsEndpoint: itemstats,
  LegendsEndpoint: legends,
  MailcarriersEndpoint: mailcarriers,
  MapchestsEndpoint: mapchests,
  MapsEndpoint: maps,
  MasteriesEndpoint: masteries,
  MaterialsEndpoint: materials,
  MinisEndpoint: minis,
  MountsEndpoint: mounts,
  NodesEndpoint: nodes,
  NoveltiesEndpoint: novelties,
  OutfitsEndpoint: outfits,
  PetsEndpoint: pets,
  ProfessionsEndpoint: professions,
  PvpEndpoint: pvp,
  QuaggansEndpoint: quaggans,
  QuestsEndpoint: quests,
  RacesEndpoint: races,
  RaidsEndpoint: raids,
  RecipesEndpoint: recipes,
  SkillsEndpoint: skills,
  SkinsEndpoint: skins,
  SpecializationsEndpoint: specializations,
  StoriesEndpoint: stories,
  TitlesEndpoint: titles,
  TokeninfoEndpoint: tokeninfo,
  TraitsEndpoint: traits,
  WorldbossesEndpoint: worldbosses,
  WorldsEndpoint: worlds,
  WvwEndpoint: wvw
};

var client = class Client {
  constructor () {
    this.schemaVersion = '2019-03-20T00:00:00.000Z';
    this.lang = 'en';
    this.apiKey = false;
    this.fetch = src;
    this.caches = [_null()];
    this.debug = false;
    this.client = this;
  }

  // Set the schema version
  schema (schema) {
    this.schemaVersion = schema;
    this.debugMessage(`set the schema to ${schema}`);
    return this
  }

  // Set the language for locale-aware endpoints
  language (lang) {
    this.lang = lang;
    this.debugMessage(`set the language to ${lang}`);
    return this
  }

  // Set the api key for authenticated endpoints
  authenticate (apiKey) {
    this.apiKey = apiKey;
    this.debugMessage(`set the api key to ${apiKey}`);
    return this
  }

  // Set the caching storage method(s)
  cacheStorage (caches) {
    this.caches = [].concat(caches);
    this.debugMessage(`updated the cache storage`);
    return this
  }

  // Set the debugging flag
  debugging (flag) {
    this.debug = flag;
    return this
  }

  // Print out a debug message if debugging is enabled
  debugMessage (string) {
    if (this.debug) {
      console.log(`[gw2api-client] ${string}`);
    }
  }

  // Make sure we get the new content if the game updates
  flushCacheIfGameUpdated () {
    const buildEndpoint = this.build();
    const promises = {
      cacheBuildId: () => buildEndpoint._cacheGetSingle('cacheBuildId'),
      buildId: () => buildEndpoint.live().get()
    };

    return flow$1.parallel(promises).then(resp => {
      let flushPromises = [];

      // Flush the caches if the cached build id is set (as a safety measure)
      // and the cached build id is older than the current one
      if (resp.cacheBuildId && resp.cacheBuildId < resp.buildId) {
        this.debugMessage(`flushing the cache because of a new build`);
        flushPromises = this.caches.map(cache => () => cache.flush());
      }

      // Flush the caches (if needed) and save the current build id
      return flow$1.parallel(flushPromises)
        .then(() => buildEndpoint._cacheSetSingle('cacheBuildId', resp.buildId))
    })
  }

  // All the different API endpoints
  account () {
    return new endpoints.AccountEndpoint(this)
  }

  achievements () {
    return new endpoints.AchievementsEndpoint(this)
  }

  backstory () {
    return new endpoints.BackstoryEndpoint(this)
  }

  build () {
    return new endpoints.BuildEndpoint(this)
  }

  cats () {
    return new endpoints.CatsEndpoint(this)
  }

  characters (name) {
    return new endpoints.CharactersEndpoint(this, name)
  }

  colors () {
    return new endpoints.ColorsEndpoint(this)
  }

  commerce () {
    return new endpoints.CommerceEndpoint(this)
  }

  continents () {
    return new endpoints.ContinentsEndpoint(this)
  }

  currencies () {
    return new endpoints.CurrenciesEndpoint(this)
  }

  dailycrafting () {
    return new endpoints.DailycraftingEndpoint(this)
  }

  dungeons () {
    return new endpoints.DungeonsEndpoint(this)
  }

  emblem () {
    return new endpoints.EmblemEndpoint(this)
  }

  events () {
    return new endpoints.EventsEndpoint(this)
  }

  files () {
    return new endpoints.FilesEndpoint(this)
  }

  finishers () {
    return new endpoints.FinishersEndpoint(this)
  }

  gliders () {
    return new endpoints.GlidersEndpoint(this)
  }

  guild (id) {
    return new endpoints.GuildEndpoint(this, id)
  }

  home () {
    return new endpoints.HomeEndpoint(this)
  }

  items () {
    return new endpoints.ItemsEndpoint(this)
  }

  itemstats () {
    return new endpoints.ItemstatsEndpoint(this)
  }

  legends () {
    return new endpoints.LegendsEndpoint(this)
  }

  mailcarriers () {
    return new endpoints.MailcarriersEndpoint(this)
  }

  mapchests () {
    return new endpoints.MapchestsEndpoint(this)
  }

  maps () {
    return new endpoints.MapsEndpoint(this)
  }

  masteries () {
    return new endpoints.MasteriesEndpoint(this)
  }

  materials () {
    return new endpoints.MaterialsEndpoint(this)
  }

  minis () {
    return new endpoints.MinisEndpoint(this)
  }

  mounts () {
    return new endpoints.MountsEndpoint(this)
  }

  nodes () {
    return new endpoints.NodesEndpoint(this)
  }

  novelties () {
    return new endpoints.NoveltiesEndpoint(this)
  }

  outfits () {
    return new endpoints.OutfitsEndpoint(this)
  }

  pets () {
    return new endpoints.PetsEndpoint(this)
  }

  professions () {
    return new endpoints.ProfessionsEndpoint(this)
  }

  pvp () {
    return new endpoints.PvpEndpoint(this)
  }

  quaggans () {
    return new endpoints.QuaggansEndpoint(this)
  }

  quests () {
    return new endpoints.QuestsEndpoint(this)
  }

  races () {
    return new endpoints.RacesEndpoint(this)
  }

  raids () {
    return new endpoints.RaidsEndpoint(this)
  }

  recipes () {
    return new endpoints.RecipesEndpoint(this)
  }

  skills () {
    return new endpoints.SkillsEndpoint(this)
  }

  skins () {
    return new endpoints.SkinsEndpoint(this)
  }

  specializations () {
    return new endpoints.SpecializationsEndpoint(this)
  }

  stories () {
    return new endpoints.StoriesEndpoint(this)
  }

  titles () {
    return new endpoints.TitlesEndpoint(this)
  }

  tokeninfo () {
    return new endpoints.TokeninfoEndpoint(this)
  }

  traits () {
    return new endpoints.TraitsEndpoint(this)
  }

  worldbosses () {
    return new endpoints.WorldbossesEndpoint(this)
  }

  worlds () {
    return new endpoints.WorldsEndpoint(this)
  }

  wvw () {
    return new endpoints.WvwEndpoint(this)
  }
};

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing. The function also has a property 'clear' 
 * that is a function which will clear the timer to prevent previously scheduled executions. 
 *
 * @source underscore.js
 * @see http://unscriptable.com/2009/03/20/debouncing-javascript-methods/
 * @param {Function} function to wrap
 * @param {Number} timeout in ms (`100`)
 * @param {Boolean} whether to execute at the beginning (`false`)
 * @api public
 */
function debounce(func, wait, immediate){
  var timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    var last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  }
  var debounced = function(){
    context = this;
    args = arguments;
    timestamp = Date.now();
    var callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };

  debounced.clear = function() {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  debounced.flush = function() {
    if (timeout) {
      result = func.apply(context, args);
      context = args = null;
      
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
// Adds compatibility for ES modules
debounce.debounce = debounce;

var debounce_1 = debounce;

class Store {
    constructor(dbName = 'keyval-store', storeName = 'keyval') {
        this.storeName = storeName;
        this._dbp = new Promise((resolve, reject) => {
            const openreq = indexedDB.open(dbName, 1);
            openreq.onerror = () => reject(openreq.error);
            openreq.onsuccess = () => resolve(openreq.result);
            // First time setup: create an empty object store
            openreq.onupgradeneeded = () => {
                openreq.result.createObjectStore(storeName);
            };
        });
    }
    _withIDBStore(type, callback) {
        return this._dbp.then(db => new Promise((resolve, reject) => {
            const transaction = db.transaction(this.storeName, type);
            transaction.oncomplete = () => resolve();
            transaction.onabort = transaction.onerror = () => reject(transaction.error);
            callback(transaction.objectStore(this.storeName));
        }));
    }
}
let store;
function getDefaultStore() {
    if (!store)
        store = new Store();
    return store;
}
function get$2(key, store = getDefaultStore()) {
    let req;
    return store._withIDBStore('readonly', store => {
        req = store.get(key);
    }).then(() => req.result);
}
function set$1(key, value, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.put(value, key);
    });
}
function del(key, store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.delete(key);
    });
}
function clear(store = getDefaultStore()) {
    return store._withIDBStore('readwrite', store => {
        store.clear();
    });
}
function keys(store = getDefaultStore()) {
    const keys = [];
    return store._withIDBStore('readonly', store => {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        (store.openKeyCursor || store.openCursor).call(store).onsuccess = function () {
            if (!this.result)
                return;
            keys.push(this.result.key);
            this.result.continue();
        };
    }).then(() => keys);
}

const idbKeyval = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Store: Store,
	get: get$2,
	set: set$1,
	del: del,
	clear: clear,
	keys: keys
});

const idbKeyval$1 = getCjsExportFromNamespace(idbKeyval);

var browser$1 = function (configuration) {
  configuration = Object.assign({
    storageKey: 'gw2api-cache',
    gcTick: 5 * 60 * 1000,
    persistDebounce: 3 * 1000,
    storageEngine: idbKeyval$1
  }, configuration);

  let _storage = {};
  const storageEngine = configuration.storageEngine;
  const storageKey = configuration.storageKey;
  const persist = debounce_1(_persist, configuration.persistDebounce);

  function get (key) {
    return Promise.resolve(_get(key))
  }

  function set (key, value, expiry) {
    _set(key, value, expiry);
    return Promise.resolve(true)
  }

  function mget (keys) {
    let values = keys.map(key => _get(key));
    return Promise.resolve(values)
  }

  function mset (values) {
    values.map(value => {
      _set(value[0], value[1], value[2]);
    });

    return Promise.resolve(true)
  }

  function _get (key) {
    let value = _storage[key];
    let now = (new Date()).getTime();
    return value && value.expiry > now ? value.value : null
  }

  function _set (key, value, expiry) {
    _storage[key] = { value, expiry: (new Date()).getTime() + expiry * 1000 };
    persist();
  }

  function _persist () {
    storageEngine.set(storageKey, _storage)
      .catch(/* istanbul ignore next */ err => {
        console.warn('Failed persisting cache', err);
      });
  }

  function hydrate () {
    storageEngine.get(storageKey)
      .then(value => {
        if (value) {
          _storage = value;
        }
      });
  }

  function flush () {
    _storage = {};
    storageEngine.delete(storageKey);
    return Promise.resolve(true)
  }

  function _getStorage () {
    return _storage
  }

  function garbageCollection () {
    const now = (new Date()).getTime();
    const keys = Object.keys(_storage);

    for (let i = 0; i !== keys.length; i++) {
      if (_storage[keys[i]].expiry < now) {
        delete _storage[keys[i]];
      }
    }

    persist();
  }

  setInterval(garbageCollection, configuration.gcTick);
  hydrate();
  garbageCollection();

  return { get, set, mget, mset, flush, _getStorage }
};

class QueueClient extends client {
    constructor() {
        super();
        this.queues = new Map();
        this.endpoint_promises = new Map();
    }
    async queue(endpoint, ids) {
        const hashes = ids.map(id => endpoint._cacheHash(id));
        let cached = await endpoint._cacheGetMany(hashes);
        cached = cached.filter((x) => x);
        if (cached.length === ids.length) {
            return JSON.parse(JSON.stringify(cached));
        }
        if (this.queues.has(endpoint.url)) {
            this.queues.get(endpoint.url).push(...ids);
        }
        else {
            this.queues.set(endpoint.url, ids);
        }
        if (!this.endpoint_promises.has(endpoint.url)) {
            const p = new Promise((resolve, reject) => {
                window.setTimeout(() => {
                    this.endpoint_promises.delete(endpoint.url);
                    const ids = [...new Set(this.queues.get(endpoint.url))];
                    this.queues.delete(endpoint.url);
                    endpoint.many(ids).then(resolve).catch(reject);
                }, 1000);
            });
            this.endpoint_promises.set(endpoint.url, p);
        }
        const p = this.endpoint_promises.get(endpoint.url);
        const d = await p;
        return d.filter(i => ids.includes(i.id));
    }
}
let api = new QueueClient();
api.schema('2020-08-14T00:00:00Z');
api.language('en');
api.cacheStorage(browser$1());
api.items().cacheTime = 2592000;
api.commerce().prices().cacheTime = 300;

exports.api = api;
