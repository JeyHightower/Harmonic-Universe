import {
  require_react
} from "./chunk-W4EHDCLL.js";
import {
  __esm,
  __export,
  __toESM
} from "./chunk-EWTE5DHJ.js";

// src/utils/react-is-shim.js
var react_is_shim_exports = {};
__export(react_is_shim_exports, {
  ForwardRef: () => ForwardRef,
  Fragment: () => Fragment,
  Memo: () => Memo,
  default: () => react_is_shim_default,
  isElement: () => isElement,
  isForwardRef: () => isForwardRef,
  isFragment: () => isFragment,
  isLazy: () => isLazy,
  isMemo: () => isMemo,
  isPortal: () => isPortal,
  isProfiler: () => isProfiler,
  isStrictMode: () => isStrictMode,
  isSuspense: () => isSuspense,
  isValidElement: () => isValidElement,
  isValidElementType: () => isValidElementType,
  typeOf: () => typeOf
});
function typeOf(object) {
  if (object === null || typeof object !== "object") {
    return null;
  }
  return object.$$typeof || null;
}
var import_react, ReactSymbols, isElement, isValidElementType, isForwardRef, isFragment, isLazy, isMemo, isPortal, isProfiler, isStrictMode, isSuspense, isValidElement, ReactIs, ForwardRef, Memo, Fragment, react_is_shim_default;
var init_react_is_shim = __esm({
  "src/utils/react-is-shim.js"() {
    import_react = __toESM(require_react());
    ReactSymbols = {
      REACT_ELEMENT_TYPE: Symbol.for("react.element"),
      REACT_PORTAL_TYPE: Symbol.for("react.portal"),
      REACT_FRAGMENT_TYPE: Symbol.for("react.fragment"),
      REACT_STRICT_MODE_TYPE: Symbol.for("react.strict_mode"),
      REACT_PROFILER_TYPE: Symbol.for("react.profiler"),
      REACT_PROVIDER_TYPE: Symbol.for("react.provider"),
      REACT_CONTEXT_TYPE: Symbol.for("react.context"),
      REACT_SERVER_CONTEXT_TYPE: Symbol.for("react.server_context"),
      REACT_FORWARD_REF_TYPE: Symbol.for("react.forward_ref"),
      REACT_SUSPENSE_TYPE: Symbol.for("react.suspense"),
      REACT_SUSPENSE_LIST_TYPE: Symbol.for("react.suspense_list"),
      REACT_MEMO_TYPE: Symbol.for("react.memo"),
      REACT_LAZY_TYPE: Symbol.for("react.lazy")
    };
    isElement = (object) => {
      return typeof object === "object" && object !== null && object.$$typeof === ReactSymbols.REACT_ELEMENT_TYPE;
    };
    isValidElementType = (type) => {
      return typeof type === "string" || typeof type === "function" || type === ReactSymbols.REACT_FRAGMENT_TYPE || type === ReactSymbols.REACT_PROFILER_TYPE || type === ReactSymbols.REACT_STRICT_MODE_TYPE || type === ReactSymbols.REACT_SUSPENSE_TYPE || type === ReactSymbols.REACT_SUSPENSE_LIST_TYPE || typeof type === "object" && type !== null && (type.$$typeof === ReactSymbols.REACT_LAZY_TYPE || type.$$typeof === ReactSymbols.REACT_MEMO_TYPE || type.$$typeof === ReactSymbols.REACT_PROVIDER_TYPE || type.$$typeof === ReactSymbols.REACT_CONTEXT_TYPE || type.$$typeof === ReactSymbols.REACT_FORWARD_REF_TYPE);
    };
    isForwardRef = (object) => {
      return typeOf(object) === ReactSymbols.REACT_FORWARD_REF_TYPE;
    };
    isFragment = (object) => {
      return typeOf(object) === ReactSymbols.REACT_FRAGMENT_TYPE;
    };
    isLazy = (object) => {
      return typeOf(object) === ReactSymbols.REACT_LAZY_TYPE;
    };
    isMemo = (object) => {
      return typeOf(object) === ReactSymbols.REACT_MEMO_TYPE;
    };
    isPortal = (object) => {
      return typeOf(object) === ReactSymbols.REACT_PORTAL_TYPE;
    };
    isProfiler = (object) => {
      return typeOf(object) === ReactSymbols.REACT_PROFILER_TYPE;
    };
    isStrictMode = (object) => {
      return typeOf(object) === ReactSymbols.REACT_STRICT_MODE_TYPE;
    };
    isSuspense = (object) => {
      return typeOf(object) === ReactSymbols.REACT_SUSPENSE_TYPE;
    };
    isValidElement = (object) => {
      return import_react.default.isValidElement(object);
    };
    ReactIs = {
      // Type Symbols
      ForwardRef: ReactSymbols.REACT_FORWARD_REF_TYPE,
      Memo: ReactSymbols.REACT_MEMO_TYPE,
      Fragment: ReactSymbols.REACT_FRAGMENT_TYPE,
      Profiler: ReactSymbols.REACT_PROFILER_TYPE,
      Portal: ReactSymbols.REACT_PORTAL_TYPE,
      StrictMode: ReactSymbols.REACT_STRICT_MODE_TYPE,
      Suspense: ReactSymbols.REACT_SUSPENSE_TYPE,
      SuspenseList: ReactSymbols.REACT_SUSPENSE_LIST_TYPE,
      // Functions
      typeOf,
      isElement,
      isValidElementType,
      isForwardRef,
      isFragment,
      isLazy,
      isMemo,
      isPortal,
      isProfiler,
      isStrictMode,
      isSuspense,
      isValidElement
    };
    ForwardRef = ReactSymbols.REACT_FORWARD_REF_TYPE;
    Memo = ReactSymbols.REACT_MEMO_TYPE;
    Fragment = ReactSymbols.REACT_FRAGMENT_TYPE;
    react_is_shim_default = ReactIs;
  }
});

export {
  isMemo,
  ForwardRef,
  react_is_shim_exports,
  init_react_is_shim
};
//# sourceMappingURL=chunk-SY6MR62M.js.map
