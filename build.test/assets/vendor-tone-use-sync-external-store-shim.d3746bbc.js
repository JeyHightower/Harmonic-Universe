import{r}from"./vendor-react-core.73efc664.js";import{s as e}from"./vendor-tone-shim.e999ecad.js";var n={},u=r,t=e;
/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var o="function"==typeof Object.is?Object.is:function(r,e){return r===e&&(0!==r||1/r==1/e)||r!=r&&e!=e},a=t.useSyncExternalStore,i=u.useRef,l=u.useEffect,c=u.useMemo,f=u.useDebugValue;n.useSyncExternalStoreWithSelector=function(r,e,n,u,t){var s=i(null);if(null===s.current){var v={hasValue:!1,value:null};s.current=v}else v=s.current;s=c((function(){function r(r){if(!l){if(l=!0,a=r,r=u(r),void 0!==t&&v.hasValue){var e=v.value;if(t(e,r))return i=e}return i=r}if(e=i,o(a,r))return e;var n=u(r);return void 0!==t&&t(e,n)?(a=r,e):(a=r,i=n)}var a,i,l=!1,c=void 0===n?null:n;return[function(){return r(e())},null===c?void 0:function(){return r(c())}]}),[e,n,u,t]);var d=a(r,s[0],s[1]);return l((function(){v.hasValue=!0,v.value=d}),[d]),f(d),d};export{n as w};
