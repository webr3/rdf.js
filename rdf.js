/**
 * ECMAScript-262 V5 Implementation of the Core RDF Interfaces
 * 
 *  - <http://www.w3.org/2010/02/rdfa/sources/rdf-interfaces/>
 *  - <http://github.org/webr3/rdf-interfaces/>
 *  
 * This is free and unencumbered software released into the public domain.
 * For more information, please refer to <http://unlicense.org/>
 */
rdf = (function() {
  var rdf = {};
  rdf.encodeString = function(s) {
    var out = "", skip = false, _g1 = 0, _g = s.length;
    while(_g1 < _g) {
      var i = _g1++;
      if(!skip) {
        var code = s.charCodeAt(i);
        if(55296 <= code && code <= 56319) {
          var low = s.charCodeAt(i + 1);
          code = (code - 55296) * 1024 + (low - 56320) + 65536;
          skip = true
        }
        if(code > 1114111) { throw new Error("Char out of range"); }
        var hex = "00000000".concat((new Number(code)).toString(16).toUpperCase());
        if(code >= 65536) {
          out += "\\U" + hex.slice(-8)
        } else {
          if(code >= 127 || code <= 31) {
            switch(code) {
              case 9:  out += "\\t"; break;
              case 10: out += "\\n"; break;
              case 13: out += "\\r"; break;
              default: out += "\\u" + hex.slice(-4); break
            }
          } else {
            switch(code) {
              case 34: out += '\\"'; break;
              case 92: out += "\\\\"; break;
              default: out += s.charAt(i); break
            }
          }
        }
      } else {
        skip = !skip
      }
    }
    return out
  };
  
  rdf.BlankNode = function() {
    return Object.defineProperties( {}, {
      interfaceName: { writable: false, configurable : false, enumerable: true, value: 'BlankNode' },
      nominalValue: { writable: false, configurable : false, enumerable: true, value: 'b'.concat(++rdf.BlankNode.NEXTID) },
      valueOf: { writable: false, configurable : false, enumerable: true, value: function() {
        return this.nominalValue;
      }},
      equals: { writable: true, configurable : false, enumerable: true, value: function(o) {
        if(!o.hasOwnProperty('interfaceName')) return this.nominalValue == o;
        return (o.interfaceName == this.interfaceName) ? this.nominalValue == o.nominalValue : false;
      }},
      toString: { writable: false, configurable : false, enumerable: true, value: function() {
        return '_:'.concat(this.nominalValue);
      }},
      toNT: { writable: false, configurable : false, enumerable: true, value: function() {
        return rdf.encodeString(this.toString());
      }},
      h: { configurable : false, enumerable: false, get: function(){return this.nominalValue} },
    })
  };
  rdf.BlankNode.NEXTID = 0;
  
  rdf.NamedNode = function(iri) {
    return Object.defineProperties( {}, {
      interfaceName: { writable: false, configurable : false, enumerable: true, value: 'NamedNode' },
      nominalValue: { writable: false, configurable : false, enumerable: true, value: iri },
      valueOf: { writable: false, configurable : false, enumerable: true, value: function() {
        return this.nominalValue;
      }},
      equals: { writable: true, configurable : false, enumerable: true, value: function(o) {
        if(!o.hasOwnProperty('interfaceName')) return this.nominalValue == o;
        return (o.interfaceName == this.interfaceName) ? this.nominalValue == o.nominalValue : false;
      }},
      toString: { writable: false, configurable : false, enumerable: true, value: function() {
        return this.nominalValue.toString();
      }},
      toNT: { writable: false, configurable : false, enumerable: true, value: function() {
        return '<' + rdf.encodeString(this.toString()) + '>';
      }},
      h: { configurable : false, enumerable: false, get: function(){return this.nominalValue} }
    })
  };
  
  rdf.Literal = function(value, language, datatype, nativ) {
    if(typeof language == "string" && language[0] == "@") language = language.slice(1);
    return Object.defineProperties( {}, {
      interfaceName: { writable: false, configurable : false, enumerable: true, value: 'Literal' },
      nominalValue: { writable: false, configurable : false, enumerable: true, value: value },
      valueOf: { writable: false, configurable : false, enumerable: true, value: function() {
        return nativ === null ? this.nominalValue : nativ;
      }},
      language: { writable: false, configurable : false, enumerable: true, value: language },
      datatype: { writable: false, configurable : false, enumerable: true, value: datatype },
      equals: { writable: true, configurable : false, enumerable: true, value: function(o) {
        if(!o.hasOwnProperty('interfaceName')) return this.valueOf() == o;
        if(o.interfaceName != this.interfaceName) return false;
        return this.h == o.h;
      }},
      toString: { writable: false, configurable : false, enumerable: true, value: function() {
        return this.nominalValue.toString();
      }},
      toNT: { writable: false, configurable : false, enumerable: true, value: function() {
        var s = '"' + rdf.encodeString(this.nominalValue) + '"';
        if( Boolean(this.language).valueOf() ) return s.concat('@' + this.language);
        if( Boolean(this.datatype).valueOf() ) return s.concat('^^' + this.datatype.toNT());
        return s;
      }},
      h: { writable: false, configurable : false, enumerable: false, value: language + '|' + (datatype ? datatype.toString() : '') + '|' + value.toString() }
    })
  };
  
  rdf.Triple = function(s,p,o) {
    return Object.defineProperties( {}, {
      subject: { writable: false, configurable : false, enumerable: true, value: s },
      property: { writable: false, configurable : false, enumerable: true, value: p },
      object: { writable: false, configurable : false, enumerable: true, value: o },
      equals: { writable: true, configurable : false, enumerable: true, value: function(t) {
        return this.s.equals(t.s) && this.p.equals(t.p) && this.o.equals(t.o);
      }},
      toString: { writable: false, configurable : false, enumerable: true, value: function() {
        return this.s.toNT() + " " + this.p.toNT() + " " + this.o.toNT() + " .";
      }},
      s: { configurable : false, enumerable: false, get: function() { return this.subject } },
      p: { configurable : false, enumerable: false, get: function() { return this.property } },
      o: { configurable : false, enumerable: false, get: function() { return this.object } }
    })
  };
  
  rdf.Graph = function(a) {
    return Object.defineProperties( {}, {
      _graph: { writable: true, configurable : false, enumerable: false, value: [] },
      _spo: { writable: true, configurable : false, enumerable: false, value: {} },
      length: { configurable : false, enumerable: true, get: function() {
        return this._graph.length;
      }},
      add: { writable: false, configurable : false, enumerable: true, value: function(t) {
        this._spo[t.s.h] || (this._spo[t.s.h] = {});
        this._spo[t.s.h][t.p.h] || (this._spo[t.s.h][t.p.h] = {});
        if(!this._spo[t.s.h][t.p.h][t.o.h]) {
          this._spo[t.s.h][t.p.h][t.o.h] = t;
          this._graph.push(t);
          this.actions.forEach(function(a){a.run(t)});
        }
        return this;
      }},
      addArray: { writable: false, configurable : false, enumerable: false, value: function(a) {
        if(Array.isArray(a)) var g = this, b = a.forEach( function(t) { g.add(t) });
        return this;
      }},
      remove: { writable: false, configurable : false, enumerable: true, value: function(t) {
        this._spo[t.s.h] && this._spo[t.s.h][t.p.h] && this._spo[t.s.h][t.p.h][t.o.h] && (
          delete this._spo[t.s.h][t.p.h][t.o.h] &&
          this._graph.splice(this._graph.indexOf(t),1)  
        );
        return this;
      }},
      removeMatches: { writable: false, configurable : false, enumerable: true, value: function(s,p,o) {
        s = arguments[0] === undefined ? null : s;
        p = arguments[1] === undefined ? null : p;
        o = arguments[2] === undefined ? null : o;
        var r = [];
        this.forEach(function(t,g) {
          (s===null||t.s.equals(s)) && (p===null||t.p.equals(p)) && (o===null||t.o.equals(o)) && r.push(t);
        });
        for(i in r) this.remove(r[i]);
        return this;
      }},
      toArray: { writable: false, configurable : false, enumerable: true, value: function() {
        return this._graph.slice(0);
      }},
      some: { writable: false, configurable : false, enumerable: true, value: function(cb) {
        return this._graph.some(cb);
      }},
      every: { writable: false, configurable : false, enumerable: true, value: function(cb) {
        return this._graph.every(cb);
      }},
      filter: { writable: false, configurable : false, enumerable: true, value: function(cb) {
        return new rdf.Graph(this._graph.filter(cb));
      }},
      forEach: { writable: false, configurable : false, enumerable: true, value: function(cb) {
        var g = this; this._graph.forEach(function(t) { cb(t,g) });
      }},
      match: { writable: false, configurable : false, enumerable: true, value: function(s,p,o,l) {
        s = arguments[0] === undefined ? null : s;
        p = arguments[1] === undefined ? null : p;
        o = arguments[2] === undefined ? null : o;
        l = arguments[3] === undefined ? null : l;
        var c = 0;
        if(l<1) l=-1;
        return new rdf.Graph(this._graph.filter(function(t) {
          if(c == l) return false;
          return (s===null||t.s.equals(s)) && (p===null||t.p.equals(p)) && (o===null||t.o.equals(o)) && ++c;
        }));
      }},
      merge: { writable: false, configurable : false, enumerable: true, value: function(g) {
        return new rdf.Graph().addAll(this).addAll(g);
      }},
      addAll: { writable: false, configurable : false, enumerable: true, value: function(g) {
        return this.addArray(g.toArray());
      }},
      actions: { writable: false, configurable : false, enumerable: true, value: [] },
      addAction: { writable: false, configurable : false, enumerable: true, value: function(a,r) {
        if(r) this.forEach(function(t,g){a.run(t,g)});
        this.actions.push(a);
        return this;
      }}
    }).addArray(a);
  };
  
  rdf.TripleAction = function(test,action) {
    return Object.defineProperties( {}, {
      action: { writable: true, configurable : false, enumerable: true, value: action },
      test: { writable: true, configurable : false, enumerable: true, value: test },
      run: { writable: false, configurable : false, enumerable: true, value: function(t,g) {
        if(this.test(t)) this.action(t,g);
      }}    
    })
  };
  
  rdf.PrefixMap = function(i) {
    return Object.defineProperties( {} , {
      resolve: { writable: false, configurable : false, enumerable: true, value: function(curie) {
        var index = curie.indexOf(":");
        if(index < 0 || curie.indexOf("//") >= 0)  return null;
        var prefix = curie.slice(0, index).toLowerCase();
        if(!this[prefix]) return null;
        return this[prefix].concat( curie.slice(++index) );
      }},
      shrink: { writable: false, configurable : false, enumerable: true, value: function(iri) {
        for(pref in this)
          if(iri.substr(0,this[pref].length) == this[pref])
            return pref + ':' + iri.slice(this[pref].length);
        return iri;
      }},
      setDefault: { writable: false, configurable : false, enumerable: true, value: function(iri) {
        this[''] = iri;
      }},
      addAll: { writable: false, configurable : false, enumerable: true, value: function(prefixes, override) {
        for(p in prefixes)
          if(!this[p] || override)
            this[p] = prefixes[p];
        return this;
      }}
    }).addAll(i);
  };
  
  rdf.TermMap = function(i) {
    return Object.defineProperties( {} , {
      resolve: { writable: false, configurable : false, enumerable: true, value: function(term) {
        if(this[term]) return this[term]
        if(this[""]) return this[""].concat(term)
        return null;
      }},
      shrink: { writable: false, configurable : false, enumerable: true, value: function(iri) {
        for(t in this)
          if(this[t] == iri) return t;
        return iri;
      }},
      setDefault: { writable: false, configurable : false, enumerable: true, value: function(iri) {
        this[''] = iri;
      }},
      addAll: { writable: false, configurable : false, enumerable: true, value: function(terms, override) {
        for(t in terms)
          if(!this[t] || override)
            this[t] = terms[t];
        return this;
      }}
    }).addAll(i);
  }
  
  rdf.Profile = function(i) {
    return Object.defineProperties( {} , {
      prefixes: { writable: false, configurable : false, enumerable: true, value: new rdf.PrefixMap },
      terms: { writable: false, configurable : false, enumerable: true, value: new rdf.TermMap },
      resolve: { writable: false, configurable : false, enumerable: true, value: function(tp) {
        return tp.indexOf(":") >= 0 ? this.prefixes.resolve(tp) : this.terms.resolve(tp);
      }},
      setDefaultVocabulary: { writable: false, configurable : false, enumerable: true, value: function(iri) {
        this.terms.setDefault(iri);
      }},
      setDefaultPrefix: { writable: false, configurable : false, enumerable: true, value: function(iri) {
        this.prefixes.setDefault(iri);
      }},
      setTerm: { writable: false, configurable : false, enumerable: true, value: function(term, iri) {
        this.terms[term] = iri;
      }},
      setPrefix: { writable: false, configurable : false, enumerable: true, value: function(prefix, iri) {
        this.prefixes[prefix] = iri;
      }},
      importProfile: { writable: false, configurable : false, enumerable: true, value: function(profile, override) {
        if(!profile) return this;
        this.prefixes.addAll(profile.prefixes, override);
        this.terms.addAll(profile.terms, override);
        return this;
      }}
    }).importProfile(i);
  };
  
  rdf.RDFEnvironment = function() {
    var rp = {terms:{},prefixes:{
      owl: "http://www.w3.org/2002/07/owl#",
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      rdfs: "http://www.w3.org/2000/01/rdf-schema#",
      rdfa: "http://www.w3.org/ns/rdfa#",
      xhv: "http://www.w3.org/1999/xhtml/vocab#",
      xml: "http://www.w3.org/XML/1998/namespace",
      xsd: "http://www.w3.org/2001/XMLSchema#",
    }};
    var xsd = {};
    for(v in x=['string','boolean','dateTime','date','time','int','double','float','decimal','integer',
              'nonPositiveInteger','negativeInteger','long','int','short','byte','nonNegativeInteger',
              'unsignedLong','unsignedInt','unsignedShort','unsignedByte','positiveInteger'])
      xsd[x[v]] = rp.prefixes.xsd.concat(x[v]);
    return Object.defineProperties( new rdf.Profile(rp), {
      createBlankNode: { writable: false, configurable : false, enumerable: true, value: function() {
        return new rdf.BlankNode;
      }},
      createNamedNode: { writable: false, configurable : false, enumerable: true, value: function(iri) {
        return new rdf.NamedNode(iri);
      }},
      createLiteral: { writable: false, configurable : false, enumerable: true, value: function(value) {
        var l = null, dt = arguments[2], v = value;
        if(arguments[1]) {
          if(arguments[1].hasOwnProperty('interfaceName')) dt = arguments[1];
          else l = arguments[1];
        }
        if(dt) {
          switch(dt.valueOf()) {
            case xsd.string:
              v = new String(v); break;
            case xsd['boolean']:
              v = (new Boolean(v == "false" ? false : v)).valueOf(); break;
            case xsd['float']:
            case xsd.integer:
            case xsd['long']:
            case xsd['double']:
            case xsd.decimal:
            case xsd.nonPositiveInteger:
            case xsd.nonNegativeInteger:
            case xsd.negativeInteger:
            case xsd['int']:
            case xsd.unsignedLong:
            case xsd.positiveInteger:
            case xsd['short']:
            case xsd.unsignedInt:
            case xsd['byte']:
            case xsd.unsignedShort:
            case xsd.unsignedByte:
              v = (new Number(v)).valueOf(); break;
            case xsd['date']:
            case xsd.time:
            case xsd.dateTime:
              v = new Date(v); break;
          }
        }
        return new rdf.Literal(value,l,dt,v);
      }},
      createTriple: { writable: false, configurable : false, enumerable: true, value: function(s,p,o) {
        return new rdf.Triple(s,p,o);
      }},
      createGraph: { writable: false, configurable : false, enumerable: true, value: function(a) {
        return new rdf.Graph(a);
      }},
      createAction: { writable: false, configurable : false, enumerable: true, value: function(t,a) {
        return new rdf.TripleAction(t,a);
      }},
      createProfile: { writable: false, configurable : false, enumerable: true, value: function(empty) {
        return new rdf.Profile(!empty ? this : null);
      }},
      createTermMap: { writable: false, configurable : false, enumerable: true, value: function(empty) {
        return new rdf.TermMap(!empty ? this.terms : null);
      }},
      createPrefixMap: { writable: false, configurable : false, enumerable: true, value: function(empty) {
        return new rdf.PrefixMap(!empty ? this.prefixes : null);
      }},
    });
  };
  var _ = new rdf.RDFEnvironment;
  Object.keys(rdf).forEach(function(k) {
    _[k] = rdf[k];
  });
  return rdf = _;
})();

if(typeof module !== 'undefined' && module) module.exports = rdf; 

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
/**
 * additions/iri
 */
(function(lib) {

  lib.IRI = function(iri) {
    
    var SCHEME_MATCH = new RegExp("^[a-z0-9-.+]+:", "i");
    
    return Object.defineProperties( {}, {
      value: { writable: false, configurable : false, enumerable: false, value: iri },
      toString: { writable: false, configurable: false, enumerable: true, value: function() { return this.value } },
      defrag: { writable: false, configurable : false, enumerable: true, value: function() {
        var i = this.value.indexOf("#");
        return (i < 0) ? this : new lib.IRI(this.value.slice(0, i))
      }},
      isAbsolute: { writable: false, configurable : false, enumerable: true, value: function() {
        return this.scheme() != null && this.heirpart() != null && this.fragment() == null
      }},
      toAbsolute: { writable: false, configurable : false, enumerable: true, value: function() {
        if(this.scheme() == null && this.heirpart() == null) throw new Error("IRI must have a scheme and a heirpart!");
        return this.resolveReference(this.value).defrag()
      }},
      authority: { writable: false, configurable : false, enumerable: true, value: function() {
        var heirpart = this.heirpart();
        if(heirpart.substring(0, 2) != "//") return null
        var authority = heirpart.slice(2);
        var q = authority.indexOf("/");
        return q >= 0 ? authority.substring(0, q) : authority
      }},
      fragment: { writable: false, configurable : false, enumerable: true, value: function() {
        var i = this.value.indexOf("#");
        return (i < 0) ? null : this.value.slice(i)
      }},
      heirpart: { writable: false, configurable : false, enumerable: true, value: function() {
        var heirpart = this.value;
        var q = heirpart.indexOf("?");
        if(q >= 0) {
          heirpart = heirpart.substring(0, q)
        } else {
          q = heirpart.indexOf("#");
          if(q >= 0) { heirpart = heirpart.substring(0, q) }
        }
        var q2 = this.scheme();
        if(q2 != null) { heirpart = heirpart.slice(1 + q2.length) }
        return heirpart
      }},
      host: { writable: false, configurable : false, enumerable: true, value: function() {
        var host = this.authority();
        var q = host.indexOf("@");
        if(q >= 0) { host = host.slice(++q) }
        if(host.indexOf("[") == 0) {
          q = host.indexOf("]");
          if(q > 0) {  return host.substring(0, q) }
        }
        q = host.lastIndexOf(":");
        return q >= 0 ? host.substring(0, q) : host
      }},
      path: { writable: false, configurable : false, enumerable: true, value: function() {
        var q = this.authority();
        if(q == null) return this.heirpart()
        return this.heirpart().slice(q.length + 2)
      }},
      port: { writable: true, configurable : false, enumerable: true, value: function() {
        var host = this.authority();
        var q = host.indexOf("@");
        if(q >= 0) host = host.slice(++q)
        if(host.indexOf("[") == 0) {
          q = host.indexOf("]");
          if(q > 0) return host.substring(0, q)
        }
        q = host.lastIndexOf(":");
        if(q < 0) return null
        host = host.slice(++q);
        return host.length == 0 ? null : host
      }},
      query: { writable: false, configurable : false, enumerable: true, value: function() {
        var q = this.value.indexOf("?");
        if(q < 0) return null
        var f = this.value.indexOf("#");
        if(f < 0) return this.value.slice(q)
        return this.value.substring(q, f)
      }},
      removeDotSegments: { writable: false, configurable : false, enumerable: true, value: function(input) {
        var output = "";
        var q = 0;
        while(input.length > 0) {
          if(input.substr(0, 3) == "../" || input.substr(0, 2) == "./") {
            input = input.slice(input.indexOf("/"))
          }else {
            if(input == "/.") {
              input = "/"
            }else {
              if(input.substr(0, 3) == "/./") {
                input = input.slice(2)
              }else {
                if(input.substr(0, 4) == "/../" || input == "/..") {
                  (input == "/..") ? input = "/" : input = input.slice(3);
                  q = output.lastIndexOf("/");
                  (q >= 0) ? output = output.substring(0, q) : output = "";
                }else {
                  if(input.substr(0, 2) == ".." || input.substr(0, 1) == ".") {
                    input = input.slice(input.indexOf("."));
                    q = input.indexOf(".");
                    if(q >= 0) { input = input.slice(q) }
                  }else {
                    if(input.substr(0, 1) == "/") {
                      output += "/";
                      input = input.slice(1)
                    }
                    q = input.indexOf("/");
                    if(q < 0) {
                      output += input;
                      input = ""
                    }else {
                      output += input.substring(0, q);
                      input = input.slice(q)
                    }
                  }
                }
              }
            }
          }
        }
        return output
      }},
      resolveReference: { writable: false, configurable : false, enumerable: true, value: function(ref) {
        var reference = new lib.IRI(ref.toString()),
            T = {scheme:"", authority:"", path:"", query:"", fragment:""},
            q = "";
        if(reference.scheme() != null) {
          T.scheme = reference.scheme();
          q = reference.authority();
          T.authority += q != null ? "//" + q : "";
          T.path = this.removeDotSegments(reference.path());
          q = reference.query();
          T.query += q != null ? q : ""
        }else {
          q = reference.authority();
          if(q != null) {
            T.authority = q != null ? "//" + q : "";
            T.path = this.removeDotSegments(reference.path());
            q = reference.query();
            T.query += q != null ? q : ""
          }else {
            q = reference.path();
            if(q == "" || q == null) {
              T.path = this.path();
              q = reference.query();
              if(q != null) {
                T.query += q
              }else {
                q = this.query();
                T.query += q != null ? q : ""
              }
            }else {
              if(q.substring(0, 1) == "/") {
                T.path = this.removeDotSegments(q)
              }else {
                if(this.path() != null) {
                  var q2 = this.path().lastIndexOf("/");
                  if(q2 >= 0) {
                    T.path = this.path().substring(0, ++q2)
                  }
                  T.path += reference.path()
                }else {
                  T.path = "/" + q
                }
                T.path = this.removeDotSegments(T.path)
              }
              q = reference.query();
              T.query += q != null ? q : ""
            }
            q = this.authority();
            T.authority = q != null ? "//" + q : ""
          }
          T.scheme = this.scheme()
        }
        q = reference.fragment();
        T.fragment = q != null ? q : "";
        return new lib.IRI(T.scheme + ":" + T.authority + T.path + T.query + T.fragment)
      }},
      scheme: { writable: false, configurable : false, enumerable: true, value: function() {
        var scheme = this.value.match(SCHEME_MATCH);
        return (scheme == null) ? null : scheme.shift().slice(0, -1)
      }},
      userinfo: { writable: false, configurable : false, enumerable: true, value: function() {
        var authority = this.authority();
        var q = authority.indexOf("@");
        return (q < 0) ? null : authority.substring(0, q)
      }}
    })
  };
  
  lib.createIRI = function(i) {
    return new lib.IRI(i);
  };
})(rdf);
/**
 * additions/parsers
 */
(function(api) {
  if(!api.parsers) { api.parsers = {} }
  api.parsers.u8 = new RegExp("\\\\U([A-F0-9]{8})", "g");
  api.parsers.u4 = new RegExp("\\\\u([A-F0-9]{4})", "g");
  api.parsers.hexToChar = function(hex) {
    var result = "";
    var n = parseInt(hex, 16);
    if(n <= 65535) {
      result += String.fromCharCode(n)
    } else if(n <= 1114111) {
      n -= 65536;
      result += String.fromCharCode(55296 + (n >> 10), 56320 + (n & 1023))
    } else { throw new Error("code point isn't known: " + n); }
    return result
  };
  api.parsers.decodeString = function(str) {
    str = str.replace(api.parsers.u8, function(matchstr, parens) { return api.parsers.hexToChar(parens) });
    str = str.replace(api.parsers.u4, function(matchstr, parens) { return api.parsers.hexToChar(parens) });
    str = str.replace(new RegExp("\\\\t", "g"), "\t");
    str = str.replace(new RegExp("\\\\n", "g"), "\n");
    str = str.replace(new RegExp("\\\\r", "g"), "\r");
    str = str.replace(new RegExp('\\\\"', "g"), '"');
    str = str.replace(new RegExp("\\\\\\\\", "g"), "\\");
    return str
  };
  /**
   * NTriples implements DataParser
   * doc param of parse() and process() must be a string
   */
  api.parsers.NTriples = function(context) {
    this.context = context;
    this.bnHash = new api.Hash
  };
  api.parsers.NTriples.isComment = new RegExp("^[ \t]*#", "");
  api.parsers.NTriples.isEmptyLine = new RegExp("^[ \t]*$", "");
  api.parsers.NTriples.initialWhitespace = new RegExp("^[ \t]+", "");
  api.parsers.NTriples.trailingWhitespace = new RegExp("[. \t]+$", "");
  api.parsers.NTriples.whitespace = new RegExp("[ \t]+", "");
  api.parsers.NTriples.objectMatcher = new RegExp("^([^ \t]+)[ \t]+([^ \t]+)[ \t]+(.*)$", "");
  api.parsers.NTriples.trailingLanguage = new RegExp("@([a-z]+[-a-z0-9]+)$", "");
  api.parsers.NTriples.typedLiteralMatcher = new RegExp('^"(.*)"(.{2})<([^>]+)>$', "");
  api.parsers.NTriples.eolMatcher = new RegExp("\r\n|\n|\r", "g");
  api.parsers.NTriples.prototype = {
    context: null, quick: null, bnHash: null, graph: null, filter: null, processor: null, base: null,
    parse: function(toparse, cb, base, filter, graph) {
      this.graph = graph == null ? this.context.createGraph() : graph;
      this.filter = filter;
      this.quick = false;
      this.base = base;
      this.internalParse(toparse);
      if(cb != null) cb(this.graph);      
      return true;
    },
    process: function(toparse, processor, base, filter) {
      this.processor = processor;
      this.filter = filter;
      this.quick = true;
      this.base = base;
      return this.internalParse(toparse)
    },
    getBlankNode: function(id) {
      if(this.bnHash.exists(id)) { return this.bnHash.get(id) }
      var bn = this.context.createBlankNode();
      this.bnHash.set(id, bn);
      return bn
    },
    internalParse: function(toparse) {
      var data = new String(toparse);
      var lines = data.split(api.parsers.NTriples.eolMatcher);
      var _ = this;
      lines.forEach(function(a, b, c) { _.readLine(a, b, c) });
      return true
    },
    negotiateLiteral: function(plain) {
      if(plain.slice(-1) == '"') { return this.context.createLiteral(api.parsers.decodeString(plain.slice(1, -1))) }
      var lang = plain.match(api.parsers.NTriples.trailingLanguage);
      if(lang != null) { return this.context.createLiteral(api.parsers.decodeString(plain.slice(1, -1 - lang.shift().length)), lang.pop()) }
      var parts = plain.match(api.parsers.NTriples.typedLiteralMatcher);
      return this.context.createLiteral(api.parsers.decodeString(parts[1]), api.createNamedNode(parts.pop()))
    },   
    readLine: function(line, index, array) {
      if(api.parsers.NTriples.isComment.test(line) || api.parsers.NTriples.isEmptyLine.test(line)) { return }
      line = line.replace(api.parsers.NTriples.initialWhitespace, "").replace(api.parsers.NTriples.trailingWhitespace, "");
      var spo = line.split(api.parsers.NTriples.whitespace, 2);
      spo.push(line.replace(api.parsers.NTriples.objectMatcher, "$3"));
      var s;
      if(spo[0].charAt(0) == "<") {
        s = this.context.createNamedNode(api.parsers.decodeString(spo[0].slice(1, -1)))
      }else {
        s = this.getBlankNode(spo[0].slice(2))
      }
      spo.shift();
      var p = this.context.createNamedNode(spo.shift().slice(1, -1));
      var o;
      switch(spo[0].charAt(0)) {
        case "<":
          o = this.context.createNamedNode(api.parsers.decodeString(spo[0].slice(1, -1)));
          break;
        case "_":
          o = this.getBlankNode(spo[0].slice(2));
          break;
        default:
          o = this.negotiateLiteral(spo[0]);
          break
      }
      var triple = this.context.createTriple(s, p, o);
      var $use = true;
      if(this.filter != null) { $use = this.filter(triple, null, null) }
      if(!$use) { return; }
      this.quick ? this.processor(triple) : this.graph.add(triple);
    }
  };
  /**
   * Turtle implements DataParser
   * doc param of parse() and process() must be a string
   */
  api.parsers.Turtle = function(context) {
    this.context = context;
    this.bnHash = new api.Hash
  };
  api.parsers.Turtle.isWhitespace = new RegExp("^[ \t\r\n#]+", "");
  api.parsers.Turtle.initialWhitespace = new RegExp("^[ \t\r\n]+", "");
  api.parsers.Turtle.initialComment = new RegExp("^#[^\r\n]*", "");
  api.parsers.Turtle.simpleToken = new RegExp("^[^ \t\r\n]+", "");
  api.parsers.Turtle.simpleObjectToken = new RegExp("^[^ \t\r\n;,]+", "");
  api.parsers.Turtle.tokenInteger = new RegExp("^(-|\\+)?[0-9]+$", "");
  api.parsers.Turtle.tokenDouble = new RegExp("^(-|\\+)?(([0-9]+\\.[0-9]*[eE]{1}(-|\\+)?[0-9]+)|(\\.[0-9]+[eE]{1}(-|\\+)?[0-9]+)|([0-9]+[eE]{1}(-|\\+)?[0-9]+))$", "");
  api.parsers.Turtle.tokenDecimal = new RegExp("^(-|\\+)?[0-9]*\\.[0-9]+?$", "");  
  api.parsers.Turtle.prototype = {
    bnHash: null, context: null, filter: null, processor: null, quick: null, graph: null, base: null,
    parse: function(doc, cb, base, filter, graph) {
      this.graph = graph == null ? this.context.createGraph() : graph;
      this.filter = filter;
      this.quick = false;
      this.base = base;
      this.parseStatements(new String(doc));
      if(cb != null) cb(this.graph);      
      return true;
    },
    process: function(doc, processor, base, filter) {
      this.processor = processor; this.filter = filter; this.quick = true; this.base = base;
      return this.parseStatements(new String(doc))
    },
    t: function() { return{o:null} },
    parseStatements: function(s) {
      s = s.toString();
      while(s.length > 0) {
        s = this.skipWS(s);
        if(s.length == 0) return true;
        s.charAt(0) == "@" ? s = this.consumeDirective(s) : s = this.consumeStatement(s);
        this.expect(s, ".");
        s = this.skipWS(s.slice(1))
      }
      return true
    },
    add: function(t) {
      var $use = true;
      if(this.filter != null && !this.filter(t) ) return;
      this.quick ? this.processor(t) : this.graph.add(t);
    },
    consumeBlankNode: function(s, t) {
      t.o = this.context.createBlankNode();
      s = this.skipWS(s.slice(1));
      if(s.charAt(0) == "]") { return s.slice(1) }
      s = this.skipWS(this.consumePredicateObjectList(s, t));
      this.expect(s, "]");
      return this.skipWS(s.slice(1))
    },
    consumeCollection: function(s, subject) {
      subject.o = this.context.createBlankNode();
      var listject = this.t();
      listject.o = subject.o;
      s = this.skipWS(s.slice(1));
      var cont = s.charAt(0) != ")";
      if(!cont) subject.o = this.context.createNamedNode(this.context.resolve("rdf:nil"))
      while(cont) {
        var o = this.t();
        switch(s.charAt(0)) {
          case "[": s = this.consumeBlankNode(s, o); break;
          case "_": s = this.consumeKnownBlankNode(s, o); break;
          case "(": s = this.consumeCollection(s, o); break;
          case "<": s = this.consumeURI(s, o); break;
          case '"': s = this.consumeLiteral(s, o); break;
          default:
            var token = s.match(api.parsers.Turtle.simpleObjectToken).shift();
            if(token.charAt(token.length - 1) == ")") { token = token.substring(0, token.length - 1) }
            if(token == "false" || token == "true") {
              o.o = this.context.createLiteral(token, this.context.createNamedNode(this.context.resolve("xsd:boolean")))
            } else if(token.indexOf(":") > -1) {
              o.o = this.context.resolve(token)
            } else if(api.parsers.Turtle.tokenInteger.test(token)) {
              o.o = this.context.createLiteral(token, this.context.createNamedNode(this.context.resolve("xsd:integer")))
            } else if(api.parsers.Turtle.tokenDouble.test(token)) {
              o.o = this.context.createLiteral(token, this.context.createNamedNode(this.context.resolve("xsd:double")))
            } else if(api.parsers.Turtle.tokenDecimal.test(token)) {
              o.o = this.context.createLiteral(token, this.context.createNamedNode(this.context.resolve("xsd:decimal")))
            } else {
              throw new Error("unrecognised token: " + token);
            }
            s = s.slice(token.length);
            break
        }
        this.add(this.context.createTriple(listject.o, this.context.createNamedNode(this.context.resolve("rdf:first")), o.o));
        s = this.skipWS(s);
        cont = s.charAt(0) != ")";
        if(cont) {
          this.add(this.context.createTriple(listject.o, this.context.createNamedNode(this.context.resolve("rdf:rest")), listject.o = this.context.createBlankNode()))
        } else {
          this.add(this.context.createTriple(listject.o, this.context.createNamedNode(this.context.resolve("rdf:rest")), this.context.createNamedNode(this.context.resolve("rdf:nil"))))
        }
      }
      return this.skipWS(s.slice(1))
    },
    consumeDirective: function(s) {
      var p = 0;
      if(s.substring(1, 7) == "prefix") {
        s = this.skipWS(s.slice(7));
        p = s.indexOf(":");
        var prefix = s.substring(0, p);
        s = this.skipWS(s.slice(++p));
        this.expect(s, "<");
        this.context.setPrefix(prefix, api.parsers.decodeString(s.substring(1, p = s.indexOf(">"))));
        s = this.skipWS(s.slice(++p))
      } else if(s.substring(1, 5) == "base") {
        s = this.skipWS(s.slice(5));
        this.expect(s, "<");
        this.base = this.context.createIRI(api.parsers.decodeString(s.substring(1, p = s.indexOf(">"))));
        s = this.skipWS(s.slice(++p))
      } else {
        throw new Error("Unknown directive: " + s.substring(0, 50));
      }
      return s
    },
    consumeKnownBlankNode: function(s, t) {
      this.expect(s, "_:");
      var bname = s.slice(2).match(api.parsers.Turtle.simpleToken).shift();
      t.o = this.getBlankNode(bname);
      return s.slice(bname.length + 2)
    },
    consumeLiteral: function(s, o) {
      var value = "";
      var hunt = true;
      var end = 0;
      if(s.substring(0, 3) == '"""') {
        end = 3;
        while(hunt) {
          end = s.indexOf('"""', end);
          if(hunt = s.charAt(end - 1) == "\\") { end++ }
        }
        value = s.substring(3, end);
        s = s.slice(value.length + 6)
      } else {
        while(hunt) {
          end = s.indexOf('"', end + 1);
          hunt = s.charAt(end - 1) == "\\"
        }
        value = s.substring(1, end);
        s = s.slice(value.length + 2)
      }
      value = api.parsers.decodeString(value);
      switch(s.charAt(0)) {
        case "@":
          var token = s.match(api.parsers.Turtle.simpleObjectToken).shift();
          o.o = this.context.createLiteral(value, token.slice(1));
          s = s.slice(token.length);
          break;
        case "^":
          var token = s.match(api.parsers.Turtle.simpleObjectToken).shift().slice(2);
          if(token.charAt(0) == "<") {
            o.o = this.context.createLiteral(value, this.context.createNamedNode(token.substring(1, token.length - 1)))
          } else {
            o.o = this.context.createLiteral(value, this.context.createNamedNode(this.context.resolve(token)))
          }
          s = s.slice(token.length + 2);
          break;
        default:
          o.o = this.context.createLiteral(value);
          break
      }
      return s
    },
    consumeObjectList: function(s, subject, property) {
      var cont = true;
      while(cont) {
        var o = this.t();
        switch(s.charAt(0)) {
          case "[": s = this.consumeBlankNode(s, o); break;
          case "_": s = this.consumeKnownBlankNode(s, o); break;
          case "(": s = this.consumeCollection(s, o); break;
          case "<": s = this.consumeURI(s, o); break;
          case '"': s = this.consumeLiteral(s, o); break;
          default:
            var token = s.match(api.parsers.Turtle.simpleObjectToken).shift();
            if(token.charAt(token.length - 1) == ".") {
              token = token.substring(0, token.length - 1)
            }
            if(token == "false" || token == "true") {
              o.o = this.context.createLiteral(token, this.context.createNamedNode(this.context.resolve("xsd:boolean")))
            } else if(token.indexOf(":") > -1) {
              o.o = this.context.createNamedNode(this.context.resolve(token))
            } else if(api.parsers.Turtle.tokenInteger.test(token)) {
              o.o = this.context.createLiteral(token, this.context.createNamedNode(this.context.resolve("xsd:integer")))
            } else if(api.parsers.Turtle.tokenDouble.test(token)) {
              o.o = this.context.createLiteral(token, this.context.createNamedNode(this.context.resolve("xsd:double")))
            } else if(api.parsers.Turtle.tokenDecimal.test(token)) {
              o.o = this.context.createLiteral(token, this.context.createNamedNode(this.context.resolve("xsd:decimal")))
            } else {
              throw new Error("unrecognised token: " + token);
            }
            s = s.slice(token.length);
            break
        }
        this.add(this.context.createTriple(subject.o, property, o.o));
        s = this.skipWS(s);
        cont = s.charAt(0) == ",";
        if(cont) { s = this.skipWS(s.slice(1)) }
      }
      return s
    },
    consumePredicateObjectList: function(s, subject) {
      var cont = true;
      while(cont) {
        var predicate = s.match(api.parsers.Turtle.simpleToken).shift();
        var property = null;
        if(predicate == "a") {
          property = this.context.createNamedNode(this.context.resolve("rdf:type"))
        } else {
          switch(predicate.charAt(0)) {
            case "<": property = this.context.createNamedNode(api.parsers.decodeString(predicate.substring(1, predicate.indexOf(">")))); break;
            default: property = this.context.createNamedNode(this.context.resolve(predicate)); break
          }
        }
        s = this.skipWS(s.slice(predicate.length));
        s = this.consumeObjectList(s, subject, property);
        cont = s.charAt(0) == ";";
        if(cont) { s = this.skipWS(s.slice(1)) }
      }
      return s
    },
    consumeQName: function(s, t) {
      var qname = s.match(api.parsers.Turtle.simpleToken).shift();
      t.o = this.context.createNamedNode(this.context.resolve(qname));
      return s.slice(qname.length)
    },
    consumeStatement: function(s) {
      var t = this.t();
      switch(s.charAt(0)) {
        case "[":
          s = this.consumeBlankNode(s, t);
          if(s.charAt(0) == ".") { return s }
          break;
        case "_": s = this.consumeKnownBlankNode(s, t); break;
        case "(": s = this.consumeCollection(s, t); break;
        case "<": s = this.consumeURI(s, t); break;
        default: s = this.consumeQName(s, t); break
      }
      s = this.consumePredicateObjectList(this.skipWS(s), t);
      return s
    },
    consumeURI: function(s, t) {
      this.expect(s, "<");
      var p = 0;
      t.o = api.parsers.decodeString(s.substring(1, p = s.indexOf(">")));
      if(this.base) t.o = this.base.resolveReference(t.o);
      t.o = this.context.createNamedNode(t.o);
      return s.slice(++p)
    },
    expect: function(s, t) {
      if(s.substring(0, t.length) == t) { return }
      throw new Error("Expected token: " + t + " at " + s.substring(0, 50));
    },
    getBlankNode: function(id) {
      if(this.bnHash.exists(id)) { return this.bnHash.get(id) }
      var bn = this.context.createBlankNode();
      this.bnHash.set(id, bn);
      return bn
    },   
    skipWS: function(s) {
      while(api.parsers.Turtle.isWhitespace.test(s.charAt(0))) {
        s = s.replace(api.parsers.Turtle.initialWhitespace, "");
        if(s.charAt(0) == "#") { s = s.replace(api.parsers.Turtle.initialComment, "") }
      }
      return s
    }
  };
  api.parseNT = function(doc, cb, base, filter, graph) { return new api.parsers.NTriples(api).parse(doc, cb, base, filter, graph) };
  api.processNT = function(doc, cb, base, filter) { return new api.parsers.NTriples(api).process(doc, cb, base, filter) };
  api.parseTurtle = function(doc, cb, base, filter, graph) { return new api.parsers.Turtle(api).parse(doc, cb, base, filter, graph) };
  api.processTurtle = function(doc, cb, base, filter) { return new api.parsers.Turtle(api).process(doc, cb, base, filter) };
})(rdf);
/**
 * Serializers (NTriples, Turtle)
 */
(function(api) {
  if(!api.serializers) { api.serializers = {} }
  /**
   * NTriples implements DataSerializer
   */
  api.serializers.NTriples = function(context) {};
  api.serializers.NTriples.prototype = {
    serialize: function(graph) { return graph.toArray().join("\n") }
  };
  /**
   * Turtle implements DataSerializer
   */
  api.serializers.Turtle = function(context) {
    this.context = context;
    this.createPrefixMap()
  };
  api.serializers.Turtle.NS_RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
  api.serializers.Turtle.RDF_TYPE = api.createNamedNode(api.serializers.Turtle.NS_RDF + "type");
  api.serializers.Turtle.RDF_RDF = api.createNamedNode(api.serializers.Turtle.NS_RDF + "RDF");
  api.serializers.Turtle.RDF_FIRST = api.createNamedNode(api.serializers.Turtle.NS_RDF + "first");
  api.serializers.Turtle.RDF_REST = api.createNamedNode(api.serializers.Turtle.NS_RDF + "rest");
  api.serializers.Turtle.RDF_NIL = api.createNamedNode(api.serializers.Turtle.NS_RDF + "nil");
  api.serializers.Turtle.prototype = {
    context: null, index: null, lists: null, prefixMap: null, usedPrefixes: null, nonAnonBNodes: null, skipSubjects: null,
    serialize: function(graph) {
      this.initiate();
      graph = this.suckLists(graph);
      var _ = this;
      graph.forEach(function(t, i, s) { _.addTripleToIndex(t, i, s) });
      return this.render()
    },
    startsWith: function(o, s, i) {
      if(i) { return s.toLowerCase() == o.substring(0, s.length).toLowerCase() }
      return s == o.substring(0, s.length)
    },
    contains: function(a, o) {
      return a.indexOf(o) >= 0
    },
    remove: function(a,obj) {
      var idx = a.indexOf(obj);
      if(idx == -1) return false
      a.splice(idx, 1);
      return true
    },
    addTripleToIndex: function(t, i, s) {
      if(t.object.interfaceName == "BlankNode") {
        this.nonAnonBNodes.set(t.object.toString(), this.nonAnonBNodes.exists(t.object.toString()) ? this.nonAnonBNodes.get(t.object.toString()) + 1 : 1)
      }
      var s1 = this.shrink(t.subject);
      var p = this.shrink(t.property, true);
      if(!this.index.exists(s1)) { this.index.set(s1, new api.Hash) }
      if(!this.index.get(s1).exists(p)) { this.index.get(s1).set(p, new Array) }
      this.index.get(s1).get(p).push(t.object)
    },
    anonBNode: function(subject, indent) { return this.propertyObjectChain(this.index.get(subject), indent) },
    createPrefixMap: function() {
      var m = this.context.prefixes;
      this.prefixMap = new api.Hash;
      for(k in m) this.prefixMap.set(m[k], k.concat(':'));
    },
    initiate: function() {
      this.index = new api.Hash;
      this.usedPrefixes = new Array;
      this.nonAnonBNodes = new api.Hash;
      this.skipSubjects = new Array;
      this.lists = new api.Hash
    },
    output: function(o) {
      if(o.interfaceName == "NamedNode") { return this.shrink(o) }
      if(o.interfaceName == "Literal" && o.datatype) {
        if(o.datatype.equals(this.context.resolve("xsd:integer"))) { return o.value }
        if(o.datatype.equals(this.context.resolve("xsd:double"))) { return o.value }
        if(o.datatype.equals(this.context.resolve("xsd:decimal"))) { return o.value }
        if(o.datatype.equals(this.context.resolve("xsd:boolean"))) { return o.value }
        return '"' + o.value + '"^^' + this.shrink(o.type);
      }
      return o.toNT()
    },
    propertyObjectChain: function(po, indent) {
      if(!po) return;
      if(indent == null) { indent = 2 }
      var out = "";
      var _ = this;
      var properties = po.keys();
      properties.sort();
      if(this.contains(properties, "a")) {
        this.remove(properties,"a");
        properties.unshift("a")
      }
      properties.forEach(function(property, pi, pa) {
        out = out + (pi > 0 ? (new Array(indent + 1)).join(" ") : "") + property + " ";
        po.get(property).forEach(function(o, oi, oa) {
          var oindent = "";
          if(oa.length > 2) {
            oindent = "\n" + (new Array(indent + 2 + 1)).join(" ")
          }
          if(o.toString().charAt(0) == "_" && !_.nonAnonBNodes.exists(o.toString())) {
            if(_.lists.exists(o.toNT())) {
              out = out + _.renderList(o.toNT(), indent + 3)
            }else {
              out = out + oindent + "[ " + _.anonBNode(o.toString(), indent + 2 + 2) + oindent + (oa.length == 1 ? " " : "") + "]"
            }
          }else {
            out = out + oindent + _.output(o)
          }
          if(oa.length - 1 != oi) {
            if(oa.length > 2) {
              out = out + "," + (new Array(indent + 2 + 2)).join(" ")
            }else {
              out = out + ", "
            }
          }
        });
        out = out + (pa.length - 1 == pi ? "" : ";\n")
      });
      return out
    },
    render: function() {
      var out = new Array;
      var _ = this;
      this.skipSubjects = this.nonAnonBNodes.keys();
      this.nonAnonBNodes.keys().forEach(function(k, i, a) { if(_.nonAnonBNodes.get(k) == 1) { _.nonAnonBNodes.remove(k) } });
      this.index.keys().forEach(function(subject, $is, $as) {
        var single = "";
        if(subject.charAt(0) == "_") {
          if(!_.nonAnonBNodes.exists(subject) && !_.contains(_.skipSubjects,subject)) {
            if(_.lists.exists(subject)) {
              single = _.renderList(subject, 2) + " " + _.propertyObjectChain(_.index.get(subject))
            } else {
              single = "[ " + _.anonBNode(subject, 2) + "\n]"
            }
          }
        } else {
          single = subject + " " + _.propertyObjectChain(_.index.get(subject))
        }
        if(single.length > 0) { out.push(single + " .\n") }
      });
      if(this.usedPrefixes.length > 0) {
        var invertedMap = new api.Hash;
        this.prefixMap.keys().forEach(function(k, i, h) { if(_.contains(_.usedPrefixes,k)) { invertedMap.set(_.prefixMap.get(k), k) } });
        var prefixes = invertedMap.keys();
        prefixes.sort();
        prefixes.reverse();
        out.unshift("");
        prefixes.forEach(function(s, i, a) { out.unshift("@prefix " + s + " <" + invertedMap.get(s) + "> .") })
      }
      return out.join("\n")
    },
    renderList: function(o, indent) {
      var _ = this;
      var list = new Array;
      _.lists.get(o).forEach(function(n, i, a) { list.push(_.output(n)) });
      var lis = new Array;
      var liststring = "";
      while(list.length > 0) {
        var li = list.shift();
        if(liststring.length + li.length < 75) {
          liststring = liststring.concat(li + " ")
        } else {
          lis.push(liststring);
          liststring = li + " "
        }
      }
      lis.push(liststring);
      var nl = lis.length == 1 ? " " : "\n" + (new Array(indent)).join(" ");
      return"(" + nl + lis.join(nl) + (lis.length == 1 ? "" : "\n") + ")"
    },
    shrink: function(n, property) {
      if(property == null) { property = false }
      if(property && n.equals(api.serializers.Turtle.RDF_TYPE)) { return "a" }
      if(n.equals(api.serializers.Turtle.RDF_NIL)) { return "()" }
      var _g = 0, _g1 = this.prefixMap.keys();
      while(_g < _g1.length) {
        var i = _g1[_g];
        ++_g;
        if(this.startsWith(n.toString(),i)) {
          if(!this.contains(this.usedPrefixes,i)) { this.usedPrefixes.push(i) }
          return n.toString().replace(i, this.prefixMap.get(i))
        }
      }
      return n.toNT()
    },
    suckLists: function(graph) {
      var sFilter = function(n) { return function(t, i, s) { return t.subject.equals(n) } };
      var pFilter = function(n) { return function(t, i, s) { return t.property.equals(n) } };
      var poFilter = function(p, o) { return function(t, i, s) { return t.property.equals(p) && t.object.equals(o) } };
      var tFilter = function(a) { return function(t, i, s) { return!(t.subject.equals(a.subject) && t.property.equals(a.property) && t.object.equals(a.object)) } };
      var members = graph.filter(function(t, i, s) { return t.property.equals(api.serializers.Turtle.RDF_FIRST) || t.property.equals(api.serializers.Turtle.RDF_REST) });
      members.forEach(function(t, i, s) { graph = graph.filter(tFilter(t)) });
      var ends = members.filter(function(t, i, s) { return t.object.equals(api.serializers.Turtle.RDF_NIL) });
      var _ = this;
      ends.forEach(function(n, i, s) {
        var tmplist = new Array;
        var q = n;
        var start = null;
        while(q != null) {
          start = q.subject;
          tmplist.unshift(members.filter(sFilter(start)).filter(pFilter(api.serializers.Turtle.RDF_FIRST)).toArray().pop().object);
          members = members.filter(function(t, i1, s1) { return!t.subject.equals(start) });
          q = members.filter(poFilter(api.serializers.Turtle.RDF_REST, start)).toArray().pop()
        }
        _.lists.set(start.toNT(), tmplist)
      });
      return graph
    }
  };
  api.nt = function(graph) { return new api.serializers.NTriples(api).serialize(graph); };
  api.turtle = function(graph) { return new api.serializers.Turtle(api).serialize(graph); };
})(rdf);
/**
 * additions/filters
 */
(function(api) {
  api.filters = {
    s: function(s) {
      if(Array.isArray(s)) return function(t) {
        for(i in s) if(t.s.equals(s[i])) return true;
        return false;
      }
      return function(t) { return t.s.equals(s); }
    },
    p: function(p) {
      if(Array.isArray(p)) return function(t) {
        for(i in p) if(t.p.equals(p[i])) return true;
        return false;
      }
      return function(t) { return t.p.equals(p); }
    },
    o: function(o) {
      if(Array.isArray(o)) return function(t) {
        for(i in o) if(t.o.equals(o[i])) return true;
        return false;
      }
      return function(t) { return t.o.equals(o); }
    },
    sp: function(s,p) {
      if(!Array.isArray(s)) s = [s];
      if(!Array.isArray(p)) p = [p];
      return function(t) {
        for(i in s)
          for(ii in p)
            if(t.p.equals(p[ii]) && t.s.equals(s[i])) return true;
        return false;
      }
    },
    so: function(s,o) {
      if(!Array.isArray(s)) s = [s];
      if(!Array.isArray(o)) o = [o];
      return function(t) {
        for(i in s)
          for(ii in o)
            if(t.s.equals(s[i]) && t.o.equals(o[ii])) return true;
        return false;
      }
    },
    po: function(p,o) {
      if(!Array.isArray(p)) p = [p];
      if(!Array.isArray(o)) o = [o];
      return function(t) {
        for(i in p)
          for(ii in o)
            if(t.p.equals(p[i]) && t.o.equals(o[i])) return true;
        return false;
      }
    },
    spo: function(s,p,o) {
      if(!Array.isArray(s)) s = [s];
      if(!Array.isArray(p)) p = [p];
      if(!Array.isArray(o)) o = [o];
      return function(t) {
        for(i in s)
          for(ii in p)
            for(iii in o)
              if(t.s.equals(s[i]) && t.p.equals(p[ii]) && t.o.equals(o[iii])) return true;
        return false;
      }
    },
    describes: function(o) {
      if(Array.isArray(o)) return function(t) {
        for(i in o) if(t.s.equals(o[i]) || t.o.equals(o[i])) return true;
        return false;
      }
      return function(t) { return t.s.equals(o) || t.o.equals(o); }
    },
    type: function(o) {
      var RDF_TYPE = api.resolve("rdf:type");
      if(Array.isArray(o)) return function(t) {
        for(i in o) if(t.p.equals(RDF_TYPE) && t.o.equals(o[i])) return true;
        return false;
      }
      return function(t) { return t.p.equals(RDF_TYPE) && t.o.equals(o); }
    },
    constrainedTriple: function() {
      return function(t) {
        return (t.s.interfaceName == 'NamedNode' || t.s.interfaceName == 'BlankNode') && t.p.interfaceName == 'NamedNode'
      }
    },
    link: function() {
      return function(t) {
        return t.s.interfaceName == 'NamedNode' && t.p.interfaceName == 'NamedNode' && t.o.interfaceName == 'NamedNode'
      }
    },
  };
  api.filterCount = function(g,f) {
    var c = 0;
    g.forEach(function(t) { f(t) && ++c })
    return c;
  };
  api.isOldSchool = function(g) {
    return g.every(api.filters.constrainedTriple());
  };
  api.links = function(g) {
    return g.filter(api.filters.link());
  };
})(rdf);
(function(api) {
  api.BaseGraph = api.Graph;
  api.Graph = function(a) {
    return Object.defineProperties( new api.BaseGraph(a) , {
      _distinct: { writable: false, configurable : false, enumerable: false, value: function(a) {
        var o = new api.Hash;
        for(i in this._graph)
          if(!o.exists(this._graph[i][a].h))
            o.set(this._graph[i][a].h, this._graph[i][a])
        return o.toArray();
      }},
      subjects: { writable: false, configurable : false, enumerable: true, value: function() {
        return this._distinct('s');
      }},
      predicates: { writable: false, configurable : false, enumerable: true, value: function() {
        return this._distinct('p');
      }},
      objects: { writable: false, configurable : false, enumerable: true, value: function() {
        return this._distinct('o');
      }},
      isGround: { writable: false, configurable : false, enumerable: true, value: function() {
        return this.every(function(t) {
          return !(t.s.interfaceName == "BlankNode" || t.p.interfaceName == "BlankNode" || t.o.interfaceName == "BlankNode");
        });
      }},
    });
  };
})(rdf);
/**
 * additions/converter
 */
(function(api) {
  api.Converter = function() { };
  api.Converter.INTEGER = new RegExp("^(-|\\+)?[0-9]+$", "");
  api.Converter.DOUBLE = new RegExp("^(-|\\+)?(([0-9]+\\.[0-9]*[eE]{1}(-|\\+)?[0-9]+)|(\\.[0-9]+[eE]{1}(-|\\+)?[0-9]+)|([0-9]+[eE]{1}(-|\\+)?[0-9]+))$", "");
  api.Converter.DECIMAL = new RegExp("^(-|\\+)?[0-9]*\\.[0-9]+?$", "");
  api.Converter.prototype = {
    c: null,
    _string: function(s,a) {
      if(!(Boolean(a).valueOf()) || a.indexOf(':') < 0) return api.createLiteral(s,a);
      return api.createLiteral(s,api.ref(a));
    },
    _boolean: function(b) {
      return api.createLiteral(b?"true":"false",api.ref('xsd:boolean'))
    },
    _date: function(d,ms) {
      function pad(n){ return n<10 ? '0'+n : n }
      var s = d.getUTCFullYear()+'-' + pad(d.getUTCMonth()+1)+'-' + pad(d.getUTCDate())+'T'
        + pad(d.getUTCHours())+':' + pad(d.getUTCMinutes())+':' + pad(d.getUTCSeconds());
      if(Boolean(ms)) s += d.getUTCMilliseconds() > 0 ? s+'.'+d.getUTCMilliseconds() : s;
      return api.createLiteral(s += 'Z',api.ref('xsd:dateTime'));
    },
    _number: function(n) {
      if(n == Number.POSITIVE_INFINITY) return api.createLiteral('INF',api.ref('xsd:double'));
      if(n == Number.NEGATIVE_INFINITY) return api.createLiteral('-INF',api.ref('xsd:double'));
      if(n == Number.NaN) return api.createLiteral('NaN',api.ref('xsd:double'));
      n = n.toString();
      if(api.Converter.INTEGER.test(n)) return api.createLiteral(n,api.ref('xsd:integer'));
      if(api.Converter.DECIMAL.test(n)) return api.createLiteral(n,api.ref('xsd:decimal'));
      if(api.Converter.DOUBLE.test(n)) return api.createLiteral(n,api.ref('xsd:double'));
      throw new TypeError("Can't convert weird number: " + n );
    },
    convert: function(l,r) {
      switch(typeof l) {
        case 'string': return this._string(l,r);
        case 'boolean': return this._boolean(l);
        case 'number': return this._number(l);
        case 'object':
          switch(l.constructor.name) {
            case 'Boolean': return this._boolean(l.valueOf());
            case 'Date': return this._date(l,r);
            case 'Number': return this._number(l);
          }        
      }
      throw new TypeError('Cannot convert type: ' + l.constructor.name);
    }
  };
  api.converter = new api.Converter;
  api.literal = function(o,t) {
    return api.converter.convert(o,t);
  };
})(rdf);
/**
 * additions/sugar
 */
(function(api) {
  api.log = function(o) {
    console.log(o);
  };
  api.ref = function(v) {
    return v == null ? this.createBlankNode() : this.createNamedNode(this.iri(v))
  };
  api.iri = function(i) {
    return this.createIRI((o = this.resolve(i)) == null ? i : o);
  };
  api.node = function(v,t) {
    if(t) return this.literal(v,t);
    if(v === null || v === undefined) return this.createBlankNode();
    if(typeof v == "string" && v.indexOf(":") >= 0) return this.ref(v);
    return this.literal(v);
  }
})(rdf);
/**
 * additions/prefixes
 */
(function(rdf) {
  rdf.prefixes.addAll({
    owl: "http://www.w3.org/2002/07/owl#",
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    rdfa: "http://www.w3.org/ns/rdfa#",
    xhv: "http://www.w3.org/1999/xhtml/vocab#",
    xml: "http://www.w3.org/XML/1998/namespace",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    grddl: "http://www.w3.org/2003/g/data-view#",
    powder: "http://www.w3.org/2007/05/powder#",
    powders: "http://www.w3.org/2007/05/powder-s#",
    rif: "http://www.w3.org/2007/rif#",
    atom: "http://www.w3.org/2005/Atom/",
    xhtml: "http://www.w3.org/1999/xhtml#",
    formats: "http://www.w3.org/ns/formats/",
    xforms: "http://www.w3.org/2002/xforms/",
    xhtmlvocab: "http://www.w3.org/1999/xhtml/vocab/",
    xpathfn: "http://www.w3.org/2005/xpath-functions#",
    http: "http://www.w3.org/2006/http#",
    link: "http://www.w3.org/2006/link#",
    time: "http://www.w3.org/2006/time#",
    acl: "http://www.w3.org/ns/auth/acl#",
    cert: "http://www.w3.org/ns/auth/cert#",
    rsa: "http://www.w3.org/ns/auth/rsa#",
    crypto: "http://www.w3.org/2000/10/swap/crypto#",
    list: "http://www.w3.org/2000/10/swap/list#",
    log: "http://www.w3.org/2000/10/swap/log#",
    math: "http://www.w3.org/2000/10/swap/math#",
    os: "http://www.w3.org/2000/10/swap/os#",
    string: "http://www.w3.org/2000/10/swap/string#",
    doc: "http://www.w3.org/2000/10/swap/pim/doc#",
    contact: "http://www.w3.org/2000/10/swap/pim/contact#",
    p3p: "http://www.w3.org/2002/01/p3prdfv1#",
    swrl: "http://www.w3.org/2003/11/swrl#",
    swrlb: "http://www.w3.org/2003/11/swrlb#",
    exif: "http://www.w3.org/2003/12/exif/ns#",
    earl: "http://www.w3.org/ns/earl#",
    ma: "http://www.w3.org/ns/ma-ont#",
    sawsdl: "http://www.w3.org/ns/sawsdl#",
    sd: "http://www.w3.org/ns/sparql-service-description#",
    skos: "http://www.w3.org/2004/02/skos/core#",
    fresnel: "http://www.w3.org/2004/09/fresnel#",
    gen: "http://www.w3.org/2006/gen/ont#",
    timezone: "http://www.w3.org/2006/timezone#",
    skosxl: "http://www.w3.org/2008/05/skos-xl#",
    org: "http://www.w3.org/ns/org#",
    ical: "http://www.w3.org/2002/12/cal/ical#",
    wgs84: "http://www.w3.org/2003/01/geo/wgs84_pos#",
    vcard: "http://www.w3.org/2006/vcard/ns#",
    turtle: "http://www.w3.org/2008/turtle#",
    pointers: "http://www.w3.org/2009/pointers#",
    dcat: "http://www.w3.org/ns/dcat#",
    imreg: "http://www.w3.org/2004/02/image-regions#",
    rdfg: "http://www.w3.org/2004/03/trix/rdfg-1/",
    swp: "http://www.w3.org/2004/03/trix/swp-2/",
    rei: "http://www.w3.org/2004/06/rei#",
    wairole: "http://www.w3.org/2005/01/wai-rdf/GUIRoleTaxonomy#",
    states: "http://www.w3.org/2005/07/aaa#",
    wn20schema: "http://www.w3.org/2006/03/wn/wn20/schema/",
    httph: "http://www.w3.org/2007/ont/httph#",
    act: "http://www.w3.org/2007/rif-builtin-action#",
    common: "http://www.w3.org/2007/uwa/context/common.owl#",
    dcn: "http://www.w3.org/2007/uwa/context/deliverycontext.owl#",
    hard: "http://www.w3.org/2007/uwa/context/hardware.owl#",
    java: "http://www.w3.org/2007/uwa/context/java.owl#",
    loc: "http://www.w3.org/2007/uwa/context/location.owl#",
    net: "http://www.w3.org/2007/uwa/context/network.owl#",
    push: "http://www.w3.org/2007/uwa/context/push.owl#",
    soft: "http://www.w3.org/2007/uwa/context/software.owl#",
    web: "http://www.w3.org/2007/uwa/context/web.owl#",
    content: "http://www.w3.org/2008/content#",
    vs: "http://www.w3.org/2003/06/sw-vocab-status/ns#",
    air: "http://dig.csail.mit.edu/TAMI/2007/amord/air#",
    ex: "http://example.org/",
    
    dc: "http://purl.org/dc/terms/",
    dc11: "http://purl.org/dc/elements/1.1/",
    dctype: "http://purl.org/dc/dcmitype/",
    foaf: "http://xmlns.com/foaf/0.1/",
    cc: "http://creativecommons.org/ns#",
    opensearch: "http://a9.com/-/spec/opensearch/1.1/",
    'void': "http://rdfs.org/ns/void#",
    sioc: "http://rdfs.org/sioc/ns#",
    sioca: "http://rdfs.org/sioc/actions#",
    sioct: "http://rdfs.org/sioc/types#",
    lgd: "http://linkedgeodata.org/vocabulary#",
    moat: "http://moat-project.org/ns#",
    days: "http://ontologi.es/days#",
    giving: "http://ontologi.es/giving#",
    lang: "http://ontologi.es/lang/core#",
    like: "http://ontologi.es/like#",
    status: "http://ontologi.es/status#",
    og: "http://opengraphprotocol.org/schema/",
    protege: "http://protege.stanford.edu/system#",
    dady: "http://purl.org/NET/dady#",
    uri: "http://purl.org/NET/uri#",
    audio: "http://purl.org/media/audio#",
    video: "http://purl.org/media/video#",
    gridworks: "http://purl.org/net/opmv/types/gridworks#",
    hcterms: "http://purl.org/uF/hCard/terms/",
    bio: "http://purl.org/vocab/bio/0.1/",
    cs: "http://purl.org/vocab/changeset/schema#",
    geographis: "http://telegraphis.net/ontology/geography/geography#",
    doap: "http://usefulinc.com/ns/doap#",
    daml: "http://www.daml.org/2001/03/daml+oil#",
    geonames: "http://www.geonames.org/ontology#",
    sesame: "http://www.openrdf.org/schema/sesame#",
    cv: "http://rdfs.org/resume-rdf/",
    wot: "http://xmlns.com/wot/0.1/",
    media: "http://purl.org/microformat/hmedia/",
    ctag: "http://commontag.org/ns#"
  });
})(rdf);
