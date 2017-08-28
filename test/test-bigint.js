"use strict";

var assert = require('assert');
var TypeStore = require("../type-store.js");

var Big = require('big.js');

describe("bigint", function(){
    var typeBigint = new TypeStore.type.bigint();
    it("not convert little and medium integers", function(){
        var txt="123456789012345";
        var n = typeBigint.fromString(txt);
        assert.equal(typeof n, "number");
        assert.equal(n, 123456789012345);
    });
    it("convert big integers", function(){
        var txt="1234567890123450";
        var n = typeBigint.fromString(txt);
        assert.equal(typeof n, "object");
        assert(n instanceof Big);
        assert(n.typeInfo);
        assert.equal(n.typeInfo.typeName, "bigint");
        assert.equal(n.toLiteral(), txt);
        assert(!n.sameValue(txt));
        assert(n.div(10).sameValue(123456789012345));
        assert(n.sameValue(typeBigint.fromString(txt)));
    });
});