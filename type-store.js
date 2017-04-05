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
var PostgresInterval = require('postgres-interval');
var json4all=require('json4all');
var likeAr = require('like-ar');
var jsToHtml = require('js-to-html');

TypeStore.type={};

TypeStore.type.number = {
    typeDbPg:'double precision',
    typedControlName:'number',
    pgSpecialParse:false,
    inexactNumber:true,
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
    },
    toPlainString:function toPlainString(typedValue){
        return typedValue.join(';');
    },
    toHtml:function toHtml(typedValue){
        var x=[];
        typedValue.forEach(function(element, i){
            if(i){
                x.push(html.span({class:'array-separator'},';'));
            }
            x.push(html.span({class:'array-element'},element));
        });
        return html.span({class:'array'}, x);
    },
};

TypeStore.type.jsonb = {
    typeDbPg:'jsonb',
    typedControlName:'FROM:type-store',
    pgSpecialParse:true,
    pg_OID:3802,
    fromString:function fromString(stringWithJsonb){
        return JSON.parse(stringWithJsonb);
    },
    validateTypedData: function validateTypedData(object){
        return object===null || object instanceof Object;
    },
    toPlainString:function toPlainString(typedValue){
        return JSON.stringify(typedValue);
    },
    toJsHtml:function toJsHtml(typedValue){
        var x=JSON.stringify(typedValue);
        return html.span({class:'json'}, x);
    },
};

TypeStore.type.interval = {
    typeDbPg:'interval',
    typedControlName:'FROM:type-store',
    pgSpecialParse:false,
    pg_OID:27009,
    partDefs:[
        {name:'years'  , optative:true , sufix:'Y '},
        {name:'months' , optative:true , sufix:'M '},
        {name:'days'   , optative:true , sufix:'D '},
        {name:'hours'  , optative:false, sufix:':' },
        {name:'minutes', optative:false, sufix:':' },
        {name:'seconds', optative:false, sufix:''  },
    ],
    // constructorFunction:new PostgresInterval().constructor,
    regExp:/^(?:(\d+)\s*(?:years?|años?|ann?i?os?))?\s*(?:(\d+)\s*(?:months?|mese?s?))?\s*(?:(\d+)\s*(?:days?|días?|dias?))?\s*(?:(\d+):(\d+):(\d+))?$/,
    fromString:function fromString(stringWithInterval){
        var matches=stringWithInterval.match(regExp);
        if(!matches) return null;
        var interval=new PostgresInterval();
        TypeStore.type.interval.partDefs.forEach(function(partDef, i){
            if(matches[i+1]){
                interval[partDef.name]=Number(matches[i+1]);
            }
        });
        return interval;
    },
    validateTypedData: function validateTypedData(object){
        return object===null || object instanceof PostgresInterval;
        // return object===null || object instanceof TypeStore.type.interval.constructorFunction;
    },
    toPlainString:function toPlainString(typedValue){
        var t = TypeStore.type.interval.partDefs.map(function(partDef, i){
            if(!partDef.optative || typedValue[partDef.name]){
                return typedValue[partDef.name]+partDef.sufix;
            }
        }).join('');
        return t;
    },
    toJsHtml:function toJsHtml(typedValue){
        var x=TypeStore.type.interval.toPlainString(typedValue);
        return html.span({class:'interval'}, x);
    },
}

/*
Interval.prototype.toLiteral=function(){
    return this.toString();
};
*/
PostgresInterval.prototype.typeStore={type:'interval'};

json4all.addType(PostgresInterval,{
    construct: function construct(value){
        return new PostgresInterval(value); 
    }, 
    deconstruct: function deconstruct(o){
        return o.toString();
    },
});


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

TypeStore.completeTypeInfo = function(typeInfo){
    if(typeInfo.typeName in TypeStore.type){
        likeAr(TypeStore.type[typeInfo.typeName]).forEach(function(value, attr){
            if(!(attr in typeInfo)){
                typeInfo[attr]=value;
            }
        });
    }
}

return TypeStore;

});
