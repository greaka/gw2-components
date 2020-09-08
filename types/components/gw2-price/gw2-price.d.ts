export declare class Gw2Price {
    itemId: number;
    buy: boolean;
    tptax: number;
    tax: number;
    prices: any;
    item: any;
    componentWillRender(): Promise<void>;
    taxit: (price: number) => number;
    val: () => number;
    render(): any;
}
