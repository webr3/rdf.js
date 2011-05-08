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
