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
