"use strict";

var assert = require('assert');
var discrepances = require('discrepances')
var TypeStore = require("../type-store.js");
var changing = require('best-globals').changing;

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
    it("html in spanish", function(){
        var txt="12345.67";
        var typeDecimal = new TypeStore.type.decimal();
        var saveOptions = changing({},TypeStore.options);
        TypeStore.options.number.decimalSeparator=',';
        TypeStore.options.number.milesSeparator='.';
        var value = typeDecimal.fromString(txt);
        var htmlText = typeDecimal.toHtmlText(value);
        discrepances.showAndThrow(htmlText,"<span class=number><span class='number-miles'>12</span><span class='number-separator'>.</span><span class='number-miles'>345</span><span class='number-dot'>,</span><span class='number-decimals'>67</span></span>");
        TypeStore.options = changing({},saveOptions);
    });
});