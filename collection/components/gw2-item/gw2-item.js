import { Component, Prop, h } from '@stencil/core';
import api from '../../utils/api';
export class Gw2Item {
    constructor() {
        this.item = { name: "", icon: "" };
        this.size = "16";
    }
    async componentWillRender() {
        try {
            this.item = (await api.queue(this.currency ? api.currencies() : api.items(), [this.itemId]))[0];
            this.icon = this.item.icon.replace('https://render.guildwars2.com/file/', 'https://darthmaim-cdn.de/gw2treasures/icons/').replace('.png', '-' + this.size + 'px.png');
        }
        catch (_a) { }
    }
    render() {
        return (h("div", null,
            h("img", { src: this.icon }),
            this.item.name));
    }
    static get is() { return "gw2-item"; }
    static get encapsulation() { return "shadow"; }
    static get originalStyleUrls() { return {
        "$": ["gw2-item.css"]
    }; }
    static get styleUrls() { return {
        "$": ["gw2-item.css"]
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
        "currency": {
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
            "attribute": "currency",
            "reflect": false
        },
        "size": {
            "type": "string",
            "mutable": false,
            "complexType": {
                "original": "string",
                "resolved": "string",
                "references": {}
            },
            "required": false,
            "optional": false,
            "docs": {
                "tags": [],
                "text": ""
            },
            "attribute": "size",
            "reflect": false,
            "defaultValue": "\"16\""
        }
    }; }
}
