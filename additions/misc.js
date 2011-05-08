/**
 * additions/misc
 */
(function(lib) {
  lib.Hash = function(p) { this.empty() };
  lib.Hash.prototype = {
    h: null,
    get: function(k) { return this.h[k] },
    set: function(k, v) { this.h[k] = v },
    empty: function() { this.h = {} },
    exists: function(k) { return this.h.hasOwnProperty(k) },
    keys: function(proto) {
      var keys = [];
      proto = !proto;
      for(var i in this.h) {
        if(proto && Object.prototype[i]) { continue }
        keys.push(i)
      }
      return keys
    },
    remove: function(k) {
      var r = this.get(k);
      delete this.h[k];
      return r
    },
    toArray: function() {
      var a = new Array, _ = this;
      this.keys().forEach(function(k) { a.push(_.get(k)) });
      return a
    },
    toString: function() { return JSON.stringify(this.h) }
  };
})(rdf);
