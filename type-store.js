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
        {name:'minutes', optative:false, sufix:':' , twoDigits:true },
        {name:'seconds', optative:false, sufix:''  , twoDigits:true },
    ],
    // constructorFunction:new PostgresInterval().constructor,
    regExp:/^(?:(\d+)\s*(?:y|years?|años?|ann?i?os?))?\s*(?:(\d+)\s*(?:m|months?|mese?s?))?\s*(?:(\d+)\s*(?:d|days?|días?|dias?))?\s*(?:(\d+)\s*(?:h|:|hours?|horas?))?\s*(?:(\d+)\s*(?:m|:|'|min|minutes?|minutos?)?)?\s*(?:(\d+)\s*(?:s|"|sec|seg|seconds?|segundos?)?)?\s*?$/i,
    fromString:function fromString(stringWithInterval){
        var module = TypeStore.type.interval;
        var matches=stringWithInterval.match(module.regExp);
        if(!matches) return null;
        var interval=new PostgresInterval();
        module.partDefs.forEach(function(partDef, i){
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
        var module = TypeStore.type.interval;
        var t = module.partDefs.map(function(partDef, i){
            var value=typedValue[partDef.name]||0;
            if(!partDef.optative && (typedValue.hours>0||typedValue.minutes>0||typedValue.seconds>0) || value){
                return (partDef.twoDigits && value<10?'0':'')+value+partDef.sufix;
            }
        }).join('').trim();
        return t;
    },
    toJsHtml:function toJsHtml(typedValue){
        var module = TypeStore.type.interval;
        var x=module.toPlainString(typedValue);
        return html.span({class:'interval'}, x);
    },
    toExcelValue: function toExcelValue(typedValue){
        var module = TypeStore.type.interval;
        return module.toPlainString(typedValue);
    },
    toExcelType: function toExcelType(typedValue){
        return 's';
    },
    fromExcelCell: function fromExcelCell(cell){
        var module = TypeStore.type.interval;
        return module.fromString(cell.w);
    }
}

/*
Interval.prototype.toLiteral=function(){
    return this.toString();
};
*/
// PostgresInterval.prototype.typeStore={type:'interval'};

json4all.addType(PostgresInterval,{
    construct: json4all.nonymizate,
    deconstruct: json4all.anonymizate
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
