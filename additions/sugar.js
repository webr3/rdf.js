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
