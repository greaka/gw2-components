import { b as bootstrapLazy } from './index-2fe0d623.js';
import { p as patchBrowser } from './patch-57fa5a76.js';

patchBrowser().then(options => {
  return bootstrapLazy([["gw2-coin_3",[[1,"gw2-price",{"itemId":[2,"item-id"],"buy":[4],"tptax":[2],"tax":[2]}],[1,"gw2-item",{"itemId":[2,"item-id"],"currency":[4],"size":[1]}],[1,"gw2-coin",{"value":[2]}]]]], options);
});
