var Cr = Object.defineProperty;
var Pr = (e, t, r) =>
  t in e ? Cr(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : (e[t] = r);
var je = (e, t, r) => (Pr(e, typeof t != 'symbol' ? t + '' : t, r), r);
function D(e) {
  return `Minified Redux error #${e}; visit https://redux.js.org/Errors?code=${e} for the full message or use the non-minified dev environment for full errors. `;
}
var Dr = (() => (typeof Symbol == 'function' && Symbol.observable) || '@@observable')(),
  ht = Dr,
  ve = () => Math.random().toString(36).substring(7).split('').join('.'),
  xr = {
    INIT: `@@redux/INIT${ve()}`,
    REPLACE: `@@redux/REPLACE${ve()}`,
    PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${ve()}`,
  },
  ge = xr;
function st(e) {
  if (typeof e != 'object' || e === null) return !1;
  let t = e;
  for (; Object.getPrototypeOf(t) !== null; ) t = Object.getPrototypeOf(t);
  return Object.getPrototypeOf(e) === t || Object.getPrototypeOf(e) === null;
}
function vt(e, t, r) {
  if (typeof e != 'function') throw new Error(D(2));
  if (
    (typeof t == 'function' && typeof r == 'function') ||
    (typeof r == 'function' && typeof arguments[3] == 'function')
  )
    throw new Error(D(0));
  if ((typeof t == 'function' && typeof r > 'u' && ((r = t), (t = void 0)), typeof r < 'u')) {
    if (typeof r != 'function') throw new Error(D(1));
    return r(vt)(e, t);
  }
  let n = e,
    s = t,
    o = new Map(),
    i = o,
    a = 0,
    f = !1;
  function c() {
    i === o &&
      ((i = new Map()),
      o.forEach((p, S) => {
        i.set(S, p);
      }));
  }
  function u() {
    if (f) throw new Error(D(3));
    return s;
  }
  function d(p) {
    if (typeof p != 'function') throw new Error(D(4));
    if (f) throw new Error(D(5));
    let S = !0;
    c();
    const b = a++;
    return (
      i.set(b, p),
      function () {
        if (S) {
          if (f) throw new Error(D(6));
          (S = !1), c(), i.delete(b), (o = null);
        }
      }
    );
  }
  function m(p) {
    if (!st(p)) throw new Error(D(7));
    if (typeof p.type > 'u') throw new Error(D(8));
    if (typeof p.type != 'string') throw new Error(D(17));
    if (f) throw new Error(D(9));
    try {
      (f = !0), (s = n(s, p));
    } finally {
      f = !1;
    }
    return (
      (o = i).forEach((b) => {
        b();
      }),
      p
    );
  }
  function E(p) {
    if (typeof p != 'function') throw new Error(D(10));
    (n = p), m({ type: ge.REPLACE });
  }
  function h() {
    const p = d;
    return {
      subscribe(S) {
        if (typeof S != 'object' || S === null) throw new Error(D(11));
        function b() {
          const _ = S;
          _.next && _.next(u());
        }
        return b(), { unsubscribe: p(b) };
      },
      [ht]() {
        return this;
      },
    };
  }
  return (
    m({ type: ge.INIT }), { dispatch: m, subscribe: d, getState: u, replaceReducer: E, [ht]: h }
  );
}
function Nr(e) {
  Object.keys(e).forEach((t) => {
    const r = e[t];
    if (typeof r(void 0, { type: ge.INIT }) > 'u') throw new Error(D(12));
    if (typeof r(void 0, { type: ge.PROBE_UNKNOWN_ACTION() }) > 'u') throw new Error(D(13));
  });
}
function Lr(e) {
  const t = Object.keys(e),
    r = {};
  for (let o = 0; o < t.length; o++) {
    const i = t[o];
    typeof e[i] == 'function' && (r[i] = e[i]);
  }
  const n = Object.keys(r);
  let s;
  try {
    Nr(r);
  } catch (o) {
    s = o;
  }
  return function (i = {}, a) {
    if (s) throw s;
    let f = !1;
    const c = {};
    for (let u = 0; u < n.length; u++) {
      const d = n[u],
        m = r[d],
        E = i[d],
        h = m(E, a);
      if (typeof h > 'u') throw (a && a.type, new Error(D(14)));
      (c[d] = h), (f = f || h !== E);
    }
    return (f = f || n.length !== Object.keys(i).length), f ? c : i;
  };
}
function we(...e) {
  return e.length === 0
    ? (t) => t
    : e.length === 1
      ? e[0]
      : e.reduce(
          (t, r) =>
            (...n) =>
              t(r(...n))
        );
}
function $r(...e) {
  return (t) => (r, n) => {
    const s = t(r, n);
    let o = () => {
      throw new Error(D(15));
    };
    const i = { getState: s.getState, dispatch: (f, ...c) => o(f, ...c) },
      a = e.map((f) => f(i));
    return (o = we(...a)(s.dispatch)), { ...s, dispatch: o };
  };
}
function Ur(e) {
  return st(e) && 'type' in e && typeof e.type == 'string';
}
var Bt = Symbol.for('immer-nothing'),
  mt = Symbol.for('immer-draftable'),
  U = Symbol.for('immer-state');
function v(e, ...t) {
  throw new Error(`[Immer] minified error nr: ${e}. Full error at: https://bit.ly/3cXEKWf`);
}
var Y = Object.getPrototypeOf;
function V(e) {
  return !!e && !!e[U];
}
function z(e) {
  var t;
  return e
    ? It(e) ||
        Array.isArray(e) ||
        !!e[mt] ||
        !!((t = e.constructor) != null && t[mt]) ||
        Ae(e) ||
        ke(e)
    : !1;
}
var Fr = Object.prototype.constructor.toString();
function It(e) {
  if (!e || typeof e != 'object') return !1;
  const t = Y(e);
  if (t === null) return !0;
  const r = Object.hasOwnProperty.call(t, 'constructor') && t.constructor;
  return r === Object ? !0 : typeof r == 'function' && Function.toString.call(r) === Fr;
}
function be(e, t) {
  Oe(e) === 0
    ? Reflect.ownKeys(e).forEach((r) => {
        t(r, e[r], e);
      })
    : e.forEach((r, n) => t(n, r, e));
}
function Oe(e) {
  const t = e[U];
  return t ? t.type_ : Array.isArray(e) ? 1 : Ae(e) ? 2 : ke(e) ? 3 : 0;
}
function Ke(e, t) {
  return Oe(e) === 2 ? e.has(t) : Object.prototype.hasOwnProperty.call(e, t);
}
function Mt(e, t, r) {
  const n = Oe(e);
  n === 2 ? e.set(t, r) : n === 3 ? e.add(r) : (e[t] = r);
}
function jr(e, t) {
  return e === t ? e !== 0 || 1 / e === 1 / t : e !== e && t !== t;
}
function Ae(e) {
  return e instanceof Map;
}
function ke(e) {
  return e instanceof Set;
}
function K(e) {
  return e.copy_ || e.base_;
}
function Je(e, t) {
  if (Ae(e)) return new Map(e);
  if (ke(e)) return new Set(e);
  if (Array.isArray(e)) return Array.prototype.slice.call(e);
  const r = It(e);
  if (t === !0 || (t === 'class_only' && !r)) {
    const n = Object.getOwnPropertyDescriptors(e);
    delete n[U];
    let s = Reflect.ownKeys(n);
    for (let o = 0; o < s.length; o++) {
      const i = s[o],
        a = n[i];
      a.writable === !1 && ((a.writable = !0), (a.configurable = !0)),
        (a.get || a.set) &&
          (n[i] = { configurable: !0, writable: !0, enumerable: a.enumerable, value: e[i] });
    }
    return Object.create(Y(e), n);
  } else {
    const n = Y(e);
    if (n !== null && r) return { ...e };
    const s = Object.create(n);
    return Object.assign(s, e);
  }
}
function ot(e, t = !1) {
  return (
    Ce(e) ||
      V(e) ||
      !z(e) ||
      (Oe(e) > 1 && (e.set = e.add = e.clear = e.delete = vr),
      Object.freeze(e),
      t && Object.entries(e).forEach(([r, n]) => ot(n, !0))),
    e
  );
}
function vr() {
  v(2);
}
function Ce(e) {
  return Object.isFrozen(e);
}
var Br = {};
function G(e) {
  const t = Br[e];
  return t || v(0, e), t;
}
var oe;
function qt() {
  return oe;
}
function Ir(e, t) {
  return { drafts_: [], parent_: e, immer_: t, canAutoFreeze_: !0, unfinalizedDrafts_: 0 };
}
function yt(e, t) {
  t && (G('Patches'), (e.patches_ = []), (e.inversePatches_ = []), (e.patchListener_ = t));
}
function Ve(e) {
  Ge(e), e.drafts_.forEach(Mr), (e.drafts_ = null);
}
function Ge(e) {
  e === oe && (oe = e.parent_);
}
function gt(e) {
  return (oe = Ir(oe, e));
}
function Mr(e) {
  const t = e[U];
  t.type_ === 0 || t.type_ === 1 ? t.revoke_() : (t.revoked_ = !0);
}
function wt(e, t) {
  t.unfinalizedDrafts_ = t.drafts_.length;
  const r = t.drafts_[0];
  return (
    e !== void 0 && e !== r
      ? (r[U].modified_ && (Ve(t), v(4)),
        z(e) && ((e = Ee(t, e)), t.parent_ || Se(t, e)),
        t.patches_ &&
          G('Patches').generateReplacementPatches_(r[U].base_, e, t.patches_, t.inversePatches_))
      : (e = Ee(t, r, [])),
    Ve(t),
    t.patches_ && t.patchListener_(t.patches_, t.inversePatches_),
    e !== Bt ? e : void 0
  );
}
function Ee(e, t, r) {
  if (Ce(t)) return t;
  const n = t[U];
  if (!n) return be(t, (s, o) => bt(e, n, t, s, o, r)), t;
  if (n.scope_ !== e) return t;
  if (!n.modified_) return Se(e, n.base_, !0), n.base_;
  if (!n.finalized_) {
    (n.finalized_ = !0), n.scope_.unfinalizedDrafts_--;
    const s = n.copy_;
    let o = s,
      i = !1;
    n.type_ === 3 && ((o = new Set(s)), s.clear(), (i = !0)),
      be(o, (a, f) => bt(e, n, s, a, f, r, i)),
      Se(e, s, !1),
      r && e.patches_ && G('Patches').generatePatches_(n, r, e.patches_, e.inversePatches_);
  }
  return n.copy_;
}
function bt(e, t, r, n, s, o, i) {
  if (V(s)) {
    const a = o && t && t.type_ !== 3 && !Ke(t.assigned_, n) ? o.concat(n) : void 0,
      f = Ee(e, s, a);
    if ((Mt(r, n, f), V(f))) e.canAutoFreeze_ = !1;
    else return;
  } else i && r.add(s);
  if (z(s) && !Ce(s)) {
    if (!e.immer_.autoFreeze_ && e.unfinalizedDrafts_ < 1) return;
    Ee(e, s),
      (!t || !t.scope_.parent_) &&
        typeof n != 'symbol' &&
        Object.prototype.propertyIsEnumerable.call(r, n) &&
        Se(e, s);
  }
}
function Se(e, t, r = !1) {
  !e.parent_ && e.immer_.autoFreeze_ && e.canAutoFreeze_ && ot(t, r);
}
function qr(e, t) {
  const r = Array.isArray(e),
    n = {
      type_: r ? 1 : 0,
      scope_: t ? t.scope_ : qt(),
      modified_: !1,
      finalized_: !1,
      assigned_: {},
      parent_: t,
      base_: e,
      draft_: null,
      copy_: null,
      revoke_: null,
      isManual_: !1,
    };
  let s = n,
    o = it;
  r && ((s = [n]), (o = ie));
  const { revoke: i, proxy: a } = Proxy.revocable(s, o);
  return (n.draft_ = a), (n.revoke_ = i), a;
}
var it = {
    get(e, t) {
      if (t === U) return e;
      const r = K(e);
      if (!Ke(r, t)) return zr(e, r, t);
      const n = r[t];
      return e.finalized_ || !z(n)
        ? n
        : n === Be(e.base_, t)
          ? (Ie(e), (e.copy_[t] = Qe(n, e)))
          : n;
    },
    has(e, t) {
      return t in K(e);
    },
    ownKeys(e) {
      return Reflect.ownKeys(K(e));
    },
    set(e, t, r) {
      const n = zt(K(e), t);
      if (n != null && n.set) return n.set.call(e.draft_, r), !0;
      if (!e.modified_) {
        const s = Be(K(e), t),
          o = s == null ? void 0 : s[U];
        if (o && o.base_ === r) return (e.copy_[t] = r), (e.assigned_[t] = !1), !0;
        if (jr(r, s) && (r !== void 0 || Ke(e.base_, t))) return !0;
        Ie(e), Xe(e);
      }
      return (
        (e.copy_[t] === r && (r !== void 0 || t in e.copy_)) ||
          (Number.isNaN(r) && Number.isNaN(e.copy_[t])) ||
          ((e.copy_[t] = r), (e.assigned_[t] = !0)),
        !0
      );
    },
    deleteProperty(e, t) {
      return (
        Be(e.base_, t) !== void 0 || t in e.base_
          ? ((e.assigned_[t] = !1), Ie(e), Xe(e))
          : delete e.assigned_[t],
        e.copy_ && delete e.copy_[t],
        !0
      );
    },
    getOwnPropertyDescriptor(e, t) {
      const r = K(e),
        n = Reflect.getOwnPropertyDescriptor(r, t);
      return (
        n && {
          writable: !0,
          configurable: e.type_ !== 1 || t !== 'length',
          enumerable: n.enumerable,
          value: r[t],
        }
      );
    },
    defineProperty() {
      v(11);
    },
    getPrototypeOf(e) {
      return Y(e.base_);
    },
    setPrototypeOf() {
      v(12);
    },
  },
  ie = {};
be(it, (e, t) => {
  ie[e] = function () {
    return (arguments[0] = arguments[0][0]), t.apply(this, arguments);
  };
});
ie.deleteProperty = function (e, t) {
  return ie.set.call(this, e, t, void 0);
};
ie.set = function (e, t, r) {
  return it.set.call(this, e[0], t, r, e[0]);
};
function Be(e, t) {
  const r = e[U];
  return (r ? K(r) : e)[t];
}
function zr(e, t, r) {
  var s;
  const n = zt(t, r);
  return n ? ('value' in n ? n.value : (s = n.get) == null ? void 0 : s.call(e.draft_)) : void 0;
}
function zt(e, t) {
  if (!(t in e)) return;
  let r = Y(e);
  for (; r; ) {
    const n = Object.getOwnPropertyDescriptor(r, t);
    if (n) return n;
    r = Y(r);
  }
}
function Xe(e) {
  e.modified_ || ((e.modified_ = !0), e.parent_ && Xe(e.parent_));
}
function Ie(e) {
  e.copy_ || (e.copy_ = Je(e.base_, e.scope_.immer_.useStrictShallowCopy_));
}
var Hr = class {
  constructor(e) {
    (this.autoFreeze_ = !0),
      (this.useStrictShallowCopy_ = !1),
      (this.produce = (t, r, n) => {
        if (typeof t == 'function' && typeof r != 'function') {
          const o = r;
          r = t;
          const i = this;
          return function (f = o, ...c) {
            return i.produce(f, (u) => r.call(this, u, ...c));
          };
        }
        typeof r != 'function' && v(6), n !== void 0 && typeof n != 'function' && v(7);
        let s;
        if (z(t)) {
          const o = gt(this),
            i = Qe(t, void 0);
          let a = !0;
          try {
            (s = r(i)), (a = !1);
          } finally {
            a ? Ve(o) : Ge(o);
          }
          return yt(o, n), wt(s, o);
        } else if (!t || typeof t != 'object') {
          if (
            ((s = r(t)),
            s === void 0 && (s = t),
            s === Bt && (s = void 0),
            this.autoFreeze_ && ot(s, !0),
            n)
          ) {
            const o = [],
              i = [];
            G('Patches').generateReplacementPatches_(t, s, o, i), n(o, i);
          }
          return s;
        } else v(1, t);
      }),
      (this.produceWithPatches = (t, r) => {
        if (typeof t == 'function')
          return (i, ...a) => this.produceWithPatches(i, (f) => t(f, ...a));
        let n, s;
        return [
          this.produce(t, r, (i, a) => {
            (n = i), (s = a);
          }),
          n,
          s,
        ];
      }),
      typeof (e == null ? void 0 : e.autoFreeze) == 'boolean' && this.setAutoFreeze(e.autoFreeze),
      typeof (e == null ? void 0 : e.useStrictShallowCopy) == 'boolean' &&
        this.setUseStrictShallowCopy(e.useStrictShallowCopy);
  }
  createDraft(e) {
    z(e) || v(8), V(e) && (e = Wr(e));
    const t = gt(this),
      r = Qe(e, void 0);
    return (r[U].isManual_ = !0), Ge(t), r;
  }
  finishDraft(e, t) {
    const r = e && e[U];
    (!r || !r.isManual_) && v(9);
    const { scope_: n } = r;
    return yt(n, t), wt(void 0, n);
  }
  setAutoFreeze(e) {
    this.autoFreeze_ = e;
  }
  setUseStrictShallowCopy(e) {
    this.useStrictShallowCopy_ = e;
  }
  applyPatches(e, t) {
    let r;
    for (r = t.length - 1; r >= 0; r--) {
      const s = t[r];
      if (s.path.length === 0 && s.op === 'replace') {
        e = s.value;
        break;
      }
    }
    r > -1 && (t = t.slice(r + 1));
    const n = G('Patches').applyPatches_;
    return V(e) ? n(e, t) : this.produce(e, (s) => n(s, t));
  }
};
function Qe(e, t) {
  const r = Ae(e) ? G('MapSet').proxyMap_(e, t) : ke(e) ? G('MapSet').proxySet_(e, t) : qr(e, t);
  return (t ? t.scope_ : qt()).drafts_.push(r), r;
}
function Wr(e) {
  return V(e) || v(10, e), Ht(e);
}
function Ht(e) {
  if (!z(e) || Ce(e)) return e;
  const t = e[U];
  let r;
  if (t) {
    if (!t.modified_) return t.base_;
    (t.finalized_ = !0), (r = Je(e, t.scope_.immer_.useStrictShallowCopy_));
  } else r = Je(e, !0);
  return (
    be(r, (n, s) => {
      Mt(r, n, Ht(s));
    }),
    t && (t.finalized_ = !1),
    r
  );
}
var F = new Hr(),
  Wt = F.produce;
F.produceWithPatches.bind(F);
F.setAutoFreeze.bind(F);
F.setUseStrictShallowCopy.bind(F);
F.applyPatches.bind(F);
F.createDraft.bind(F);
F.finishDraft.bind(F);
function Kt(e) {
  return ({ dispatch: r, getState: n }) =>
    (s) =>
    (o) =>
      typeof o == 'function' ? o(r, n, e) : s(o);
}
var Kr = Kt(),
  Jr = Kt,
  Vr =
    typeof window < 'u' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      : function () {
          if (arguments.length !== 0)
            return typeof arguments[0] == 'object' ? we : we.apply(null, arguments);
        },
  Gr = (e) => e && typeof e.match == 'function';
function se(e, t) {
  function r(...n) {
    if (t) {
      let s = t(...n);
      if (!s) throw new Error(q(0));
      return {
        type: e,
        payload: s.payload,
        ...('meta' in s && { meta: s.meta }),
        ...('error' in s && { error: s.error }),
      };
    }
    return { type: e, payload: n[0] };
  }
  return (r.toString = () => `${e}`), (r.type = e), (r.match = (n) => Ur(n) && n.type === e), r;
}
var Jt = class ne extends Array {
  constructor(...t) {
    super(...t), Object.setPrototypeOf(this, ne.prototype);
  }
  static get [Symbol.species]() {
    return ne;
  }
  concat(...t) {
    return super.concat.apply(this, t);
  }
  prepend(...t) {
    return t.length === 1 && Array.isArray(t[0])
      ? new ne(...t[0].concat(this))
      : new ne(...t.concat(this));
  }
};
function Et(e) {
  return z(e) ? Wt(e, () => {}) : e;
}
function St(e, t, r) {
  return e.has(t) ? e.get(t) : e.set(t, r(t)).get(t);
}
function Xr(e) {
  return typeof e == 'boolean';
}
var Qr = () =>
    function (t) {
      const {
        thunk: r = !0,
        immutableCheck: n = !0,
        serializableCheck: s = !0,
        actionCreatorCheck: o = !0,
      } = t ?? {};
      let i = new Jt();
      return r && (Xr(r) ? i.push(Kr) : i.push(Jr(r.extraArgument))), i;
    },
  Yr = 'RTK_autoBatch',
  _t = (e) => (t) => {
    setTimeout(t, e);
  },
  Zr =
    (e = { type: 'raf' }) =>
    (t) =>
    (...r) => {
      const n = t(...r);
      let s = !0,
        o = !1,
        i = !1;
      const a = new Set(),
        f =
          e.type === 'tick'
            ? queueMicrotask
            : e.type === 'raf'
              ? typeof window < 'u' && window.requestAnimationFrame
                ? window.requestAnimationFrame
                : _t(10)
              : e.type === 'callback'
                ? e.queueNotification
                : _t(e.timeout),
        c = () => {
          (i = !1), o && ((o = !1), a.forEach((u) => u()));
        };
      return Object.assign({}, n, {
        subscribe(u) {
          const d = () => s && u(),
            m = n.subscribe(d);
          return (
            a.add(u),
            () => {
              m(), a.delete(u);
            }
          );
        },
        dispatch(u) {
          var d;
          try {
            return (
              (s = !((d = u == null ? void 0 : u.meta) != null && d[Yr])),
              (o = !s),
              o && (i || ((i = !0), f(c))),
              n.dispatch(u)
            );
          } finally {
            s = !0;
          }
        },
      });
    },
  en = (e) =>
    function (r) {
      const { autoBatch: n = !0 } = r ?? {};
      let s = new Jt(e);
      return n && s.push(Zr(typeof n == 'object' ? n : void 0)), s;
    };
function wo(e) {
  const t = Qr(),
    {
      reducer: r = void 0,
      middleware: n,
      devTools: s = !0,
      preloadedState: o = void 0,
      enhancers: i = void 0,
    } = e || {};
  let a;
  if (typeof r == 'function') a = r;
  else if (st(r)) a = Lr(r);
  else throw new Error(q(1));
  let f;
  typeof n == 'function' ? (f = n(t)) : (f = t());
  let c = we;
  s && (c = Vr({ trace: !1, ...(typeof s == 'object' && s) }));
  const u = $r(...f),
    d = en(u);
  let m = typeof i == 'function' ? i(d) : d();
  const E = c(...m);
  return vt(a, o, E);
}
function Vt(e) {
  const t = {},
    r = [];
  let n;
  const s = {
    addCase(o, i) {
      const a = typeof o == 'string' ? o : o.type;
      if (!a) throw new Error(q(28));
      if (a in t) throw new Error(q(29));
      return (t[a] = i), s;
    },
    addMatcher(o, i) {
      return r.push({ matcher: o, reducer: i }), s;
    },
    addDefaultCase(o) {
      return (n = o), s;
    },
  };
  return e(s), [t, r, n];
}
function tn(e) {
  return typeof e == 'function';
}
function rn(e, t) {
  let [r, n, s] = Vt(t),
    o;
  if (tn(e)) o = () => Et(e());
  else {
    const a = Et(e);
    o = () => a;
  }
  function i(a = o(), f) {
    let c = [r[f.type], ...n.filter(({ matcher: u }) => u(f)).map(({ reducer: u }) => u)];
    return (
      c.filter((u) => !!u).length === 0 && (c = [s]),
      c.reduce((u, d) => {
        if (d)
          if (V(u)) {
            const E = d(u, f);
            return E === void 0 ? u : E;
          } else {
            if (z(u)) return Wt(u, (m) => d(m, f));
            {
              const m = d(u, f);
              if (m === void 0) {
                if (u === null) return u;
                throw Error('A case reducer on a non-draftable value must not return undefined');
              }
              return m;
            }
          }
        return u;
      }, a)
    );
  }
  return (i.getInitialState = o), i;
}
var nn = (e, t) => (Gr(e) ? e.match(t) : e(t));
function sn(...e) {
  return (t) => e.some((r) => nn(r, t));
}
var on = 'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW',
  an = (e = 21) => {
    let t = '',
      r = e;
    for (; r--; ) t += on[(Math.random() * 64) | 0];
    return t;
  },
  cn = ['name', 'message', 'stack', 'code'],
  Me = class {
    constructor(e, t) {
      je(this, '_type');
      (this.payload = e), (this.meta = t);
    }
  },
  Rt = class {
    constructor(e, t) {
      je(this, '_type');
      (this.payload = e), (this.meta = t);
    }
  },
  un = (e) => {
    if (typeof e == 'object' && e !== null) {
      const t = {};
      for (const r of cn) typeof e[r] == 'string' && (t[r] = e[r]);
      return t;
    }
    return { message: String(e) };
  },
  Pe = (() => {
    function e(t, r, n) {
      const s = se(t + '/fulfilled', (f, c, u, d) => ({
          payload: f,
          meta: { ...(d || {}), arg: u, requestId: c, requestStatus: 'fulfilled' },
        })),
        o = se(t + '/pending', (f, c, u) => ({
          payload: void 0,
          meta: { ...(u || {}), arg: c, requestId: f, requestStatus: 'pending' },
        })),
        i = se(t + '/rejected', (f, c, u, d, m) => ({
          payload: d,
          error: ((n && n.serializeError) || un)(f || 'Rejected'),
          meta: {
            ...(m || {}),
            arg: u,
            requestId: c,
            rejectedWithValue: !!d,
            requestStatus: 'rejected',
            aborted: (f == null ? void 0 : f.name) === 'AbortError',
            condition: (f == null ? void 0 : f.name) === 'ConditionError',
          },
        }));
      function a(f) {
        return (c, u, d) => {
          const m = n != null && n.idGenerator ? n.idGenerator(f) : an(),
            E = new AbortController();
          let h, y;
          function p(b) {
            (y = b), E.abort();
          }
          const S = (async function () {
            var _, O;
            let b;
            try {
              let k =
                (_ = n == null ? void 0 : n.condition) == null
                  ? void 0
                  : _.call(n, f, { getState: u, extra: d });
              if ((fn(k) && (k = await k), k === !1 || E.signal.aborted))
                throw {
                  name: 'ConditionError',
                  message: 'Aborted due to condition callback returning false.',
                };
              const P = new Promise((A, j) => {
                (h = () => {
                  j({ name: 'AbortError', message: y || 'Aborted' });
                }),
                  E.signal.addEventListener('abort', h);
              });
              c(
                o(
                  m,
                  f,
                  (O = n == null ? void 0 : n.getPendingMeta) == null
                    ? void 0
                    : O.call(n, { requestId: m, arg: f }, { getState: u, extra: d })
                )
              ),
                (b = await Promise.race([
                  P,
                  Promise.resolve(
                    r(f, {
                      dispatch: c,
                      getState: u,
                      extra: d,
                      requestId: m,
                      signal: E.signal,
                      abort: p,
                      rejectWithValue: (A, j) => new Me(A, j),
                      fulfillWithValue: (A, j) => new Rt(A, j),
                    })
                  ).then((A) => {
                    if (A instanceof Me) throw A;
                    return A instanceof Rt ? s(A.payload, m, f, A.meta) : s(A, m, f);
                  }),
                ]));
            } catch (k) {
              b = k instanceof Me ? i(null, m, f, k.payload, k.meta) : i(k, m, f);
            } finally {
              h && E.signal.removeEventListener('abort', h);
            }
            return (
              (n && !n.dispatchConditionRejection && i.match(b) && b.meta.condition) || c(b), b
            );
          })();
          return Object.assign(S, {
            abort: p,
            requestId: m,
            arg: f,
            unwrap() {
              return S.then(ln);
            },
          });
        };
      }
      return Object.assign(a, {
        pending: o,
        rejected: i,
        fulfilled: s,
        settled: sn(i, s),
        typePrefix: t,
      });
    }
    return (e.withTypes = () => e), e;
  })();
function ln(e) {
  if (e.meta && e.meta.rejectedWithValue) throw e.payload;
  if (e.error) throw e.error;
  return e.payload;
}
function fn(e) {
  return e !== null && typeof e == 'object' && typeof e.then == 'function';
}
var dn = Symbol.for('rtk-slice-createasyncthunk');
function pn(e, t) {
  return `${e}/${t}`;
}
function hn({ creators: e } = {}) {
  var r;
  const t = (r = e == null ? void 0 : e.asyncThunk) == null ? void 0 : r[dn];
  return function (s) {
    const { name: o, reducerPath: i = o } = s;
    if (!o) throw new Error(q(11));
    typeof process < 'u';
    const a = (typeof s.reducers == 'function' ? s.reducers(gn()) : s.reducers) || {},
      f = Object.keys(a),
      c = {
        sliceCaseReducersByName: {},
        sliceCaseReducersByType: {},
        actionCreators: {},
        sliceMatchers: [],
      },
      u = {
        addCase(g, _) {
          const O = typeof g == 'string' ? g : g.type;
          if (!O) throw new Error(q(12));
          if (O in c.sliceCaseReducersByType) throw new Error(q(13));
          return (c.sliceCaseReducersByType[O] = _), u;
        },
        addMatcher(g, _) {
          return c.sliceMatchers.push({ matcher: g, reducer: _ }), u;
        },
        exposeAction(g, _) {
          return (c.actionCreators[g] = _), u;
        },
        exposeCaseReducer(g, _) {
          return (c.sliceCaseReducersByName[g] = _), u;
        },
      };
    f.forEach((g) => {
      const _ = a[g],
        O = { reducerName: g, type: pn(o, g), createNotation: typeof s.reducers == 'function' };
      bn(_) ? Sn(O, _, u, t) : wn(O, _, u);
    });
    function d() {
      const [g = {}, _ = [], O = void 0] =
          typeof s.extraReducers == 'function' ? Vt(s.extraReducers) : [s.extraReducers],
        k = { ...g, ...c.sliceCaseReducersByType };
      return rn(s.initialState, (P) => {
        for (let A in k) P.addCase(A, k[A]);
        for (let A of c.sliceMatchers) P.addMatcher(A.matcher, A.reducer);
        for (let A of _) P.addMatcher(A.matcher, A.reducer);
        O && P.addDefaultCase(O);
      });
    }
    const m = (g) => g,
      E = new Map();
    let h;
    function y(g, _) {
      return h || (h = d()), h(g, _);
    }
    function p() {
      return h || (h = d()), h.getInitialState();
    }
    function S(g, _ = !1) {
      function O(P) {
        let A = P[g];
        return typeof A > 'u' && _ && (A = p()), A;
      }
      function k(P = m) {
        const A = St(E, _, () => new WeakMap());
        return St(A, P, () => {
          const j = {};
          for (const [Ar, kr] of Object.entries(s.selectors ?? {})) j[Ar] = mn(kr, P, p, _);
          return j;
        });
      }
      return {
        reducerPath: g,
        getSelectors: k,
        get selectors() {
          return k(O);
        },
        selectSlice: O,
      };
    }
    const b = {
      name: o,
      reducer: y,
      actions: c.actionCreators,
      caseReducers: c.sliceCaseReducersByName,
      getInitialState: p,
      ...S(i),
      injectInto(g, { reducerPath: _, ...O } = {}) {
        const k = _ ?? i;
        return g.inject({ reducerPath: k, reducer: y }, O), { ...b, ...S(k, !0) };
      },
    };
    return b;
  };
}
function mn(e, t, r, n) {
  function s(o, ...i) {
    let a = t(o);
    return typeof a > 'u' && n && (a = r()), e(a, ...i);
  }
  return (s.unwrapped = e), s;
}
var yn = hn();
function gn() {
  function e(t, r) {
    return { _reducerDefinitionType: 'asyncThunk', payloadCreator: t, ...r };
  }
  return (
    (e.withTypes = () => e),
    {
      reducer(t) {
        return Object.assign(
          {
            [t.name](...r) {
              return t(...r);
            },
          }[t.name],
          { _reducerDefinitionType: 'reducer' }
        );
      },
      preparedReducer(t, r) {
        return { _reducerDefinitionType: 'reducerWithPrepare', prepare: t, reducer: r };
      },
      asyncThunk: e,
    }
  );
}
function wn({ type: e, reducerName: t, createNotation: r }, n, s) {
  let o, i;
  if ('reducer' in n) {
    if (r && !En(n)) throw new Error(q(17));
    (o = n.reducer), (i = n.prepare);
  } else o = n;
  s.addCase(e, o)
    .exposeCaseReducer(t, o)
    .exposeAction(t, i ? se(e, i) : se(e));
}
function bn(e) {
  return e._reducerDefinitionType === 'asyncThunk';
}
function En(e) {
  return e._reducerDefinitionType === 'reducerWithPrepare';
}
function Sn({ type: e, reducerName: t }, r, n, s) {
  if (!s) throw new Error(q(18));
  const { payloadCreator: o, fulfilled: i, pending: a, rejected: f, settled: c, options: u } = r,
    d = s(e, o, u);
  n.exposeAction(t, d),
    i && n.addCase(d.fulfilled, i),
    a && n.addCase(d.pending, a),
    f && n.addCase(d.rejected, f),
    c && n.addMatcher(d.settled, c),
    n.exposeCaseReducer(t, {
      fulfilled: i || ue,
      pending: a || ue,
      rejected: f || ue,
      settled: c || ue,
    });
}
function ue() {}
function q(e) {
  return `Minified Redux Toolkit error #${e}; visit https://redux-toolkit.js.org/Errors?code=${e} for the full message or use the non-minified dev environment for full errors. `;
}
function Gt(e, t) {
  return function () {
    return e.apply(t, arguments);
  };
}
const { toString: _n } = Object.prototype,
  { getPrototypeOf: at } = Object,
  De = ((e) => (t) => {
    const r = _n.call(t);
    return e[r] || (e[r] = r.slice(8, -1).toLowerCase());
  })(Object.create(null)),
  I = (e) => ((e = e.toLowerCase()), (t) => De(t) === e),
  xe = (e) => (t) => typeof t === e,
  { isArray: ee } = Array,
  ae = xe('undefined');
function Rn(e) {
  return (
    e !== null &&
    !ae(e) &&
    e.constructor !== null &&
    !ae(e.constructor) &&
    $(e.constructor.isBuffer) &&
    e.constructor.isBuffer(e)
  );
}
const Xt = I('ArrayBuffer');
function Tn(e) {
  let t;
  return (
    typeof ArrayBuffer < 'u' && ArrayBuffer.isView
      ? (t = ArrayBuffer.isView(e))
      : (t = e && e.buffer && Xt(e.buffer)),
    t
  );
}
const On = xe('string'),
  $ = xe('function'),
  Qt = xe('number'),
  Ne = (e) => e !== null && typeof e == 'object',
  An = (e) => e === !0 || e === !1,
  le = (e) => {
    if (De(e) !== 'object') return !1;
    const t = at(e);
    return (
      (t === null || t === Object.prototype || Object.getPrototypeOf(t) === null) &&
      !(Symbol.toStringTag in e) &&
      !(Symbol.iterator in e)
    );
  },
  kn = I('Date'),
  Cn = I('File'),
  Pn = I('Blob'),
  Dn = I('FileList'),
  xn = (e) => Ne(e) && $(e.pipe),
  Nn = (e) => {
    let t;
    return (
      e &&
      ((typeof FormData == 'function' && e instanceof FormData) ||
        ($(e.append) &&
          ((t = De(e)) === 'formdata' ||
            (t === 'object' && $(e.toString) && e.toString() === '[object FormData]'))))
    );
  },
  Ln = I('URLSearchParams'),
  [$n, Un, Fn, jn] = ['ReadableStream', 'Request', 'Response', 'Headers'].map(I),
  vn = (e) => (e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ''));
function ce(e, t, { allOwnKeys: r = !1 } = {}) {
  if (e === null || typeof e > 'u') return;
  let n, s;
  if ((typeof e != 'object' && (e = [e]), ee(e)))
    for (n = 0, s = e.length; n < s; n++) t.call(null, e[n], n, e);
  else {
    const o = r ? Object.getOwnPropertyNames(e) : Object.keys(e),
      i = o.length;
    let a;
    for (n = 0; n < i; n++) (a = o[n]), t.call(null, e[a], a, e);
  }
}
function Yt(e, t) {
  t = t.toLowerCase();
  const r = Object.keys(e);
  let n = r.length,
    s;
  for (; n-- > 0; ) if (((s = r[n]), t === s.toLowerCase())) return s;
  return null;
}
const J = (() =>
    typeof globalThis < 'u'
      ? globalThis
      : typeof self < 'u'
        ? self
        : typeof window < 'u'
          ? window
          : global)(),
  Zt = (e) => !ae(e) && e !== J;
function Ye() {
  const { caseless: e } = (Zt(this) && this) || {},
    t = {},
    r = (n, s) => {
      const o = (e && Yt(t, s)) || s;
      le(t[o]) && le(n)
        ? (t[o] = Ye(t[o], n))
        : le(n)
          ? (t[o] = Ye({}, n))
          : ee(n)
            ? (t[o] = n.slice())
            : (t[o] = n);
    };
  for (let n = 0, s = arguments.length; n < s; n++) arguments[n] && ce(arguments[n], r);
  return t;
}
const Bn = (e, t, r, { allOwnKeys: n } = {}) => (
    ce(
      t,
      (s, o) => {
        r && $(s) ? (e[o] = Gt(s, r)) : (e[o] = s);
      },
      { allOwnKeys: n }
    ),
    e
  ),
  In = (e) => (e.charCodeAt(0) === 65279 && (e = e.slice(1)), e),
  Mn = (e, t, r, n) => {
    (e.prototype = Object.create(t.prototype, n)),
      (e.prototype.constructor = e),
      Object.defineProperty(e, 'super', { value: t.prototype }),
      r && Object.assign(e.prototype, r);
  },
  qn = (e, t, r, n) => {
    let s, o, i;
    const a = {};
    if (((t = t || {}), e == null)) return t;
    do {
      for (s = Object.getOwnPropertyNames(e), o = s.length; o-- > 0; )
        (i = s[o]), (!n || n(i, e, t)) && !a[i] && ((t[i] = e[i]), (a[i] = !0));
      e = r !== !1 && at(e);
    } while (e && (!r || r(e, t)) && e !== Object.prototype);
    return t;
  },
  zn = (e, t, r) => {
    (e = String(e)), (r === void 0 || r > e.length) && (r = e.length), (r -= t.length);
    const n = e.indexOf(t, r);
    return n !== -1 && n === r;
  },
  Hn = (e) => {
    if (!e) return null;
    if (ee(e)) return e;
    let t = e.length;
    if (!Qt(t)) return null;
    const r = new Array(t);
    for (; t-- > 0; ) r[t] = e[t];
    return r;
  },
  Wn = (
    (e) => (t) =>
      e && t instanceof e
  )(typeof Uint8Array < 'u' && at(Uint8Array)),
  Kn = (e, t) => {
    const n = (e && e[Symbol.iterator]).call(e);
    let s;
    for (; (s = n.next()) && !s.done; ) {
      const o = s.value;
      t.call(e, o[0], o[1]);
    }
  },
  Jn = (e, t) => {
    let r;
    const n = [];
    for (; (r = e.exec(t)) !== null; ) n.push(r);
    return n;
  },
  Vn = I('HTMLFormElement'),
  Gn = (e) =>
    e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (r, n, s) {
      return n.toUpperCase() + s;
    }),
  Tt = (
    ({ hasOwnProperty: e }) =>
    (t, r) =>
      e.call(t, r)
  )(Object.prototype),
  Xn = I('RegExp'),
  er = (e, t) => {
    const r = Object.getOwnPropertyDescriptors(e),
      n = {};
    ce(r, (s, o) => {
      let i;
      (i = t(s, o, e)) !== !1 && (n[o] = i || s);
    }),
      Object.defineProperties(e, n);
  },
  Qn = (e) => {
    er(e, (t, r) => {
      if ($(e) && ['arguments', 'caller', 'callee'].indexOf(r) !== -1) return !1;
      const n = e[r];
      if ($(n)) {
        if (((t.enumerable = !1), 'writable' in t)) {
          t.writable = !1;
          return;
        }
        t.set ||
          (t.set = () => {
            throw Error("Can not rewrite read-only method '" + r + "'");
          });
      }
    });
  },
  Yn = (e, t) => {
    const r = {},
      n = (s) => {
        s.forEach((o) => {
          r[o] = !0;
        });
      };
    return ee(e) ? n(e) : n(String(e).split(t)), r;
  },
  Zn = () => {},
  es = (e, t) => (e != null && Number.isFinite((e = +e)) ? e : t),
  qe = 'abcdefghijklmnopqrstuvwxyz',
  Ot = '0123456789',
  tr = { DIGIT: Ot, ALPHA: qe, ALPHA_DIGIT: qe + qe.toUpperCase() + Ot },
  ts = (e = 16, t = tr.ALPHA_DIGIT) => {
    let r = '';
    const { length: n } = t;
    for (; e--; ) r += t[(Math.random() * n) | 0];
    return r;
  };
function rs(e) {
  return !!(e && $(e.append) && e[Symbol.toStringTag] === 'FormData' && e[Symbol.iterator]);
}
const ns = (e) => {
    const t = new Array(10),
      r = (n, s) => {
        if (Ne(n)) {
          if (t.indexOf(n) >= 0) return;
          if (!('toJSON' in n)) {
            t[s] = n;
            const o = ee(n) ? [] : {};
            return (
              ce(n, (i, a) => {
                const f = r(i, s + 1);
                !ae(f) && (o[a] = f);
              }),
              (t[s] = void 0),
              o
            );
          }
        }
        return n;
      };
    return r(e, 0);
  },
  ss = I('AsyncFunction'),
  os = (e) => e && (Ne(e) || $(e)) && $(e.then) && $(e.catch),
  rr = ((e, t) =>
    e
      ? setImmediate
      : t
        ? ((r, n) => (
            J.addEventListener(
              'message',
              ({ source: s, data: o }) => {
                s === J && o === r && n.length && n.shift()();
              },
              !1
            ),
            (s) => {
              n.push(s), J.postMessage(r, '*');
            }
          ))(`axios@${Math.random()}`, [])
        : (r) => setTimeout(r))(typeof setImmediate == 'function', $(J.postMessage)),
  is =
    typeof queueMicrotask < 'u'
      ? queueMicrotask.bind(J)
      : (typeof process < 'u' && process.nextTick) || rr,
  l = {
    isArray: ee,
    isArrayBuffer: Xt,
    isBuffer: Rn,
    isFormData: Nn,
    isArrayBufferView: Tn,
    isString: On,
    isNumber: Qt,
    isBoolean: An,
    isObject: Ne,
    isPlainObject: le,
    isReadableStream: $n,
    isRequest: Un,
    isResponse: Fn,
    isHeaders: jn,
    isUndefined: ae,
    isDate: kn,
    isFile: Cn,
    isBlob: Pn,
    isRegExp: Xn,
    isFunction: $,
    isStream: xn,
    isURLSearchParams: Ln,
    isTypedArray: Wn,
    isFileList: Dn,
    forEach: ce,
    merge: Ye,
    extend: Bn,
    trim: vn,
    stripBOM: In,
    inherits: Mn,
    toFlatObject: qn,
    kindOf: De,
    kindOfTest: I,
    endsWith: zn,
    toArray: Hn,
    forEachEntry: Kn,
    matchAll: Jn,
    isHTMLForm: Vn,
    hasOwnProperty: Tt,
    hasOwnProp: Tt,
    reduceDescriptors: er,
    freezeMethods: Qn,
    toObjectSet: Yn,
    toCamelCase: Gn,
    noop: Zn,
    toFiniteNumber: es,
    findKey: Yt,
    global: J,
    isContextDefined: Zt,
    ALPHABET: tr,
    generateString: ts,
    isSpecCompliantForm: rs,
    toJSONObject: ns,
    isAsyncFn: ss,
    isThenable: os,
    setImmediate: rr,
    asap: is,
  };
function w(e, t, r, n, s) {
  Error.call(this),
    Error.captureStackTrace
      ? Error.captureStackTrace(this, this.constructor)
      : (this.stack = new Error().stack),
    (this.message = e),
    (this.name = 'AxiosError'),
    t && (this.code = t),
    r && (this.config = r),
    n && (this.request = n),
    s && ((this.response = s), (this.status = s.status ? s.status : null));
}
l.inherits(w, Error, {
  toJSON: function () {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: l.toJSONObject(this.config),
      code: this.code,
      status: this.status,
    };
  },
});
const nr = w.prototype,
  sr = {};
[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED',
  'ERR_NOT_SUPPORT',
  'ERR_INVALID_URL',
].forEach((e) => {
  sr[e] = { value: e };
});
Object.defineProperties(w, sr);
Object.defineProperty(nr, 'isAxiosError', { value: !0 });
w.from = (e, t, r, n, s, o) => {
  const i = Object.create(nr);
  return (
    l.toFlatObject(
      e,
      i,
      function (f) {
        return f !== Error.prototype;
      },
      (a) => a !== 'isAxiosError'
    ),
    w.call(i, e.message, t, r, n, s),
    (i.cause = e),
    (i.name = e.name),
    o && Object.assign(i, o),
    i
  );
};
const as = null;
function Ze(e) {
  return l.isPlainObject(e) || l.isArray(e);
}
function or(e) {
  return l.endsWith(e, '[]') ? e.slice(0, -2) : e;
}
function At(e, t, r) {
  return e
    ? e
        .concat(t)
        .map(function (s, o) {
          return (s = or(s)), !r && o ? '[' + s + ']' : s;
        })
        .join(r ? '.' : '')
    : t;
}
function cs(e) {
  return l.isArray(e) && !e.some(Ze);
}
const us = l.toFlatObject(l, {}, null, function (t) {
  return /^is[A-Z]/.test(t);
});
function Le(e, t, r) {
  if (!l.isObject(e)) throw new TypeError('target must be an object');
  (t = t || new FormData()),
    (r = l.toFlatObject(r, { metaTokens: !0, dots: !1, indexes: !1 }, !1, function (y, p) {
      return !l.isUndefined(p[y]);
    }));
  const n = r.metaTokens,
    s = r.visitor || u,
    o = r.dots,
    i = r.indexes,
    f = (r.Blob || (typeof Blob < 'u' && Blob)) && l.isSpecCompliantForm(t);
  if (!l.isFunction(s)) throw new TypeError('visitor must be a function');
  function c(h) {
    if (h === null) return '';
    if (l.isDate(h)) return h.toISOString();
    if (!f && l.isBlob(h)) throw new w('Blob is not supported. Use a Buffer instead.');
    return l.isArrayBuffer(h) || l.isTypedArray(h)
      ? f && typeof Blob == 'function'
        ? new Blob([h])
        : Buffer.from(h)
      : h;
  }
  function u(h, y, p) {
    let S = h;
    if (h && !p && typeof h == 'object') {
      if (l.endsWith(y, '{}')) (y = n ? y : y.slice(0, -2)), (h = JSON.stringify(h));
      else if (
        (l.isArray(h) && cs(h)) ||
        ((l.isFileList(h) || l.endsWith(y, '[]')) && (S = l.toArray(h)))
      )
        return (
          (y = or(y)),
          S.forEach(function (g, _) {
            !(l.isUndefined(g) || g === null) &&
              t.append(i === !0 ? At([y], _, o) : i === null ? y : y + '[]', c(g));
          }),
          !1
        );
    }
    return Ze(h) ? !0 : (t.append(At(p, y, o), c(h)), !1);
  }
  const d = [],
    m = Object.assign(us, { defaultVisitor: u, convertValue: c, isVisitable: Ze });
  function E(h, y) {
    if (!l.isUndefined(h)) {
      if (d.indexOf(h) !== -1) throw Error('Circular reference detected in ' + y.join('.'));
      d.push(h),
        l.forEach(h, function (S, b) {
          (!(l.isUndefined(S) || S === null) &&
            s.call(t, S, l.isString(b) ? b.trim() : b, y, m)) === !0 && E(S, y ? y.concat(b) : [b]);
        }),
        d.pop();
    }
  }
  if (!l.isObject(e)) throw new TypeError('data must be an object');
  return E(e), t;
}
function kt(e) {
  const t = { '!': '%21', "'": '%27', '(': '%28', ')': '%29', '~': '%7E', '%20': '+', '%00': '\0' };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function (n) {
    return t[n];
  });
}
function ct(e, t) {
  (this._pairs = []), e && Le(e, this, t);
}
const ir = ct.prototype;
ir.append = function (t, r) {
  this._pairs.push([t, r]);
};
ir.toString = function (t) {
  const r = t
    ? function (n) {
        return t.call(this, n, kt);
      }
    : kt;
  return this._pairs
    .map(function (s) {
      return r(s[0]) + '=' + r(s[1]);
    }, '')
    .join('&');
};
function ls(e) {
  return encodeURIComponent(e)
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, '+')
    .replace(/%5B/gi, '[')
    .replace(/%5D/gi, ']');
}
function ar(e, t, r) {
  if (!t) return e;
  const n = (r && r.encode) || ls;
  l.isFunction(r) && (r = { serialize: r });
  const s = r && r.serialize;
  let o;
  if (
    (s ? (o = s(t, r)) : (o = l.isURLSearchParams(t) ? t.toString() : new ct(t, r).toString(n)), o)
  ) {
    const i = e.indexOf('#');
    i !== -1 && (e = e.slice(0, i)), (e += (e.indexOf('?') === -1 ? '?' : '&') + o);
  }
  return e;
}
class fs {
  constructor() {
    this.handlers = [];
  }
  use(t, r, n) {
    return (
      this.handlers.push({
        fulfilled: t,
        rejected: r,
        synchronous: n ? n.synchronous : !1,
        runWhen: n ? n.runWhen : null,
      }),
      this.handlers.length - 1
    );
  }
  eject(t) {
    this.handlers[t] && (this.handlers[t] = null);
  }
  clear() {
    this.handlers && (this.handlers = []);
  }
  forEach(t) {
    l.forEach(this.handlers, function (n) {
      n !== null && t(n);
    });
  }
}
const Ct = fs,
  cr = { silentJSONParsing: !0, forcedJSONParsing: !0, clarifyTimeoutError: !1 },
  ds = typeof URLSearchParams < 'u' ? URLSearchParams : ct,
  ps = typeof FormData < 'u' ? FormData : null,
  hs = typeof Blob < 'u' ? Blob : null,
  ms = {
    isBrowser: !0,
    classes: { URLSearchParams: ds, FormData: ps, Blob: hs },
    protocols: ['http', 'https', 'file', 'blob', 'url', 'data'],
  },
  ut = typeof window < 'u' && typeof document < 'u',
  et = (typeof navigator == 'object' && navigator) || void 0,
  ys = ut && (!et || ['ReactNative', 'NativeScript', 'NS'].indexOf(et.product) < 0),
  gs = (() =>
    typeof WorkerGlobalScope < 'u' &&
    self instanceof WorkerGlobalScope &&
    typeof self.importScripts == 'function')(),
  ws = (ut && window.location.href) || 'http://localhost',
  bs = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        hasBrowserEnv: ut,
        hasStandardBrowserEnv: ys,
        hasStandardBrowserWebWorkerEnv: gs,
        navigator: et,
        origin: ws,
      },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  ),
  N = { ...bs, ...ms };
function Es(e, t) {
  return Le(
    e,
    new N.classes.URLSearchParams(),
    Object.assign(
      {
        visitor: function (r, n, s, o) {
          return N.isNode && l.isBuffer(r)
            ? (this.append(n, r.toString('base64')), !1)
            : o.defaultVisitor.apply(this, arguments);
        },
      },
      t
    )
  );
}
function Ss(e) {
  return l.matchAll(/\w+|\[(\w*)]/g, e).map((t) => (t[0] === '[]' ? '' : t[1] || t[0]));
}
function _s(e) {
  const t = {},
    r = Object.keys(e);
  let n;
  const s = r.length;
  let o;
  for (n = 0; n < s; n++) (o = r[n]), (t[o] = e[o]);
  return t;
}
function ur(e) {
  function t(r, n, s, o) {
    let i = r[o++];
    if (i === '__proto__') return !0;
    const a = Number.isFinite(+i),
      f = o >= r.length;
    return (
      (i = !i && l.isArray(s) ? s.length : i),
      f
        ? (l.hasOwnProp(s, i) ? (s[i] = [s[i], n]) : (s[i] = n), !a)
        : ((!s[i] || !l.isObject(s[i])) && (s[i] = []),
          t(r, n, s[i], o) && l.isArray(s[i]) && (s[i] = _s(s[i])),
          !a)
    );
  }
  if (l.isFormData(e) && l.isFunction(e.entries)) {
    const r = {};
    return (
      l.forEachEntry(e, (n, s) => {
        t(Ss(n), s, r, 0);
      }),
      r
    );
  }
  return null;
}
function Rs(e, t, r) {
  if (l.isString(e))
    try {
      return (t || JSON.parse)(e), l.trim(e);
    } catch (n) {
      if (n.name !== 'SyntaxError') throw n;
    }
  return (r || JSON.stringify)(e);
}
const lt = {
  transitional: cr,
  adapter: ['xhr', 'http', 'fetch'],
  transformRequest: [
    function (t, r) {
      const n = r.getContentType() || '',
        s = n.indexOf('application/json') > -1,
        o = l.isObject(t);
      if ((o && l.isHTMLForm(t) && (t = new FormData(t)), l.isFormData(t)))
        return s ? JSON.stringify(ur(t)) : t;
      if (
        l.isArrayBuffer(t) ||
        l.isBuffer(t) ||
        l.isStream(t) ||
        l.isFile(t) ||
        l.isBlob(t) ||
        l.isReadableStream(t)
      )
        return t;
      if (l.isArrayBufferView(t)) return t.buffer;
      if (l.isURLSearchParams(t))
        return (
          r.setContentType('application/x-www-form-urlencoded;charset=utf-8', !1), t.toString()
        );
      let a;
      if (o) {
        if (n.indexOf('application/x-www-form-urlencoded') > -1)
          return Es(t, this.formSerializer).toString();
        if ((a = l.isFileList(t)) || n.indexOf('multipart/form-data') > -1) {
          const f = this.env && this.env.FormData;
          return Le(a ? { 'files[]': t } : t, f && new f(), this.formSerializer);
        }
      }
      return o || s ? (r.setContentType('application/json', !1), Rs(t)) : t;
    },
  ],
  transformResponse: [
    function (t) {
      const r = this.transitional || lt.transitional,
        n = r && r.forcedJSONParsing,
        s = this.responseType === 'json';
      if (l.isResponse(t) || l.isReadableStream(t)) return t;
      if (t && l.isString(t) && ((n && !this.responseType) || s)) {
        const i = !(r && r.silentJSONParsing) && s;
        try {
          return JSON.parse(t);
        } catch (a) {
          if (i)
            throw a.name === 'SyntaxError'
              ? w.from(a, w.ERR_BAD_RESPONSE, this, null, this.response)
              : a;
        }
      }
      return t;
    },
  ],
  timeout: 0,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  maxContentLength: -1,
  maxBodyLength: -1,
  env: { FormData: N.classes.FormData, Blob: N.classes.Blob },
  validateStatus: function (t) {
    return t >= 200 && t < 300;
  },
  headers: { common: { Accept: 'application/json, text/plain, */*', 'Content-Type': void 0 } },
};
l.forEach(['delete', 'get', 'head', 'post', 'put', 'patch'], (e) => {
  lt.headers[e] = {};
});
const ft = lt,
  Ts = l.toObjectSet([
    'age',
    'authorization',
    'content-length',
    'content-type',
    'etag',
    'expires',
    'from',
    'host',
    'if-modified-since',
    'if-unmodified-since',
    'last-modified',
    'location',
    'max-forwards',
    'proxy-authorization',
    'referer',
    'retry-after',
    'user-agent',
  ]),
  Os = (e) => {
    const t = {};
    let r, n, s;
    return (
      e &&
        e
          .split(
            `
`
          )
          .forEach(function (i) {
            (s = i.indexOf(':')),
              (r = i.substring(0, s).trim().toLowerCase()),
              (n = i.substring(s + 1).trim()),
              !(!r || (t[r] && Ts[r])) &&
                (r === 'set-cookie'
                  ? t[r]
                    ? t[r].push(n)
                    : (t[r] = [n])
                  : (t[r] = t[r] ? t[r] + ', ' + n : n));
          }),
      t
    );
  },
  Pt = Symbol('internals');
function re(e) {
  return e && String(e).trim().toLowerCase();
}
function fe(e) {
  return e === !1 || e == null ? e : l.isArray(e) ? e.map(fe) : String(e);
}
function As(e) {
  const t = Object.create(null),
    r = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let n;
  for (; (n = r.exec(e)); ) t[n[1]] = n[2];
  return t;
}
const ks = (e) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim());
function ze(e, t, r, n, s) {
  if (l.isFunction(n)) return n.call(this, t, r);
  if ((s && (t = r), !!l.isString(t))) {
    if (l.isString(n)) return t.indexOf(n) !== -1;
    if (l.isRegExp(n)) return n.test(t);
  }
}
function Cs(e) {
  return e
    .trim()
    .toLowerCase()
    .replace(/([a-z\d])(\w*)/g, (t, r, n) => r.toUpperCase() + n);
}
function Ps(e, t) {
  const r = l.toCamelCase(' ' + t);
  ['get', 'set', 'has'].forEach((n) => {
    Object.defineProperty(e, n + r, {
      value: function (s, o, i) {
        return this[n].call(this, t, s, o, i);
      },
      configurable: !0,
    });
  });
}
class $e {
  constructor(t) {
    t && this.set(t);
  }
  set(t, r, n) {
    const s = this;
    function o(a, f, c) {
      const u = re(f);
      if (!u) throw new Error('header name must be a non-empty string');
      const d = l.findKey(s, u);
      (!d || s[d] === void 0 || c === !0 || (c === void 0 && s[d] !== !1)) && (s[d || f] = fe(a));
    }
    const i = (a, f) => l.forEach(a, (c, u) => o(c, u, f));
    if (l.isPlainObject(t) || t instanceof this.constructor) i(t, r);
    else if (l.isString(t) && (t = t.trim()) && !ks(t)) i(Os(t), r);
    else if (l.isHeaders(t)) for (const [a, f] of t.entries()) o(f, a, n);
    else t != null && o(r, t, n);
    return this;
  }
  get(t, r) {
    if (((t = re(t)), t)) {
      const n = l.findKey(this, t);
      if (n) {
        const s = this[n];
        if (!r) return s;
        if (r === !0) return As(s);
        if (l.isFunction(r)) return r.call(this, s, n);
        if (l.isRegExp(r)) return r.exec(s);
        throw new TypeError('parser must be boolean|regexp|function');
      }
    }
  }
  has(t, r) {
    if (((t = re(t)), t)) {
      const n = l.findKey(this, t);
      return !!(n && this[n] !== void 0 && (!r || ze(this, this[n], n, r)));
    }
    return !1;
  }
  delete(t, r) {
    const n = this;
    let s = !1;
    function o(i) {
      if (((i = re(i)), i)) {
        const a = l.findKey(n, i);
        a && (!r || ze(n, n[a], a, r)) && (delete n[a], (s = !0));
      }
    }
    return l.isArray(t) ? t.forEach(o) : o(t), s;
  }
  clear(t) {
    const r = Object.keys(this);
    let n = r.length,
      s = !1;
    for (; n--; ) {
      const o = r[n];
      (!t || ze(this, this[o], o, t, !0)) && (delete this[o], (s = !0));
    }
    return s;
  }
  normalize(t) {
    const r = this,
      n = {};
    return (
      l.forEach(this, (s, o) => {
        const i = l.findKey(n, o);
        if (i) {
          (r[i] = fe(s)), delete r[o];
          return;
        }
        const a = t ? Cs(o) : String(o).trim();
        a !== o && delete r[o], (r[a] = fe(s)), (n[a] = !0);
      }),
      this
    );
  }
  concat(...t) {
    return this.constructor.concat(this, ...t);
  }
  toJSON(t) {
    const r = Object.create(null);
    return (
      l.forEach(this, (n, s) => {
        n != null && n !== !1 && (r[s] = t && l.isArray(n) ? n.join(', ') : n);
      }),
      r
    );
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([t, r]) => t + ': ' + r).join(`
`);
  }
  get [Symbol.toStringTag]() {
    return 'AxiosHeaders';
  }
  static from(t) {
    return t instanceof this ? t : new this(t);
  }
  static concat(t, ...r) {
    const n = new this(t);
    return r.forEach((s) => n.set(s)), n;
  }
  static accessor(t) {
    const n = (this[Pt] = this[Pt] = { accessors: {} }).accessors,
      s = this.prototype;
    function o(i) {
      const a = re(i);
      n[a] || (Ps(s, i), (n[a] = !0));
    }
    return l.isArray(t) ? t.forEach(o) : o(t), this;
  }
}
$e.accessor([
  'Content-Type',
  'Content-Length',
  'Accept',
  'Accept-Encoding',
  'User-Agent',
  'Authorization',
]);
l.reduceDescriptors($e.prototype, ({ value: e }, t) => {
  let r = t[0].toUpperCase() + t.slice(1);
  return {
    get: () => e,
    set(n) {
      this[r] = n;
    },
  };
});
l.freezeMethods($e);
const B = $e;
function He(e, t) {
  const r = this || ft,
    n = t || r,
    s = B.from(n.headers);
  let o = n.data;
  return (
    l.forEach(e, function (a) {
      o = a.call(r, o, s.normalize(), t ? t.status : void 0);
    }),
    s.normalize(),
    o
  );
}
function lr(e) {
  return !!(e && e.__CANCEL__);
}
function te(e, t, r) {
  w.call(this, e ?? 'canceled', w.ERR_CANCELED, t, r), (this.name = 'CanceledError');
}
l.inherits(te, w, { __CANCEL__: !0 });
function fr(e, t, r) {
  const n = r.config.validateStatus;
  !r.status || !n || n(r.status)
    ? e(r)
    : t(
        new w(
          'Request failed with status code ' + r.status,
          [w.ERR_BAD_REQUEST, w.ERR_BAD_RESPONSE][Math.floor(r.status / 100) - 4],
          r.config,
          r.request,
          r
        )
      );
}
function Ds(e) {
  const t = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return (t && t[1]) || '';
}
function xs(e, t) {
  e = e || 10;
  const r = new Array(e),
    n = new Array(e);
  let s = 0,
    o = 0,
    i;
  return (
    (t = t !== void 0 ? t : 1e3),
    function (f) {
      const c = Date.now(),
        u = n[o];
      i || (i = c), (r[s] = f), (n[s] = c);
      let d = o,
        m = 0;
      for (; d !== s; ) (m += r[d++]), (d = d % e);
      if (((s = (s + 1) % e), s === o && (o = (o + 1) % e), c - i < t)) return;
      const E = u && c - u;
      return E ? Math.round((m * 1e3) / E) : void 0;
    }
  );
}
function Ns(e, t) {
  let r = 0,
    n = 1e3 / t,
    s,
    o;
  const i = (c, u = Date.now()) => {
    (r = u), (s = null), o && (clearTimeout(o), (o = null)), e.apply(null, c);
  };
  return [
    (...c) => {
      const u = Date.now(),
        d = u - r;
      d >= n
        ? i(c, u)
        : ((s = c),
          o ||
            (o = setTimeout(() => {
              (o = null), i(s);
            }, n - d)));
    },
    () => s && i(s),
  ];
}
const _e = (e, t, r = 3) => {
    let n = 0;
    const s = xs(50, 250);
    return Ns((o) => {
      const i = o.loaded,
        a = o.lengthComputable ? o.total : void 0,
        f = i - n,
        c = s(f),
        u = i <= a;
      n = i;
      const d = {
        loaded: i,
        total: a,
        progress: a ? i / a : void 0,
        bytes: f,
        rate: c || void 0,
        estimated: c && a && u ? (a - i) / c : void 0,
        event: o,
        lengthComputable: a != null,
        [t ? 'download' : 'upload']: !0,
      };
      e(d);
    }, r);
  },
  Dt = (e, t) => {
    const r = e != null;
    return [(n) => t[0]({ lengthComputable: r, total: e, loaded: n }), t[1]];
  },
  xt =
    (e) =>
    (...t) =>
      l.asap(() => e(...t)),
  Ls = N.hasStandardBrowserEnv
    ? ((e, t) => (r) => (
        (r = new URL(r, N.origin)),
        e.protocol === r.protocol && e.host === r.host && (t || e.port === r.port)
      ))(new URL(N.origin), N.navigator && /(msie|trident)/i.test(N.navigator.userAgent))
    : () => !0,
  $s = N.hasStandardBrowserEnv
    ? {
        write(e, t, r, n, s, o) {
          const i = [e + '=' + encodeURIComponent(t)];
          l.isNumber(r) && i.push('expires=' + new Date(r).toGMTString()),
            l.isString(n) && i.push('path=' + n),
            l.isString(s) && i.push('domain=' + s),
            o === !0 && i.push('secure'),
            (document.cookie = i.join('; '));
        },
        read(e) {
          const t = document.cookie.match(new RegExp('(^|;\\s*)(' + e + ')=([^;]*)'));
          return t ? decodeURIComponent(t[3]) : null;
        },
        remove(e) {
          this.write(e, '', Date.now() - 864e5);
        },
      }
    : {
        write() {},
        read() {
          return null;
        },
        remove() {},
      };
function Us(e) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
}
function Fs(e, t) {
  return t ? e.replace(/\/?\/$/, '') + '/' + t.replace(/^\/+/, '') : e;
}
function dr(e, t) {
  return e && !Us(t) ? Fs(e, t) : t;
}
const Nt = (e) => (e instanceof B ? { ...e } : e);
function X(e, t) {
  t = t || {};
  const r = {};
  function n(c, u, d, m) {
    return l.isPlainObject(c) && l.isPlainObject(u)
      ? l.merge.call({ caseless: m }, c, u)
      : l.isPlainObject(u)
        ? l.merge({}, u)
        : l.isArray(u)
          ? u.slice()
          : u;
  }
  function s(c, u, d, m) {
    if (l.isUndefined(u)) {
      if (!l.isUndefined(c)) return n(void 0, c, d, m);
    } else return n(c, u, d, m);
  }
  function o(c, u) {
    if (!l.isUndefined(u)) return n(void 0, u);
  }
  function i(c, u) {
    if (l.isUndefined(u)) {
      if (!l.isUndefined(c)) return n(void 0, c);
    } else return n(void 0, u);
  }
  function a(c, u, d) {
    if (d in t) return n(c, u);
    if (d in e) return n(void 0, c);
  }
  const f = {
    url: o,
    method: o,
    data: o,
    baseURL: i,
    transformRequest: i,
    transformResponse: i,
    paramsSerializer: i,
    timeout: i,
    timeoutMessage: i,
    withCredentials: i,
    withXSRFToken: i,
    adapter: i,
    responseType: i,
    xsrfCookieName: i,
    xsrfHeaderName: i,
    onUploadProgress: i,
    onDownloadProgress: i,
    decompress: i,
    maxContentLength: i,
    maxBodyLength: i,
    beforeRedirect: i,
    transport: i,
    httpAgent: i,
    httpsAgent: i,
    cancelToken: i,
    socketPath: i,
    responseEncoding: i,
    validateStatus: a,
    headers: (c, u, d) => s(Nt(c), Nt(u), d, !0),
  };
  return (
    l.forEach(Object.keys(Object.assign({}, e, t)), function (u) {
      const d = f[u] || s,
        m = d(e[u], t[u], u);
      (l.isUndefined(m) && d !== a) || (r[u] = m);
    }),
    r
  );
}
const pr = (e) => {
    const t = X({}, e);
    let {
      data: r,
      withXSRFToken: n,
      xsrfHeaderName: s,
      xsrfCookieName: o,
      headers: i,
      auth: a,
    } = t;
    (t.headers = i = B.from(i)),
      (t.url = ar(dr(t.baseURL, t.url), e.params, e.paramsSerializer)),
      a &&
        i.set(
          'Authorization',
          'Basic ' +
            btoa(
              (a.username || '') +
                ':' +
                (a.password ? unescape(encodeURIComponent(a.password)) : '')
            )
        );
    let f;
    if (l.isFormData(r)) {
      if (N.hasStandardBrowserEnv || N.hasStandardBrowserWebWorkerEnv) i.setContentType(void 0);
      else if ((f = i.getContentType()) !== !1) {
        const [c, ...u] = f
          ? f
              .split(';')
              .map((d) => d.trim())
              .filter(Boolean)
          : [];
        i.setContentType([c || 'multipart/form-data', ...u].join('; '));
      }
    }
    if (
      N.hasStandardBrowserEnv &&
      (n && l.isFunction(n) && (n = n(t)), n || (n !== !1 && Ls(t.url)))
    ) {
      const c = s && o && $s.read(o);
      c && i.set(s, c);
    }
    return t;
  },
  js = typeof XMLHttpRequest < 'u',
  vs =
    js &&
    function (e) {
      return new Promise(function (r, n) {
        const s = pr(e);
        let o = s.data;
        const i = B.from(s.headers).normalize();
        let { responseType: a, onUploadProgress: f, onDownloadProgress: c } = s,
          u,
          d,
          m,
          E,
          h;
        function y() {
          E && E(),
            h && h(),
            s.cancelToken && s.cancelToken.unsubscribe(u),
            s.signal && s.signal.removeEventListener('abort', u);
        }
        let p = new XMLHttpRequest();
        p.open(s.method.toUpperCase(), s.url, !0), (p.timeout = s.timeout);
        function S() {
          if (!p) return;
          const g = B.from('getAllResponseHeaders' in p && p.getAllResponseHeaders()),
            O = {
              data: !a || a === 'text' || a === 'json' ? p.responseText : p.response,
              status: p.status,
              statusText: p.statusText,
              headers: g,
              config: e,
              request: p,
            };
          fr(
            function (P) {
              r(P), y();
            },
            function (P) {
              n(P), y();
            },
            O
          ),
            (p = null);
        }
        'onloadend' in p
          ? (p.onloadend = S)
          : (p.onreadystatechange = function () {
              !p ||
                p.readyState !== 4 ||
                (p.status === 0 && !(p.responseURL && p.responseURL.indexOf('file:') === 0)) ||
                setTimeout(S);
            }),
          (p.onabort = function () {
            p && (n(new w('Request aborted', w.ECONNABORTED, e, p)), (p = null));
          }),
          (p.onerror = function () {
            n(new w('Network Error', w.ERR_NETWORK, e, p)), (p = null);
          }),
          (p.ontimeout = function () {
            let _ = s.timeout ? 'timeout of ' + s.timeout + 'ms exceeded' : 'timeout exceeded';
            const O = s.transitional || cr;
            s.timeoutErrorMessage && (_ = s.timeoutErrorMessage),
              n(new w(_, O.clarifyTimeoutError ? w.ETIMEDOUT : w.ECONNABORTED, e, p)),
              (p = null);
          }),
          o === void 0 && i.setContentType(null),
          'setRequestHeader' in p &&
            l.forEach(i.toJSON(), function (_, O) {
              p.setRequestHeader(O, _);
            }),
          l.isUndefined(s.withCredentials) || (p.withCredentials = !!s.withCredentials),
          a && a !== 'json' && (p.responseType = s.responseType),
          c && (([m, h] = _e(c, !0)), p.addEventListener('progress', m)),
          f &&
            p.upload &&
            (([d, E] = _e(f)),
            p.upload.addEventListener('progress', d),
            p.upload.addEventListener('loadend', E)),
          (s.cancelToken || s.signal) &&
            ((u = (g) => {
              p && (n(!g || g.type ? new te(null, e, p) : g), p.abort(), (p = null));
            }),
            s.cancelToken && s.cancelToken.subscribe(u),
            s.signal && (s.signal.aborted ? u() : s.signal.addEventListener('abort', u)));
        const b = Ds(s.url);
        if (b && N.protocols.indexOf(b) === -1) {
          n(new w('Unsupported protocol ' + b + ':', w.ERR_BAD_REQUEST, e));
          return;
        }
        p.send(o || null);
      });
    },
  Bs = (e, t) => {
    const { length: r } = (e = e ? e.filter(Boolean) : []);
    if (t || r) {
      let n = new AbortController(),
        s;
      const o = function (c) {
        if (!s) {
          (s = !0), a();
          const u = c instanceof Error ? c : this.reason;
          n.abort(u instanceof w ? u : new te(u instanceof Error ? u.message : u));
        }
      };
      let i =
        t &&
        setTimeout(() => {
          (i = null), o(new w(`timeout ${t} of ms exceeded`, w.ETIMEDOUT));
        }, t);
      const a = () => {
        e &&
          (i && clearTimeout(i),
          (i = null),
          e.forEach((c) => {
            c.unsubscribe ? c.unsubscribe(o) : c.removeEventListener('abort', o);
          }),
          (e = null));
      };
      e.forEach((c) => c.addEventListener('abort', o));
      const { signal: f } = n;
      return (f.unsubscribe = () => l.asap(a)), f;
    }
  },
  Is = Bs,
  Ms = function* (e, t) {
    let r = e.byteLength;
    if (!t || r < t) {
      yield e;
      return;
    }
    let n = 0,
      s;
    for (; n < r; ) (s = n + t), yield e.slice(n, s), (n = s);
  },
  qs = async function* (e, t) {
    for await (const r of zs(e)) yield* Ms(r, t);
  },
  zs = async function* (e) {
    if (e[Symbol.asyncIterator]) {
      yield* e;
      return;
    }
    const t = e.getReader();
    try {
      for (;;) {
        const { done: r, value: n } = await t.read();
        if (r) break;
        yield n;
      }
    } finally {
      await t.cancel();
    }
  },
  Lt = (e, t, r, n) => {
    const s = qs(e, t);
    let o = 0,
      i,
      a = (f) => {
        i || ((i = !0), n && n(f));
      };
    return new ReadableStream(
      {
        async pull(f) {
          try {
            const { done: c, value: u } = await s.next();
            if (c) {
              a(), f.close();
              return;
            }
            let d = u.byteLength;
            if (r) {
              let m = (o += d);
              r(m);
            }
            f.enqueue(new Uint8Array(u));
          } catch (c) {
            throw (a(c), c);
          }
        },
        cancel(f) {
          return a(f), s.return();
        },
      },
      { highWaterMark: 2 }
    );
  },
  Ue = typeof fetch == 'function' && typeof Request == 'function' && typeof Response == 'function',
  hr = Ue && typeof ReadableStream == 'function',
  Hs =
    Ue &&
    (typeof TextEncoder == 'function'
      ? (
          (e) => (t) =>
            e.encode(t)
        )(new TextEncoder())
      : async (e) => new Uint8Array(await new Response(e).arrayBuffer())),
  mr = (e, ...t) => {
    try {
      return !!e(...t);
    } catch {
      return !1;
    }
  },
  Ws =
    hr &&
    mr(() => {
      let e = !1;
      const t = new Request(N.origin, {
        body: new ReadableStream(),
        method: 'POST',
        get duplex() {
          return (e = !0), 'half';
        },
      }).headers.has('Content-Type');
      return e && !t;
    }),
  $t = 64 * 1024,
  tt = hr && mr(() => l.isReadableStream(new Response('').body)),
  Re = { stream: tt && ((e) => e.body) };
Ue &&
  ((e) => {
    ['text', 'arrayBuffer', 'blob', 'formData', 'stream'].forEach((t) => {
      !Re[t] &&
        (Re[t] = l.isFunction(e[t])
          ? (r) => r[t]()
          : (r, n) => {
              throw new w(`Response type '${t}' is not supported`, w.ERR_NOT_SUPPORT, n);
            });
    });
  })(new Response());
const Ks = async (e) => {
    if (e == null) return 0;
    if (l.isBlob(e)) return e.size;
    if (l.isSpecCompliantForm(e))
      return (await new Request(N.origin, { method: 'POST', body: e }).arrayBuffer()).byteLength;
    if (l.isArrayBufferView(e) || l.isArrayBuffer(e)) return e.byteLength;
    if ((l.isURLSearchParams(e) && (e = e + ''), l.isString(e))) return (await Hs(e)).byteLength;
  },
  Js = async (e, t) => {
    const r = l.toFiniteNumber(e.getContentLength());
    return r ?? Ks(t);
  },
  Vs =
    Ue &&
    (async (e) => {
      let {
        url: t,
        method: r,
        data: n,
        signal: s,
        cancelToken: o,
        timeout: i,
        onDownloadProgress: a,
        onUploadProgress: f,
        responseType: c,
        headers: u,
        withCredentials: d = 'same-origin',
        fetchOptions: m,
      } = pr(e);
      c = c ? (c + '').toLowerCase() : 'text';
      let E = Is([s, o && o.toAbortSignal()], i),
        h;
      const y =
        E &&
        E.unsubscribe &&
        (() => {
          E.unsubscribe();
        });
      let p;
      try {
        if (f && Ws && r !== 'get' && r !== 'head' && (p = await Js(u, n)) !== 0) {
          let O = new Request(t, { method: 'POST', body: n, duplex: 'half' }),
            k;
          if (
            (l.isFormData(n) && (k = O.headers.get('content-type')) && u.setContentType(k), O.body)
          ) {
            const [P, A] = Dt(p, _e(xt(f)));
            n = Lt(O.body, $t, P, A);
          }
        }
        l.isString(d) || (d = d ? 'include' : 'omit');
        const S = 'credentials' in Request.prototype;
        h = new Request(t, {
          ...m,
          signal: E,
          method: r.toUpperCase(),
          headers: u.normalize().toJSON(),
          body: n,
          duplex: 'half',
          credentials: S ? d : void 0,
        });
        let b = await fetch(h);
        const g = tt && (c === 'stream' || c === 'response');
        if (tt && (a || (g && y))) {
          const O = {};
          ['status', 'statusText', 'headers'].forEach((j) => {
            O[j] = b[j];
          });
          const k = l.toFiniteNumber(b.headers.get('content-length')),
            [P, A] = (a && Dt(k, _e(xt(a), !0))) || [];
          b = new Response(
            Lt(b.body, $t, P, () => {
              A && A(), y && y();
            }),
            O
          );
        }
        c = c || 'text';
        let _ = await Re[l.findKey(Re, c) || 'text'](b, e);
        return (
          !g && y && y(),
          await new Promise((O, k) => {
            fr(O, k, {
              data: _,
              headers: B.from(b.headers),
              status: b.status,
              statusText: b.statusText,
              config: e,
              request: h,
            });
          })
        );
      } catch (S) {
        throw (
          (y && y(),
          S && S.name === 'TypeError' && /fetch/i.test(S.message)
            ? Object.assign(new w('Network Error', w.ERR_NETWORK, e, h), { cause: S.cause || S })
            : w.from(S, S && S.code, e, h))
        );
      }
    }),
  rt = { http: as, xhr: vs, fetch: Vs };
l.forEach(rt, (e, t) => {
  if (e) {
    try {
      Object.defineProperty(e, 'name', { value: t });
    } catch {}
    Object.defineProperty(e, 'adapterName', { value: t });
  }
});
const Ut = (e) => `- ${e}`,
  Gs = (e) => l.isFunction(e) || e === null || e === !1,
  yr = {
    getAdapter: (e) => {
      e = l.isArray(e) ? e : [e];
      const { length: t } = e;
      let r, n;
      const s = {};
      for (let o = 0; o < t; o++) {
        r = e[o];
        let i;
        if (((n = r), !Gs(r) && ((n = rt[(i = String(r)).toLowerCase()]), n === void 0)))
          throw new w(`Unknown adapter '${i}'`);
        if (n) break;
        s[i || '#' + o] = n;
      }
      if (!n) {
        const o = Object.entries(s).map(
          ([a, f]) =>
            `adapter ${a} ` +
            (f === !1 ? 'is not supported by the environment' : 'is not available in the build')
        );
        let i = t
          ? o.length > 1
            ? `since :
` +
              o.map(Ut).join(`
`)
            : ' ' + Ut(o[0])
          : 'as no adapter specified';
        throw new w('There is no suitable adapter to dispatch the request ' + i, 'ERR_NOT_SUPPORT');
      }
      return n;
    },
    adapters: rt,
  };
function We(e) {
  if ((e.cancelToken && e.cancelToken.throwIfRequested(), e.signal && e.signal.aborted))
    throw new te(null, e);
}
function Ft(e) {
  return (
    We(e),
    (e.headers = B.from(e.headers)),
    (e.data = He.call(e, e.transformRequest)),
    ['post', 'put', 'patch'].indexOf(e.method) !== -1 &&
      e.headers.setContentType('application/x-www-form-urlencoded', !1),
    yr
      .getAdapter(e.adapter || ft.adapter)(e)
      .then(
        function (n) {
          return (
            We(e), (n.data = He.call(e, e.transformResponse, n)), (n.headers = B.from(n.headers)), n
          );
        },
        function (n) {
          return (
            lr(n) ||
              (We(e),
              n &&
                n.response &&
                ((n.response.data = He.call(e, e.transformResponse, n.response)),
                (n.response.headers = B.from(n.response.headers)))),
            Promise.reject(n)
          );
        }
      )
  );
}
const gr = '1.7.9',
  Fe = {};
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach((e, t) => {
  Fe[e] = function (n) {
    return typeof n === e || 'a' + (t < 1 ? 'n ' : ' ') + e;
  };
});
const jt = {};
Fe.transitional = function (t, r, n) {
  function s(o, i) {
    return '[Axios v' + gr + "] Transitional option '" + o + "'" + i + (n ? '. ' + n : '');
  }
  return (o, i, a) => {
    if (t === !1) throw new w(s(i, ' has been removed' + (r ? ' in ' + r : '')), w.ERR_DEPRECATED);
    return (
      r &&
        !jt[i] &&
        ((jt[i] = !0),
        console.warn(
          s(i, ' has been deprecated since v' + r + ' and will be removed in the near future')
        )),
      t ? t(o, i, a) : !0
    );
  };
};
Fe.spelling = function (t) {
  return (r, n) => (console.warn(`${n} is likely a misspelling of ${t}`), !0);
};
function Xs(e, t, r) {
  if (typeof e != 'object') throw new w('options must be an object', w.ERR_BAD_OPTION_VALUE);
  const n = Object.keys(e);
  let s = n.length;
  for (; s-- > 0; ) {
    const o = n[s],
      i = t[o];
    if (i) {
      const a = e[o],
        f = a === void 0 || i(a, o, e);
      if (f !== !0) throw new w('option ' + o + ' must be ' + f, w.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (r !== !0) throw new w('Unknown option ' + o, w.ERR_BAD_OPTION);
  }
}
const de = { assertOptions: Xs, validators: Fe },
  M = de.validators;
class Te {
  constructor(t) {
    (this.defaults = t), (this.interceptors = { request: new Ct(), response: new Ct() });
  }
  async request(t, r) {
    try {
      return await this._request(t, r);
    } catch (n) {
      if (n instanceof Error) {
        let s = {};
        Error.captureStackTrace ? Error.captureStackTrace(s) : (s = new Error());
        const o = s.stack ? s.stack.replace(/^.+\n/, '') : '';
        try {
          n.stack
            ? o &&
              !String(n.stack).endsWith(o.replace(/^.+\n.+\n/, '')) &&
              (n.stack +=
                `
` + o)
            : (n.stack = o);
        } catch {}
      }
      throw n;
    }
  }
  _request(t, r) {
    typeof t == 'string' ? ((r = r || {}), (r.url = t)) : (r = t || {}), (r = X(this.defaults, r));
    const { transitional: n, paramsSerializer: s, headers: o } = r;
    n !== void 0 &&
      de.assertOptions(
        n,
        {
          silentJSONParsing: M.transitional(M.boolean),
          forcedJSONParsing: M.transitional(M.boolean),
          clarifyTimeoutError: M.transitional(M.boolean),
        },
        !1
      ),
      s != null &&
        (l.isFunction(s)
          ? (r.paramsSerializer = { serialize: s })
          : de.assertOptions(s, { encode: M.function, serialize: M.function }, !0)),
      de.assertOptions(
        r,
        { baseUrl: M.spelling('baseURL'), withXsrfToken: M.spelling('withXSRFToken') },
        !0
      ),
      (r.method = (r.method || this.defaults.method || 'get').toLowerCase());
    let i = o && l.merge(o.common, o[r.method]);
    o &&
      l.forEach(['delete', 'get', 'head', 'post', 'put', 'patch', 'common'], (h) => {
        delete o[h];
      }),
      (r.headers = B.concat(i, o));
    const a = [];
    let f = !0;
    this.interceptors.request.forEach(function (y) {
      (typeof y.runWhen == 'function' && y.runWhen(r) === !1) ||
        ((f = f && y.synchronous), a.unshift(y.fulfilled, y.rejected));
    });
    const c = [];
    this.interceptors.response.forEach(function (y) {
      c.push(y.fulfilled, y.rejected);
    });
    let u,
      d = 0,
      m;
    if (!f) {
      const h = [Ft.bind(this), void 0];
      for (h.unshift.apply(h, a), h.push.apply(h, c), m = h.length, u = Promise.resolve(r); d < m; )
        u = u.then(h[d++], h[d++]);
      return u;
    }
    m = a.length;
    let E = r;
    for (d = 0; d < m; ) {
      const h = a[d++],
        y = a[d++];
      try {
        E = h(E);
      } catch (p) {
        y.call(this, p);
        break;
      }
    }
    try {
      u = Ft.call(this, E);
    } catch (h) {
      return Promise.reject(h);
    }
    for (d = 0, m = c.length; d < m; ) u = u.then(c[d++], c[d++]);
    return u;
  }
  getUri(t) {
    t = X(this.defaults, t);
    const r = dr(t.baseURL, t.url);
    return ar(r, t.params, t.paramsSerializer);
  }
}
l.forEach(['delete', 'get', 'head', 'options'], function (t) {
  Te.prototype[t] = function (r, n) {
    return this.request(X(n || {}, { method: t, url: r, data: (n || {}).data }));
  };
});
l.forEach(['post', 'put', 'patch'], function (t) {
  function r(n) {
    return function (o, i, a) {
      return this.request(
        X(a || {}, {
          method: t,
          headers: n ? { 'Content-Type': 'multipart/form-data' } : {},
          url: o,
          data: i,
        })
      );
    };
  }
  (Te.prototype[t] = r()), (Te.prototype[t + 'Form'] = r(!0));
});
const pe = Te;
class dt {
  constructor(t) {
    if (typeof t != 'function') throw new TypeError('executor must be a function.');
    let r;
    this.promise = new Promise(function (o) {
      r = o;
    });
    const n = this;
    this.promise.then((s) => {
      if (!n._listeners) return;
      let o = n._listeners.length;
      for (; o-- > 0; ) n._listeners[o](s);
      n._listeners = null;
    }),
      (this.promise.then = (s) => {
        let o;
        const i = new Promise((a) => {
          n.subscribe(a), (o = a);
        }).then(s);
        return (
          (i.cancel = function () {
            n.unsubscribe(o);
          }),
          i
        );
      }),
      t(function (o, i, a) {
        n.reason || ((n.reason = new te(o, i, a)), r(n.reason));
      });
  }
  throwIfRequested() {
    if (this.reason) throw this.reason;
  }
  subscribe(t) {
    if (this.reason) {
      t(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(t) : (this._listeners = [t]);
  }
  unsubscribe(t) {
    if (!this._listeners) return;
    const r = this._listeners.indexOf(t);
    r !== -1 && this._listeners.splice(r, 1);
  }
  toAbortSignal() {
    const t = new AbortController(),
      r = (n) => {
        t.abort(n);
      };
    return this.subscribe(r), (t.signal.unsubscribe = () => this.unsubscribe(r)), t.signal;
  }
  static source() {
    let t;
    return {
      token: new dt(function (s) {
        t = s;
      }),
      cancel: t,
    };
  }
}
const Qs = dt;
function Ys(e) {
  return function (r) {
    return e.apply(null, r);
  };
}
function Zs(e) {
  return l.isObject(e) && e.isAxiosError === !0;
}
const nt = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
};
Object.entries(nt).forEach(([e, t]) => {
  nt[t] = e;
});
const eo = nt;
function wr(e) {
  const t = new pe(e),
    r = Gt(pe.prototype.request, t);
  return (
    l.extend(r, pe.prototype, t, { allOwnKeys: !0 }),
    l.extend(r, t, null, { allOwnKeys: !0 }),
    (r.create = function (s) {
      return wr(X(e, s));
    }),
    r
  );
}
const C = wr(ft);
C.Axios = pe;
C.CanceledError = te;
C.CancelToken = Qs;
C.isCancel = lr;
C.VERSION = gr;
C.toFormData = Le;
C.AxiosError = w;
C.Cancel = C.CanceledError;
C.all = function (t) {
  return Promise.all(t);
};
C.spread = Ys;
C.isAxiosError = Zs;
C.mergeConfig = X;
C.AxiosHeaders = B;
C.formToJSON = (e) => ur(l.isHTMLForm(e) ? new FormData(e) : e);
C.getAdapter = yr.getAdapter;
C.HttpStatusCode = eo;
C.default = C;
const br = C;
window.appLogs ||
  (window.appLogs = {
    logs: [],
    enabled: !0,
    maxLogs: 1e3,
    categories: { modal: !0, auth: !0, api: !0, general: !0, error: !0 },
  });
const to = {}.VITE_DEBUG === 'true';
to && ((window.debugMode = !0), console.log('Debug mode enabled via environment variable'));
const H = (e, t, r = {}, n = !1) => {
    const s = { time: new Date().toISOString(), category: e, message: t, data: r };
    if (
      (window.appLogs.enabled &&
        (window.appLogs.categories[e] || n) &&
        (window.appLogs.logs.push(s),
        window.appLogs.logs.length > window.appLogs.maxLogs &&
          (window.appLogs.logs = window.appLogs.logs.slice(-window.appLogs.maxLogs))),
      n || window.debugMode)
    ) {
      const o = no(e);
      console.log(`%c[${e.toUpperCase()}] ${t}`, o, r);
    }
  },
  ro = (e, t, r = 'error') => {
    const n = {
      message: t == null ? void 0 : t.message,
      stack: t == null ? void 0 : t.stack,
      name: t == null ? void 0 : t.name,
    };
    H(r, e, n, !0);
  },
  no = (e) => {
    switch (e) {
      case 'modal':
        return 'color: purple; font-weight: bold';
      case 'auth':
        return 'color: blue; font-weight: bold';
      case 'api':
        return 'color: green; font-weight: bold';
      case 'error':
        return 'color: red; font-weight: bold; background: #ffeeee';
      default:
        return 'color: gray; font-weight: bold';
    }
  },
  so = (e) => ({
    log: (t, r) => H(e, t, r),
    error: (t, r) => ro(t, r, e),
    warn: (t, r) => H(e, `⚠️ ${t}`, r),
    info: (t, r) => H(e, `ℹ️ ${t}`, r),
    success: (t, r) => H(e, `✅ ${t}`, r),
  }),
  Er = () => {
    (window.debugMode = !0), H('general', 'Debug mode enabled', {}, !0);
  },
  L = so('api');
window.appLog = H;
window.enableDebugMode = Er;
window.location.search.includes('debug=true') &&
  (Er(), H('general', 'Debug mode enabled via URL parameter', {}, !0));
const R = (e, t = {}) => {
    L.log(e, t),
      window.apiDebug || (window.apiDebug = { operations: [], errors: [], baseUrl: null }),
      window.apiDebug.operations.push({ time: new Date().toISOString(), operation: e, ...t });
  },
  oo = () => {
    R('getBaseUrl-started');
    try {
      const e = 'http://localhost:8000';
      if (e) return R('getBaseUrl-env', { url: e }), e;
      const t = window.location.hostname,
        r = window.location.protocol,
        n = window.location.port,
        s = window.location.origin;
      if (
        (R('getBaseUrl-environment', { hostname: t, protocol: r, port: n, origin: s }),
        t.includes('render.com'))
      ) {
        const o = 'https://harmonic-universe-api.onrender.com';
        return R('getBaseUrl-render', { url: o }), (window.apiDebug.baseUrl = o), o;
      }
      if (!t.includes('localhost') && !t.includes('127.0.0.1')) {
        const o = t.replace('app.', 'api.').replace('www.', 'api.'),
          i = t.replace('www.', '').split('.');
        i[0] = `${i[0]}-api`;
        const a = i.join('.');
        R('getBaseUrl-production-options', {
          option1: o,
          option2: a,
          option3: 'harmonic-universe-api.onrender.com',
        });
        const c = `https://${o}`;
        return R('getBaseUrl-production', { url: c }), (window.apiDebug.baseUrl = c), c;
      }
      return R('getBaseUrl-local'), (window.apiDebug.baseUrl = ''), '';
    } catch (e) {
      return (
        console.error('Error in getBaseUrl:', e),
        R('getBaseUrl-error', { message: e.message, stack: e.stack }),
        window.apiDebug &&
          window.apiDebug.errors.push({
            time: new Date().toISOString(),
            operation: 'getBaseUrl',
            error: e.message,
            stack: e.stack,
          }),
        ''
      );
    }
  },
  Z = oo();
L.info('API base URL determined', { baseURL: Z });
const W = br.create({
  baseURL: Z,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Origin: window.location.origin,
  },
  withCredentials: !0,
  timeout: 15e3,
});
L.log('API client initialized', {
  baseURL: Z,
  withCredentials: !0,
  origin: window.location.origin,
});
W.interceptors.request.use(
  (e) => {
    R('request', {
      method: e.method,
      url: e.url,
      baseUrl: e.baseURL,
      fullUrl: e.baseURL + e.url,
      headers: e.headers,
    });
    const t = localStorage.getItem('accessToken');
    return t && ((e.headers.Authorization = `Bearer ${t}`), L.log('Added token to request')), e;
  },
  (e) => (L.error('Request error', e), Promise.reject(e))
);
W.interceptors.response.use(
  (e) => (
    R('response-success', {
      status: e.status,
      url: e.config.url,
      data: typeof e.data == 'object' ? Object.keys(e.data) : typeof e.data,
    }),
    e
  ),
  async (e) => {
    var r, n, s, o, i, a;
    R('response-error', {
      message: e.message,
      status: (r = e.response) == null ? void 0 : r.status,
      url: (n = e.config) == null ? void 0 : n.url,
      data: (s = e.response) == null ? void 0 : s.data,
    }),
      window.apiDebug &&
        window.apiDebug.errors.push({
          time: new Date().toISOString(),
          url: (o = e.config) == null ? void 0 : o.url,
          status: (i = e.response) == null ? void 0 : i.status,
          message: e.message,
        });
    const t = e.config;
    if (((a = e.response) == null ? void 0 : a.status) === 401 && !t._retry) {
      (t._retry = !0), R('token-refresh-attempt');
      try {
        const f = localStorage.getItem('refreshToken');
        if (f) {
          R('token-refresh-request');
          try {
            let c = null;
            const u = [
              '/api/auth/refresh',
              '/api/v1/auth/refresh',
              `${Z}/api/auth/refresh`,
              `${Z}/api/v1/auth/refresh`,
            ];
            for (const d of u)
              try {
                if (
                  (R('token-refresh-endpoint', { endpoint: d }),
                  (c = await br.post(d, { refresh_token: f })),
                  c.status === 200)
                ) {
                  R('token-refresh-success', { endpoint: d });
                  break;
                }
              } catch (m) {
                R('token-refresh-endpoint-error', { endpoint: d, error: m.message });
              }
            if (!c || c.status !== 200) throw new Error('All refresh token endpoints failed');
            if (c.data.access_token)
              return (
                localStorage.setItem('accessToken', c.data.access_token),
                R('access-token-updated'),
                (W.defaults.headers.common.Authorization = `Bearer ${c.data.access_token}`),
                (t.headers.Authorization = `Bearer ${c.data.access_token}`),
                R('request-retry'),
                W(t)
              );
            throw (
              (R('token-refresh-invalid-response'), new Error('Invalid refresh token response'))
            );
          } catch (c) {
            throw (R('token-refresh-failed', { error: c.message }), c);
          }
        } else throw (R('token-refresh-no-token'), new Error('No refresh token available'));
      } catch (f) {
        R('auth-error-logout', { error: f.message }),
          localStorage.removeItem('accessToken'),
          localStorage.removeItem('refreshToken'),
          !window.location.pathname.includes('login') &&
            !window.location.search.includes('modal=login') &&
            (window.location.href = '/?modal=login');
      }
    }
    return Promise.reject(e);
  }
);
const io = async (e, t = 'GET', r = null) => {
    L.log('fetchWithCredentials started', { url: e, method: t });
    try {
      const s = e.startsWith('http') ? e : `${Z}${e}`;
      L.log('Using URL', { fullUrl: s });
      const o = {
        method: t,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: window.location.origin,
        },
        credentials: 'include',
        mode: 'cors',
      };
      r &&
        ((o.body = JSON.stringify(r)),
        R('fetchWithCredentials-data', { dataKeys: Object.keys(r) }));
      const i = localStorage.getItem('accessToken');
      i && ((o.headers.Authorization = `Bearer ${i}`), R('fetchWithCredentials-token-added')),
        L.log('Fetch request details', { url: s, method: t, headers: o.headers, mode: o.mode });
      const a = await fetch(s, o);
      if (
        (L.log('Fetch response received', { status: a.status, ok: a.ok, statusText: a.statusText }),
        !a.ok)
      ) {
        let c = '';
        try {
          (c = await a.text()), L.error('Fetch error response', { text: c, status: a.status });
        } catch (u) {
          L.error('Failed to parse error response', { error: u.message });
        }
        throw new Error(`Request failed: ${a.status} ${a.statusText}. ${c}`);
      }
      const f = await a.json();
      return L.success('Fetch successful', { dataKeys: Object.keys(f) }), f;
    } catch (n) {
      throw (
        (L.error('Fetch failed', { url: e, method: t, message: n.message }),
        window.apiDebug &&
          window.apiDebug.errors.push({
            time: new Date().toISOString(),
            operation: `fetchWithCredentials-${t}`,
            url: e,
            error: n.message,
            stack: n.stack,
          }),
        n)
      );
    }
  },
  Sr = {
    get: async (e, t = {}) => {
      try {
        R('get-started', { url: e });
        const r = await W.get(e, t);
        return R('get-success', { url: e }), r;
      } catch (r) {
        throw (R('get-error', { url: e, message: r.message }), r);
      }
    },
    post: async (e, t = {}, r = {}) => {
      try {
        R('post-started', { url: e });
        const n = await W.post(e, t, r);
        return R('post-success', { url: e }), n;
      } catch (n) {
        throw (R('post-error', { url: e, message: n.message }), n);
      }
    },
    fetchWithCredentials: io,
    put: async (e, t = {}, r = {}) => {
      try {
        R('put-started', { url: e });
        const n = await W.put(e, t, r);
        return R('put-success', { url: e }), n;
      } catch (n) {
        throw (R('put-error', { url: e, message: n.message }), n);
      }
    },
    delete: async (e, t = {}) => {
      try {
        R('delete-started', { url: e });
        const r = await W.delete(e, t);
        return R('delete-success', { url: e }), r;
      } catch (r) {
        throw (R('delete-error', { url: e, message: r.message }), r);
      }
    },
  },
  T = 'http://localhost:8000',
  Q = `${T}/v1`,
  ao = {
    login: `${T}/auth/login`,
    register: `${T}/auth/signup`,
    demoLogin: `${T}/auth/demo-login`,
    refresh: `${T}/auth/refresh`,
    logout: `${T}/auth/logout`,
    me: `${T}/auth/me`,
    resetPassword: `${T}/auth/reset-password`,
    forgotPassword: `${T}/auth/forgot-password`,
    verifyEmail: `${T}/auth/verify-email`,
  },
  co = {
    login: `${Q}/auth/login`,
    register: `${Q}/auth/signup`,
    demoLogin: `${Q}/auth/demo-login`,
    refresh: `${Q}/auth/refresh`,
    logout: `${Q}/auth/logout`,
    me: `${Q}/auth/me`,
  },
  uo = {
    profile: `${T}/users/profile`,
    update: `${T}/users/update`,
    changePassword: `${T}/users/change-password`,
    delete: `${T}/users/delete`,
  },
  lo = {
    list: `${T}/universes`,
    create: `${T}/universes`,
    get: (e) => `${T}/universes/${e}`,
    update: (e) => `${T}/universes/${e}`,
    delete: (e) => `${T}/universes/${e}`,
    physics: (e) => `${T}/universes/${e}/physics`,
    audio: (e) => `${T}/universes/${e}/audio`,
    visualization: (e) => `${T}/universes/${e}/visualization`,
  },
  fo = {
    list: (e) => `${T}/universes/${e}/objects`,
    create: (e) => `${T}/universes/${e}/objects`,
    get: (e, t) => `${T}/universes/${e}/objects/${t}`,
    update: (e, t) => `${T}/universes/${e}/objects/${t}`,
    delete: (e, t) => `${T}/universes/${e}/objects/${t}`,
  },
  po = {
    list: (e) => `${T}/universes/${e}/audio-tracks`,
    create: (e) => `${T}/universes/${e}/audio-tracks`,
    get: (e, t) => `${T}/universes/${e}/audio-tracks/${t}`,
    update: (e, t) => `${T}/universes/${e}/audio-tracks/${t}`,
    delete: (e, t) => `${T}/universes/${e}/audio-tracks/${t}`,
  },
  ho = { health: `${T}/health`, version: `${T}/version` },
  _r = {
    auth: ao,
    authV1: co,
    users: uo,
    universes: lo,
    physicsObjects: fo,
    audioTracks: po,
    system: ho,
  },
  x = (e, t = {}) => {
    try {
      console.log(`Auth operation: ${e}`, t), window.debugLog && window.debugLog('AUTH', e, t);
    } catch (r) {
      console.error('Error logging auth operation', r);
    }
  },
  pt = (e, t) => {
    try {
      console.error(`Auth error in ${e}:`, t),
        window.debugError && window.debugError('AUTH', `Error in ${e}`, t);
    } catch (r) {
      console.error('Error logging auth error', r);
    }
  },
  he = Pe('auth/login', async (e, { rejectWithValue: t }) => {
    var r, n;
    try {
      x('Login attempt', { email: e.email });
      const s = await Sr.post(_r.auth.login, e);
      return x('Login successful', { status: s.status }), Tr(s.data), s.data.user;
    } catch (s) {
      return (
        pt('Login', s),
        t(
          ((n = (r = s.response) == null ? void 0 : r.data) == null ? void 0 : n.message) ||
            'Failed to login'
        )
      );
    }
  }),
  me = Pe('auth/register', async (e, { rejectWithValue: t }) => {
    var r, n;
    try {
      x('Register attempt', { email: e.email });
      const s = await Sr.post(_r.auth.register, e);
      return x('Register successful', { status: s.status }), Tr(s.data), s.data.user;
    } catch (s) {
      return (
        pt('Register', s),
        t(
          ((n = (r = s.response) == null ? void 0 : r.data) == null ? void 0 : n.message) ||
            'Failed to register'
        )
      );
    }
  }),
  ye = Pe('auth/demoLogin', async (e, { rejectWithValue: t }) => {
    try {
      return (
        await new Promise((r) => setTimeout(r, 500)),
        {
          user: { id: 'demo-user', name: 'Demo User', email: 'demo@example.com', role: 'user' },
          token: 'mock-jwt-token',
        }
      );
    } catch (r) {
      return t(r.message || 'Failed to login');
    }
  }),
  Rr = Pe('auth/logout', async (e, { rejectWithValue: t }) => {
    try {
      return (
        x('Logout attempt'),
        localStorage.removeItem('token'),
        localStorage.removeItem('refreshToken'),
        sessionStorage.removeItem('demoLoginResponse'),
        x('Logout successful'),
        null
      );
    } catch (r) {
      return (
        pt('Logout', r),
        localStorage.removeItem('token'),
        localStorage.removeItem('refreshToken'),
        t('Failed to logout')
      );
    }
  }),
  Tr = (e) => {
    x('handle-auth-tokens', {
      dataKeys: Object.keys(e),
      hasToken: !!e.token,
      hasAccessToken: !!e.access_token,
    }),
      e.token &&
        (localStorage.setItem('accessToken', e.token), x('token-stored', { source: 'token' })),
      e.access_token &&
        (localStorage.setItem('accessToken', e.access_token),
        x('token-stored', { source: 'access_token' })),
      e.refresh_token &&
        (localStorage.setItem('refreshToken', e.refresh_token), x('refresh-token-stored')),
      window.authDebug &&
        (window.authDebug.tokens = {
          hasAccessToken: !!localStorage.getItem('accessToken'),
          hasRefreshToken: !!localStorage.getItem('refreshToken'),
        });
  },
  Or = yn({
    name: 'auth',
    initialState: { user: null, token: null, status: 'idle', error: null },
    reducers: {
      logoutUser: (e) => {
        (e.user = null), (e.token = null);
      },
    },
    extraReducers: (e) => {
      e.addCase(he.pending, (t) => {
        (t.loading = !0), (t.error = null), x('login-pending');
      })
        .addCase(he.fulfilled, (t, r) => {
          var n;
          (t.loading = !1),
            (t.user = r.payload),
            (t.token = r.payload.token),
            x('login-fulfilled', { userId: (n = r.payload) == null ? void 0 : n.id });
        })
        .addCase(he.rejected, (t, r) => {
          var n;
          (t.loading = !1),
            (t.error = ((n = r.payload) == null ? void 0 : n.message) || 'Login failed'),
            x('login-rejected', { error: t.error });
        })
        .addCase(me.pending, (t) => {
          (t.loading = !0), (t.error = null), x('register-pending');
        })
        .addCase(me.fulfilled, (t, r) => {
          var n;
          (t.loading = !1),
            (t.user = r.payload),
            (t.token = r.payload.token),
            x('register-fulfilled', { userId: (n = r.payload) == null ? void 0 : n.id });
        })
        .addCase(me.rejected, (t, r) => {
          var n;
          (t.loading = !1),
            (t.error = ((n = r.payload) == null ? void 0 : n.message) || 'Registration failed'),
            x('register-rejected', { error: t.error });
        })
        .addCase(ye.pending, (t) => {
          t.status = 'loading';
        })
        .addCase(ye.fulfilled, (t, r) => {
          (t.status = 'succeeded'),
            (t.user = r.payload.user),
            (t.token = r.payload.token),
            (t.error = null);
        })
        .addCase(ye.rejected, (t, r) => {
          (t.status = 'failed'), (t.error = r.payload);
        })
        .addCase(Rr.fulfilled, (t) => {
          (t.user = null), (t.token = null), x('logout-fulfilled');
        });
    },
  }),
  { logoutUser: mo } = Or.actions,
  yo = Or.reducer,
  bo = Object.freeze(
    Object.defineProperty(
      {
        __proto__: null,
        default: yo,
        demoLogin: ye,
        login: he,
        logout: Rr,
        logoutUser: mo,
        register: me,
      },
      Symbol.toStringTag,
      { value: 'Module' }
    )
  );
export { yo as a, bo as b, wo as c };
//# sourceMappingURL=authSlice-8ef2e6bf.js.map
