import { Component, Prop, h } from '@stencil/core';
export class Gw2Coin {
    constructor() {
        this.abs = () => Math.abs(this.value);
        this.getGold = () => Math.floor(this.abs() / 10000);
        this.getSilver = () => Math.floor(this.abs() / 100) % 100;
        this.getCopper = () => Math.floor(this.abs() % 100);
        this.isZero = () => Math.floor(this.abs()) === 0;
    }
    render() {
        return (h("div", null,
            this.isZero() ? 0 : "",
            this.isZero() ? h("img", { src: "https://wiki.guildwars2.com/images/e/eb/Copper_coin.png" }) : "",
            this.value != this.abs() ? "-" : "",
            this.getGold() != 0 ? h("div", null,
                this.getGold(),
                h("img", { src: "https://wiki.guildwars2.com/images/d/d1/Gold_coin.png" })) : '',
            this.getSilver() != 0 ? h("div", null,
                this.getSilver(),
                h("img", { src: "https://wiki.guildwars2.com/images/3/3c/Silver_coin.png" })) : '',
            this.getCopper() != 0 ? h("div", null,
                this.getCopper(),
                h("img", { src: "https://wiki.guildwars2.com/images/e/eb/Copper_coin.png" })) : ''));
    }
    static get is() { return "gw2-coin"; }
    static get encapsulation() { return "shadow"; }
    static get originalStyleUrls() { return {
        "$": ["gw2-coin.css"]
    }; }
    static get styleUrls() { return {
        "$": ["gw2-coin.css"]
    }; }
    static get properties() { return {
        "value": {
            "type": "number",
            "mutable": false,
            "complexType": {
                "original": "number",
                "resolved": "number",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [],
                "text": ""
            },
            "attribute": "value",
            "reflect": false
        }
    }; }
}
