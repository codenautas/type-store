"use strict";

var assert = require('assert');
var discrepances = require('discrepances')
var TypeStore = require("../type-store.js");
var changing = require('best-globals').changing;

var Big = require('big.js');

describe("bigint", function(){
    var typeBigint = new TypeStore.type.bigint();
    beforeEach(function(){
        if(TypeStore.i18n.locale.en){
            TypeStore.locale = changing({},TypeStore.i18n.locale.en);
        }
    });
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
        assert.equal(n.toPostgres(), txt);
        // assert(n.typeInfo);
        // assert.equal(n.typeInfo.typeName, "bigint");
        assert.equal(n.toLiteral(), txt);
        assert(!n.sameValue(txt));
        assert(n.div(10).sameValue(123456789012345));
        assert(n.sameValue(typeBigint.fromString(txt)));
    });
    it("html in spanish", function(){
        var txt="12345.67";
        var typeDecimal = new TypeStore.type.decimal();
        TypeStore.locale.number.decimalSeparator=' , ';
        TypeStore.locale.number.milesSeparator=' . ';
        var value = typeDecimal.fromString(txt);
        var htmlText = typeDecimal.toHtmlText(value);
        discrepances.showAndThrow(htmlText,
            "<span class=number number-sign=positive><span class='number-miles'>12</span>"+
            "<span class='number-separator'> . </span>"+
            "<span class='number-miles'>345</span>"+
            "<span class='number-dot'> , </span>"+
            "<span class='number-decimals'>67</span></span>"
        );
    });
    it("html non pasteable separator", function(){
        var txt="12345.67";
        var typeDecimal = new TypeStore.type.decimal();
        TypeStore.options.doNotCopyNonCopyables=true;
        var value = typeDecimal.fromString(txt);
        var htmlText = typeDecimal.toHtmlText(value);
        discrepances.showAndThrow(htmlText,
            "<span class=number number-sign=positive><span class='number-miles'>12</span>"+
            "<span class='number-separator' non-copyable=','></span>"+
            "<span class='number-miles'>345</span>"+
            "<span class='number-dot'>.</span>"+
            "<span class='number-decimals'>67</span></span>"
        );
        discrepances.showAndThrow(typeDecimal.toLocalString(value),'12,345.67');
        TypeStore.options.doNotCopyNonCopyables=false;
        TypeStore.options.doNotOutputNonCopyables=true;
        discrepances.showAndThrow(typeDecimal.toLocalString(value),'12345.67');
        TypeStore.options.doNotOutputNonCopyables=false;
    });
    it("have right align", function(){
        discrepances.showAndThrow(typeBigint.align, 'right');
    });
});

describe("text", function(){
    var typer = new TypeStore.type.text();
    it("have right align", function(){
        discrepances.showAndThrow(typer.align, 'left');
    });
});

describe("integer types accept only decimal integers", function(){
    var invalidInteger = "type-store: invalid integer";
    function testFromString(typeName, input, expected){
        return function(){
            var typer = new TypeStore.type[typeName]();
            if(expected instanceof Error){
                assert.throws(function(){ typer.fromString(input); }, function(err){
                    return err instanceof TypeError && err.message === expected.message;
                });
            }else{
                assert.strictEqual(typer.fromString(input), expected);
            }
        };
    }
    function testValidTypedData(typeName, typedData, expected){
        return function(){
            assert.strictEqual(new TypeStore.type[typeName]().isValidTypedData(typedData), expected);
        };
    }
    it("integer: accepts digits", testFromString("integer", "123", 123));
    it("integer: accepts a sign", testFromString("integer", "-45", -45));
    it("integer: accepts a plus sign", testFromString("integer", "+5", 5));
    it("integer: accepts spaces around", testFromString("integer", " 12 ", 12));
    it("integer: accepts an integer number", testFromString("integer", 7, 7));
    it("integer: an empty text is null", testFromString("integer", "", null));
    it("integer: a text with only spaces is null", testFromString("integer", "  ", null));
    it("integer: null is null", testFromString("integer", null, null));
    it("integer: rejects letters", testFromString("integer", "abc", new TypeError(invalidInteger)));
    it("integer: rejects decimals", testFromString("integer", "1.5", new TypeError(invalidInteger)));
    it("integer: rejects a number with decimals", testFromString("integer", 1.5, new TypeError(invalidInteger)));
    it("integer: rejects hexadecimal", testFromString("integer", "0x10", new TypeError(invalidInteger)));
    it("integer: rejects exponents", testFromString("integer", "1e3", new TypeError(invalidInteger)));
    it("integer: rejects spaces inside", testFromString("integer", "1 2", new TypeError(invalidInteger)));
    it("bigint: rejects letters", testFromString("bigint", "abc", new TypeError(invalidInteger)));
    it("bigint: rejects decimals", testFromString("bigint", "1.5", new TypeError(invalidInteger)));
    it("bigint: an empty text is null", testFromString("bigint", "", null));
    it("hugeint: rejects letters", testFromString("hugeint", "abc", new TypeError(invalidInteger)));
    it("hugeint: rejects decimals", testFromString("hugeint", "1.5", new TypeError(invalidInteger)));
    it("hugeint: an empty text is null", testFromString("hugeint", "", null));
    it("hugeint: converts a big integer with a plus sign and spaces", function(){
        var n = new TypeStore.type.hugeint().fromString(" +1234567890123450 ");
        assert(n instanceof Big);
        assert.equal(n.toString(), "1234567890123450");
    });
    it("integer: an integer is valid typed data", testValidTypedData("integer", 5, true));
    it("integer: null is valid typed data", testValidTypedData("integer", null, true));
    it("integer: a number with decimals is not valid typed data", testValidTypedData("integer", 1.5, false));
    it("integer: NaN is not valid typed data", testValidTypedData("integer", NaN, false));
    it("hugeint: a big integer is valid typed data", testValidTypedData("hugeint", new Big("1234567890123450"), true));
    it("hugeint: a big number with decimals is not valid typed data", testValidTypedData("hugeint", new Big("1234567890123450.5"), false));
});
