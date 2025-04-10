import{r as t}from"./vendor-react-core.73efc664.js";var e={},n=t;
/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var r="function"==typeof Object.is?Object.is:function(t,e){return t===e&&(0!==t||1/t==1/e)||t!=t&&e!=e},u=n.useState,o=n.useEffect,a=n.useLayoutEffect,i=n.useDebugValue;function c(t){var e=t.getSnapshot;t=t.value;try{var n=e();return!r(t,n)}catch(u){return!0}}var s="undefined"==typeof window||void 0===window.document||void 0===window.document.createElement?function(t,e){return e()}:function(t,e){var n=e(),r=u({inst:{value:n,getSnapshot:e}}),s=r[0].inst,f=r[1];return a((function(){s.value=n,s.getSnapshot=e,c(s)&&f({inst:s})}),[t,n,e]),o((function(){return c(s)&&f({inst:s}),t((function(){c(s)&&f({inst:s})}))}),[t]),i(n),n};e.useSyncExternalStore=void 0!==n.useSyncExternalStore?n.useSyncExternalStore:s;export{e as u};
