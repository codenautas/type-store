"use strict";

(function codenautasModuleDefinition(root, name, factory) {
    /* global define */
    /* istanbul ignore next */
    if(typeof root.globalModuleName !== 'string'){
        root.globalModuleName = name;
    }
    /* istanbul ignore next */
    if(typeof exports === 'object' && typeof module === 'object'){
        module.exports = factory();
    }else if(typeof define === 'function' && define.amd){
        define(factory);
    }else if(typeof exports === 'object'){
        exports[root.globalModuleName] = factory();
    }else{
        root[root.globalModuleName] = factory();
    }
    root.globalModuleName = null;
})(/*jshint -W040 */this, 'TypeStore', function() {
/*jshint +W040 */

/*jshint -W004 */
var TypeStore = {};
/*jshint +W004 */

var changing = require('best-globals').changing;
var Big = require('big.js');
var json4all=require('json4all');

TypeStore.type={};

TypeStore.type.number = {
    typeDbPg:'double precision',
    typedControlName:'number',
    pgSpecialParse:false,
    pg_OID:701,
};

TypeStore.type.hugeint={
    maxBig: 1000000000000000,
    minBig: -1000000000000000,
    typeDbPg:'number(1000)',
    typedControlName:'number',
    pgSpecialParse:true,
    pg_OID:1700,
    fromString: function fromString(textWithBigInt){
        var self = this;
        var number = Number(textWithBigInt);
        if('maxValue' in self && number>self.maxValue || 'minValue' in self && number<self.minValue){
            throw new TypeError("type-store: value out of range")
        }
        if(number>=self.maxBig || number<=self.minBig){
            number = new Big(textWithBigInt);
        }
        return number;
    }
};

TypeStore.type.integer=changing(TypeStore.type.hugeint,{
    maxValue: 2147483647,
    minValue: -2147483648,
    typeDbPg:'integer',
    pgSpecialParse:false,
    pg_OID:23,
});

TypeStore.type.bigint=changing(TypeStore.type.hugeint,{
    maxValue: 9223372036854775807,
    minValue: -9223372036854775808,
    typeDbPg:'bigint',
    pg_OID:20,
});

TypeStore.type["ARRAY:text"]={
    typeDbPg:'text[]',
    typedControlName:'FROM:type-store',
    validateTypedData:function validateARRAY__Text(anyValue){
        if(anyValue!=null){
            if(!(anyValue instanceof Array)){
                throw new Error("Non an Array in type-store ARRAY:text");
            }else{
                anyValue.forEach(function(anyElement, i){
                    if(typeof anyElement!=='string'){
                        throw new Error("Non a string in type-store ARRAY:text["+i+"]");
                    }
                });
            }
        }
    },
    fromString:function fromString(stringWithArrayText){
        return stringWithArrayText.split(/\s*;\s*/g).map(function(text){ return text.trim(); });
    }
};

TypeStore.type.jsonb = {
    typeDbPg:'jsonb',
    typedControlName:'text',
    pgSpecialParse:true,
    pg_OID:3802,
    fromString:function fromString(stringWithJsonb){
        return stringWithJsonb;
    }
};



Big.prototype.toLiteral=function(){
    return this.toString();
};
Big.prototype.sameValue=function(other){
    if(typeof other === 'number'){
        other = new Big(other);
    }
    return other instanceof Big && this.toString() == other.toString();
};
Big.prototype.typeStore={type:'bigint'};

json4all.addType(Big,{
    construct: function construct(value){
        return new Big(value); 
    }, 
    deconstruct: function deconstruct(o){
        return o.toString();
    },
});

return TypeStore;

});