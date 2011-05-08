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

})(rdf);
