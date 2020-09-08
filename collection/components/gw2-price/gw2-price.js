import { Component, Prop, h } from '@stencil/core';
import api from '../../utils/api';
export class Gw2Price {
    constructor() {
        this.tptax = 1;
        this.tax = 1;
        this.taxit = (price) => Math.round(price * this.tax * (this.prices === undefined ? 1 : this.tptax));
        this.val = () => this.taxit(this.prices === undefined ? this.item.vendor_value : this.buy ? this.prices.buys.unit_price : this.prices.sells.unit_price);
    }
    async componentWillRender() {
        try {
            this.prices = (await api.queue(api.commerce().prices(), [this.itemId]))[0];
        }
        catch (_a) { }
        if (this.prices === undefined) {
            try {
                this.item = (await api.queue(api.items(), [this.itemId]))[0];
            }
            catch (_b) { }
        }
    }
    render() {
        return (h("div", null, this.prices !== undefined || (this.item !== undefined && this.item.vendor_value !== undefined) ? h("gw2-coin", { value: this.val() }) : "no value"));
    }
    static get is() { return "gw2-price"; }
    static get encapsulation() { return "shadow"; }
    static get originalStyleUrls() { return {
        "$": ["gw2-price.css"]
    }; }
    static get styleUrls() { return {
        "$": ["gw2-price.css"]
    }; }
    static get properties() { return {
        "itemId": {
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
            "attribute": "item-id",
            "reflect": false
        },
        "buy": {
            "type": "boolean",
            "mutable": false,
            "complexType": {
                "original": "boolean",
                "resolved": "boolean",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [],
                "text": ""
            },
            "attribute": "buy",
            "reflect": false
        },
        "tptax": {
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
            "attribute": "tptax",
            "reflect": false,
            "defaultValue": "1"
        },
        "tax": {
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
            "attribute": "tax",
            "reflect": false,
            "defaultValue": "1"
        }
    }; }
}
