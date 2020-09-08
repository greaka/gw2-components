'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const index = require('./index-34ec73a2.js');
const api = require('./api-d7295012.js');

const gw2CoinCss = ":host{display:inline-block}img{padding:2px 3px 0px 1px}div{display:flex;justify-content:center;align-items:center}";

const Gw2Coin = class {
    constructor(hostRef) {
        index.registerInstance(this, hostRef);
        this.abs = () => Math.abs(this.value);
        this.getGold = () => Math.floor(this.abs() / 10000);
        this.getSilver = () => Math.floor(this.abs() / 100) % 100;
        this.getCopper = () => Math.floor(this.abs() % 100);
        this.isZero = () => Math.floor(this.abs()) === 0;
    }
    render() {
        return (index.h("div", null, this.isZero() ? 0 : "", this.isZero() ? index.h("img", { src: "https://wiki.guildwars2.com/images/e/eb/Copper_coin.png" }) : "", this.value != this.abs() ? "-" : "", this.getGold() != 0 ? index.h("div", null, this.getGold(), index.h("img", { src: "https://wiki.guildwars2.com/images/d/d1/Gold_coin.png" })) : '', this.getSilver() != 0 ? index.h("div", null, this.getSilver(), index.h("img", { src: "https://wiki.guildwars2.com/images/3/3c/Silver_coin.png" })) : '', this.getCopper() != 0 ? index.h("div", null, this.getCopper(), index.h("img", { src: "https://wiki.guildwars2.com/images/e/eb/Copper_coin.png" })) : ''));
    }
};
Gw2Coin.style = gw2CoinCss;

const gw2ItemCss = ":host{display:inline-block}img{display:inline-block;margin-top:1px;margin-right:3px}div{display:flex;justify-content:center;align-items:center}";

const Gw2Item = class {
    constructor(hostRef) {
        index.registerInstance(this, hostRef);
        this.item = { name: "", icon: "" };
        this.size = "16";
    }
    async componentWillRender() {
        try {
            this.item = (await api.api.queue(this.currency ? api.api.currencies() : api.api.items(), [this.itemId]))[0];
            this.icon = this.item.icon.replace('https://render.guildwars2.com/file/', 'https://darthmaim-cdn.de/gw2treasures/icons/').replace('.png', '-' + this.size + 'px.png');
        }
        catch (_a) { }
    }
    render() {
        return (index.h("div", null, index.h("img", { src: this.icon }), this.item.name));
    }
};
Gw2Item.style = gw2ItemCss;

const gw2PriceCss = "div{display:inline-block}";

const Gw2Price = class {
    constructor(hostRef) {
        index.registerInstance(this, hostRef);
        this.tptax = 1;
        this.tax = 1;
        this.taxit = (price) => Math.round(price * this.tax * (this.prices === undefined ? 1 : this.tptax));
        this.val = () => this.taxit(this.prices === undefined ? this.item.vendor_value : this.buy ? this.prices.buys.unit_price : this.prices.sells.unit_price);
    }
    async componentWillRender() {
        try {
            this.prices = (await api.api.queue(api.api.commerce().prices(), [this.itemId]))[0];
        }
        catch (_a) { }
        if (this.prices === undefined) {
            try {
                this.item = (await api.api.queue(api.api.items(), [this.itemId]))[0];
            }
            catch (_b) { }
        }
    }
    render() {
        return (index.h("div", null, this.prices !== undefined || (this.item !== undefined && this.item.vendor_value !== undefined) ? index.h("gw2-coin", { value: this.val() }) : "no value"));
    }
};
Gw2Price.style = gw2PriceCss;

exports.gw2_coin = Gw2Coin;
exports.gw2_item = Gw2Item;
exports.gw2_price = Gw2Price;
