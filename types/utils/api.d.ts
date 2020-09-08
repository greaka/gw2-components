import Client from 'gw2api-client/src/client';
declare class QueueClient extends Client {
    [key: string]: any;
    constructor();
    private queues;
    private endpoint_promises;
    queue(endpoint: any, ids: number[]): Promise<any>;
}
declare let api: QueueClient;
export default api;
