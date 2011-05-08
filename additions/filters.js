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
