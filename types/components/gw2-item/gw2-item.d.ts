export declare class Gw2Item {
    itemId: number;
    currency: boolean;
    item: {
        name: string;
        icon: string;
    };
    icon: string;
    size: string;
    componentWillRender(): Promise<void>;
    render(): any;
}
