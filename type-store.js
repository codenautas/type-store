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

var likeAr = require('like-ar');
var bestGlobals = require('best-globals');
var changing = bestGlobals.changing;
var Big = require('big.js');
var json4all=require('json4all');
var jsToHtml = require('js-to-html');
var html = jsToHtml.html;

TypeStore.type={};

TypeStore.class={};

Big.prototype.sameValue=function(other){
    if(typeof other === 'number'){
        other = new TypeStore.class.Big(other);
    }
    return other instanceof Big && this.toString() == other.toString();
};

TypeStore.options={
    number:{
        decimalSeparator:'.',
        milesSeparator:''
    }
}

TypeStore.class.Big = function TypeStoreBig(x, typeInfo){
    Big.call(this,x);
    this.typeInfo = typeInfo;
};
TypeStore.class.Big.prototype = Object.create(Big.prototype);
TypeStore.class.Big.prototype.toLiteral=function(){
    return this.toString();
};

function TypeBase(){};
TypeBase.prototype.setTypeInfo = function setTypeInfo(value){
    if(value instanceof Object){
        value.typeInfo=this;
    }
}
TypeBase.prototype.toHtmlText = function toHtmlText(value){
    return this.toHtml(value).toHtmlText();
}
TypeBase.prototype.toHtml=function toHtml(typedValue){
    var self = this;
    var x=self.toPlainString(typedValue);
    return html.span({class:self.typeName}, x);
};
TypeBase.prototype.toExcelValue=function toExcelValue(typedValue){
    return this.toPlainString(typedValue);
};
TypeBase.prototype.toExcelType=function toExcelType(typedValue){
    return 's';
};
TypeBase.prototype.fromExcelCell=function fromExcelCell(cell){
    return this.fromString(cell.w);
};
TypeBase.prototype.typedControlName='FROM:type-store';

TypeStore.type.number = function TypeNumber(){ TypeBase.apply(this, arguments); }
TypeStore.type.number.prototype = Object.create(TypeBase.prototype);
TypeStore.type.number.prototype.typeDbPg='double precision';
TypeStore.type.number.prototype.typedControlName='number';
TypeStore.type.number.prototype.pgSpecialParse=false;
TypeStore.type.number.prototype.inexactNumber=true;
TypeStore.type.number.prototype.pg_OID=701;
TypeStore.type.number.prototype.toPlainString=function toPlainString(typedValue){
    return typedValue.toString();
};
TypeStore.type.number.prototype.toHtml=function toHtmlNumber(typedValue){
    var str = this.toPlainString(typedValue);
    var rta = [];
    str.replace(/^([-+]?[0-9 ]*)((\.)([0-9 ]*))?$/, function(str, left, dotPart, dot, decimals){
        left.replace(/^([-+]?)([0-9]?[0-9]?)(([0-9][0-9][0-9])*)$/, function(str, sign, prefix, triplets){
            if(sign=='-'){
                rta.push(html.span({class: "number_sign"}, sign));
            }
            if(prefix){
                rta.push(html.span({"class": "number_miles"}, prefix));
            }
            triplets.replace(/[0-9][0-9][0-9]/g,function(triplet){
                rta.push(html.span({"class": "number_miles"}, triplet));
            });
        });
        if(dot){
            rta.push(html.span({"class": "number_dot"},dot));
        }
        if(decimals){
            rta.push(html.span({"class": "number_decimals"},decimals));
        }
    });
    return html.span({"class": "number"}, rta);
};
TypeStore.type.number.prototype.validateTypedData=function validateTypedData(typedData){
    return typedData==null || typeof typedData === 'number' || typedData instanceof Big;
};

TypeStore.type.hugeint = function TypeHugint(){ TypeStore.type.number.apply(this, arguments); }
TypeStore.type.hugeint.prototype=Object.create(TypeStore.type.number.prototype);
TypeStore.type.hugeint.prototype.maxBig= 1000000000000000;
TypeStore.type.hugeint.prototype.minBig=-1000000000000000;
TypeStore.type.hugeint.prototype.typeDbPg='numeric(1000)';
TypeStore.type.hugeint.prototype.pgSpecialParse=true;
// TypeStore.type.hugeint.prototype.pg_OID:1700,
TypeStore.type.hugeint.prototype.fromString=function fromString(textWithHugeInt){
    var self = this;
    var number = Number(textWithHugeInt);
    if('maxValue' in self && number>self.maxValue || 'minValue' in self && number<self.minValue){
        throw new TypeError("type-store: value out of range")
    }
    if(number<self.minBig || number>self.maxBig){
        number = new TypeStore.class.Big(textWithHugeInt, self.typeName);
    }
    self.setTypeInfo(number);
    return number;
};

TypeStore.type.integer=function TypeInteger(){ TypeStore.type.hugeint.apply(this,arguments); }
TypeStore.type.integer.prototype=Object.create(TypeStore.type.hugeint.prototype);
TypeStore.type.integer.prototype.maxValue= 2147483647;
TypeStore.type.integer.prototype.minValue= -2147483648;
TypeStore.type.integer.prototype.typeDbPg='integer';
TypeStore.type.integer.prototype.pgSpecialParse=false;
TypeStore.type.integer.prototype.pg_OID=23;

TypeStore.type.bigint=function TypeBigint(){ TypeStore.type.hugeint.apply(this,arguments); }
TypeStore.type.bigint.prototype=Object.create(TypeStore.type.hugeint.prototype);
TypeStore.type.bigint.prototype.maxValue= 9223372036854775807;
TypeStore.type.bigint.prototype.minValue= -9223372036854775808;
TypeStore.type.bigint.prototype.typeDbPg='bigint';
TypeStore.type.bigint.prototype.pg_OID=20;

TypeStore.type.decimal=function TypeDecimal(){ TypeStore.type.number.apply(this,arguments); }
TypeStore.type.decimal.prototype=Object.create(TypeStore.type.number.prototype);
TypeStore.type.decimal.prototype.maxBigLength= 10,
TypeStore.type.decimal.prototype.typeDbPg='numeric';
TypeStore.type.decimal.prototype.typedControlName='number';
TypeStore.type.decimal.prototype.pgSpecialParse=true;
TypeStore.type.decimal.prototype.pg_OID=1700;
TypeStore.type.decimal.prototype.fromString= function fromString(textWithValue){
    var self = this;
    var number = Number(textWithValue);
    if(isNaN(number) && typeof textWithValue == "string"){
        textWithValue = textWithValue.replace(',','.');
        number = Number(textWithValue);
    }
    if(!typeof textWithValue=="string" 
      || textWithValue.length>self.maxBigLength 
      || !/\./.test(textWithValue) && number.toString()!==textWithValue
    ){
        number = new TypeStore.class.Big(textWithValue, self);
    }
    self.setTypeInfo(number);
    return number;
};

TypeStore.type["ARRAY:text"] = function TypeArrayText(){ TypeBase.apply(this, arguments); }
TypeStore.type["ARRAY:text"].prototype = Object.create(TypeBase.prototype);
TypeStore.type["ARRAY:text"].prototype.typeDbPg='text[]';
TypeStore.type["ARRAY:text"].prototype.validateTypedData=function validateARRAY__Text(anyValue){
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
};
TypeStore.type["ARRAY:text"].prototype.fromString=function fromString(stringWithArrayText){
    return stringWithArrayText.split(/\s*;\s*/g).map(function(text){ return text.trim(); });
};
TypeStore.type["ARRAY:text"].prototype.toPlainString=function toPlainString(typedValue){
    return typedValue.join(';');
};
TypeStore.type["ARRAY:text"].prototype.toHtml=function toHtmlArray(typedValue){
    var x=[];
    typedValue.forEach(function(element, i){
        if(i){
            x.push(html.span({class:'array-separator'},';'));
        }
        x.push(html.span({class:'array-element'},element));
    });
    return html.span({class:'array'}, x);
};

TypeStore.type.jsonb = function TypeArrayText(){ TypeBase.apply(this, arguments); }
TypeStore.type.jsonb.prototype = Object.create(TypeBase.prototype);
TypeStore.type.jsonb.prototype.typeDbPg='jsonb';
TypeStore.type.jsonb.prototype.pgSpecialParse=true;
TypeStore.type.jsonb.prototype.pg_OID=3802;
TypeStore.type.jsonb.prototype.fromString=function fromString(stringWithJsonb){
    return JSON.parse(stringWithJsonb);
};
TypeStore.type.jsonb.prototype.validateTypedData=function validateTypedData(object){
    return object===null || object instanceof Object;
};
TypeStore.type.jsonb.prototype.toPlainString=function toPlainString(typedValue){
    return JSON.stringify(typedValue);
};
TypeStore.type.jsonb.prototype.toHtml=function toHtml(typedValue){
    var self=this;
    if(typedValue instanceof Array){
        var rta=[html.span({class:'json-array-delimiter'},'[')];
        typedValue.forEach(function(element,i){
            if(i){
                rta.push(html.span({class:'json-array-separator'},','));
            }
            rta.push(html.span({class:'json-array-element'},self.toHtml(element)));
        });
        rta.push(html.span({class:'json-array-delimiter'},']'));
        return html.span({class:'json-array'},rta);
    }else if(typedValue instanceof Object){
        var rta=[html.span({class:'json-object-delimiter'},'{')];
        var i=0;
        likeAr(typedValue).forEach(function(element,key){
            if(i++){
                rta.push(html.span({class:'json-object-separator'},','));
            }
            rta.push(html.span({class:'json-object-key'},JSON.stringify(key)));
            rta.push(html.span({class:'json-object-separator'},':'));
            rta.push(html.span({class:'json-object-element'},self.toHtml(element)));
        });
        rta.push(html.span({class:'json-object-delimiter'},'}'));
        return html.span({class:'json-object'},rta);
    }else{
        return html.span({class:'json-'+typeof typedValue},JSON.stringify(typedValue)||typedValue+'');
    }
};

TypeStore.type.interval = function TypeArrayText(){ TypeBase.apply(this, arguments); }
TypeStore.type.interval.prototype = Object.create(TypeBase.prototype);
TypeStore.type.interval.prototype.typeDbPg='interval';
TypeStore.type.interval.prototype.pgSpecialParse=true;
TypeStore.type.interval.prototype.pg_OID=1186;
TypeStore.type.interval.prototype.partDefs=[
    {name:'years'  , optative:true , sufix:'Y '},
    {name:'months' , optative:true , sufix:'M '},
    {name:'days'   , optative:true , sufix:'D '},
    {name:'hours'  , optative:false, sufix:':' },
    {name:'minutes', optative:false, sufix:':' , twoDigits:true },
    {name:'seconds', optative:false, sufix:''  , twoDigits:true },
];
// constructorFunction:new PostgresInterval().constructor,
TypeStore.type.interval.prototype.regExp=/^(?:(\d+)\s*(?:y|years?|años?|ann?i?os?))?\s*(?:(\d+)\s*(?:m|months?|mese?s?))?\s*(?:(\d+)\s*(?:d|days?|días?|dias?))?\s*(?:(\d+)\s*(?:h|:|hours?|horas?))?\s*(?:(\d+)\s*(?:m|:|'|min|minutes?|minutos?)?)?\s*(?:(\d+)\s*(?:s|"|sec|seg|seconds?|segundos?)?)?\s*?$/i,
TypeStore.type.interval.prototype.fromString=function fromString(stringWithInterval, typeInfo){
    var self = this;
    typeInfo = typeInfo || this;
    if(!isNaN(stringWithInterval)){
        if(!typeInfo.timeUnit){
            throw new TypeError('NOT timeInterval');
        }
        stringWithInterval=stringWithInterval+typeInfo.timeUnit;
    }
    var matches=stringWithInterval.match(self.regExp);
    if(!matches) return null;
    var interval={};
    self.partDefs.forEach(function(partDef, i){
        if(matches[i+1]){
            interval[partDef.name]=Number(matches[i+1]);
        }
    });
    return bestGlobals.timeInterval(interval);
};
TypeStore.type.interval.prototype.validateTypedData=function validateTypedData(object){
    return object===null || object instanceof bestGlobals.TimeInterval;
    // return object===null || object instanceof TypeStore.type.interval.constructorFunction;
};
TypeStore.type.interval.prototype.toPlainString=function toPlainString(typedValue){
    return typedValue.toPlainString();
    /*
    var module = TypeStore.type.interval;
    var t = module.partDefs.map(function(partDef, i){
        var value=typedValue[partDef.name]||0;
        if(!partDef.optative && (typedValue.hours>0||typedValue.minutes>0||typedValue.seconds>0) || value){
            return (partDef.twoDigits && value<10?'0':'')+value+partDef.sufix;
        }
    }).join('').trim();
    return t;
    */
};

TypeStore.type.timestamp = function TypeTimestamp(){ TypeBase.apply(this, arguments); }
TypeStore.type.timestamp.prototype = Object.create(TypeBase.prototype);
TypeStore.type.timestamp.prototype.typeDbPg='timestamp';
TypeStore.type.timestamp.prototype.pgSpecialParse=true;
TypeStore.type.timestamp.prototype.pg_OID=1114;
// constructorFunction:new PostgresInterval().constructor,
TypeStore.type.timestamp.prototype.fromString=function fromString(text, typeInfo){
    return bestGlobals.datetime.iso(text);
},
TypeStore.type.timestamp.prototype.validateTypedData=function validateTypedData(object){
    return object===null || object instanceof bestGlobals.Datetime;
},
TypeStore.type.timestamp.prototype.toPlainString=function toPlainString(typedValue){
    return typedValue.toYmdHmsM();
},

/*
Interval.prototype.toLiteral=function(){
    return this.toString();
};
*/
// PostgresInterval.prototype.typeStore={type:'interval'};

json4all.addType(bestGlobals.TimeInterval,{
    construct: function construct(value){ 
        return new bestGlobals.TimeInterval(value); 
    }, 
    deconstruct: function deconstruct(o){
        return o.timeInterval;
    },
});

json4all.addType(bestGlobals.Datetime,{
    construct: function construct(value){ 
        return new bestGlobals.Datetime(value); 
    }, 
    deconstruct: function deconstruct(o){
        return o.parts;
    },
});

json4all.addType(Big,{
    construct: function construct(value){ 
        return new Big(value); 
    }, 
    deconstruct: function deconstruct(o){
        return o.toString();
    },
});

// bestGlobals.registerJson4All(json4all);

likeAr(TypeStore.type).forEach(function(typeDef, typeName){
    typeDef.prototype.typeName = typeName;
    json4all.addType(typeName,{
        construct: function construct(value){ 
            return new bestGlobals.TimeInterval(value); 
        }, 
        deconstruct: function deconstruct(o){
            return o.timeInterval;
        },
    });
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
