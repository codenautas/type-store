"use strict";

var assert = require('assert');
var TypeStore = require("../type-store.js");

function oidsOf(prototype){
    if(prototype.pg_OIDS){
        return prototype.pg_OIDS;
    }
    return prototype.pg_OID == null ? [] : [prototype.pg_OID];
}

function specialParseTypeNames(){
    return Object.keys(TypeStore.type).filter(function(typeName){
        return TypeStore.type[typeName].prototype.pgSpecialParse;
    });
}

describe("pg OIDs of the types with pgSpecialParse", function(){
    it("no OID is claimed by two types", function(){
        var claims = {};
        specialParseTypeNames().forEach(function(typeName){
            oidsOf(TypeStore.type[typeName].prototype).forEach(function(oid){
                claims[oid] = (claims[oid] || []).concat(typeName);
            });
        });
        var repeated = Object.keys(claims).filter(function(oid){
            return claims[oid].length > 1;
        }).map(function(oid){
            return oid + ': ' + claims[oid].join(', ');
        });
        assert.deepStrictEqual(repeated, []);
    });
    it("every OID is declared in the type's own prototype, not inherited", function(){
        var inherited = specialParseTypeNames().filter(function(typeName){
            var prototype = TypeStore.type[typeName].prototype;
            return oidsOf(prototype).length > 0 &&
                !Object.prototype.hasOwnProperty.call(prototype, 'pg_OID') &&
                !Object.prototype.hasOwnProperty.call(prototype, 'pg_OIDS');
        });
        assert.deepStrictEqual(inherited, []);
    });
    it("double precision (OID 701) is not parsed by an integer type", function(){
        var claimants = specialParseTypeNames().filter(function(typeName){
            return oidsOf(TypeStore.type[typeName].prototype).indexOf(701) !== -1;
        });
        assert.deepStrictEqual(claimants, []);
    });
});
