'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const index = require('./index-34ec73a2.js');
const patch = require('./patch-86e0d277.js');

const defineCustomElements = (win, options) => {
  if (typeof window === 'undefined') return Promise.resolve();
  return patch.patchEsm().then(() => {
  return index.bootstrapLazy([["gw2-coin_3.cjs",[[1,"gw2-price",{"itemId":[2,"item-id"],"buy":[4],"tptax":[2],"tax":[2]}],[1,"gw2-item",{"itemId":[2,"item-id"],"currency":[4],"size":[1]}],[1,"gw2-coin",{"value":[2]}]]]], options);
  });
};

exports.defineCustomElements = defineCustomElements;
