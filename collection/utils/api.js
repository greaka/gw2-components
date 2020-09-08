import Client from 'gw2api-client/src/client';
import cacheBrowserStorage from 'gw2api-client/src/cache/browser';
class QueueClient extends Client {
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
api.cacheStorage(cacheBrowserStorage());
api.items().cacheTime = 2592000;
api.commerce().prices().cacheTime = 300;
export default api;
