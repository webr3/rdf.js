cd ..
git submodule init
git submodule update
cat rdf-interfaces/rdfi.js additions/misc.js additions/iri.js additions/parsers.js additions/serializers.js additions/filters.js additions/graph.extensions.js additions/converter.js additions/sugar.js additions/prefixes.js > rdf.js
java -jar ../yui.jar rdf.js > rdf.min.js