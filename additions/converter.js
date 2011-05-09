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
