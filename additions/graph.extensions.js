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
