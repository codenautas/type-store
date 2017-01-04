"use strict";

const assert = require('assert');
var TypeStore = require("../type-store.js");

var Big = require('big.js');

describe("bigint", function(){
    it("not convert little and medium integers", function(){
        var txt="123456789012345";
        var n = TypeStore.type.bigint.fromString(txt);
        assert.equal(typeof n, "number");
        assert.equal(n, 123456789012345);
    });
    it("convert big integers", function(){
        var txt="1234567890123456";
        var n = TypeStore.type.bigint.fromString(txt);
        assert.equal(typeof n, "object");
        assert(n instanceof Big);
        assert(n.typeStore);
        assert.equal(n.typeStore.type, "bigint");
        assert.equal(n.toLiteral(), "1234567890123456");
    });
});