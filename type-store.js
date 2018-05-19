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

TypeStore.options={};

TypeStore.i18n={messages:{}, locale:{}};

TypeStore.i18n.messages.en={
    boolean:{
        true:'yes',
        false:'no',
        null:''
    },
};

TypeStore.i18n.messages.es={
    boolean:{
        true:'sí',
        false:'no',
        null:''
    },
};

TypeStore.i18n.locale.en={
    align:'left',
    number:{
        align:'right',
        decimalSeparator:'.',
        milesSeparator:','
    },
    datetime:{
        dateSeparator:'-',
        partsOrder:['month','day','year'],
    }
};

TypeStore.i18n.locale.es=changing(TypeStore.i18n.locale.en,{
    number:{
        decimalSeparator:',',
        milesSeparator:'.'
    },
    datetime:{
        dateSeparator:'/',
        partsOrder:['day','month','year'],
    }
});

var currentLang = 'en';

TypeStore.messages = TypeStore.i18n.messages[currentLang];
TypeStore.locale   = TypeStore.i18n.locale  [currentLang];

Big.prototype.sameValue=function(other){
    if(typeof other === 'number'){
        other = new TypeStore.class.Big(other);
    }
    return other instanceof Big && this.toString() == other.toString();
};

Big.prototype.toPostgres = function toPostgres(){
    return this.toString();
};

TypeStore.class.Big = function TypeStoreBig(x, typeInfo){
    Big.call(this,x);
    //this.typeInfo = typeInfo;
};
TypeStore.class.Big.prototype = Object.create(Big.prototype);
TypeStore.class.Big.prototype.toLiteral=function(){
    return this.toString();
};

function TypeBase(typeInfo){
    this.typeInfo=typeInfo||{};
    this.typeInfo.typeName=this.typeInfo.typeName||this.typeName;
}
TypeBase.prototype.rejectedChar = function rejectedChar(char, position){
    return false;
};
TypeBase.prototype.setTypeInfo = function setTypeInfo(value){
    if(value instanceof Object){
        //value.typeInfo=this;
    }
};
TypeBase.prototype.toHtmlText = function toHtmlText(value){
    return this.toHtml(value).toHtmlText();
};
TypeBase.prototype.toHtml=function toHtml(typedValue){
    var typer=this;
    if(this.toLocalParts){
        return this.toLocalParts(
            typedValue,
            function Part(part, className, skippable){
                var attr={class:className};
                if(skippable && TypeStore.options.doNotCopyNonCopyables){
                    attr["non-copyable"]=part;
                    part='';
                }
                return html.span(attr, part);
            },
            function Parts(parts, className){
                return html.span({class:className}, parts);
            }
        );
    }else{
        var x=this.toPlainString(typedValue);
        return html.span({class:this.typeName}, x);
    }
};
/* istanbul ignore next */
TypeBase.prototype.toExcelValue=function toExcelValue(typedValue){
    return this.toPlainString(typedValue);
};
/* istanbul ignore next */
TypeBase.prototype.toExcelType=function toExcelType(typedValue){
    return 's';
};
/* istanbul ignore next */
TypeBase.prototype.fromExcelCell=function fromExcelCell(cell){
    return this.fromString(cell.w);
};
TypeBase.prototype.toPlainJson=function toPlainJson(typedValue){
    return this.toPlainString(typedValue);
};
TypeBase.prototype.fromPlainJson=function fromPlainJson(textOrNumberOrBoolean){
    // para Number y Boolean se redefinirán en sus propios tipos
    return this.fromString(textOrNumberOrBoolean);
};
TypeBase.prototype.typedControlName='FROM:type-store';
/* istanbul ignore next */
TypeBase.prototype.isValidTypedData=function isValidTypedData(typedData){
    throw new Error('isValidTypedData not defined for type '+this.constructor.name)
};
TypeBase.prototype.whyTypedDataIsInvalid=function whyTypedDataIsInvalid(typedData){
    if(!this.isValidTypedData(typedData)){
        return 'not a '+this.typeName+' in input';
    }
    return null;
};
TypeBase.prototype.validateTypedData=function validateTypedData(typedData){
    var why=this.whyTypedDataIsInvalid(typedData);
    if(why){
        throw new Error(why);
    }
    return true;
};
TypeBase.prototype.toLocalString=function toLocalString(typedValue){
    if(this.toLocalParts){
        return this.toLocalParts(
            typedValue,
            function Part(part, className, skippable){
                if(skippable && TypeStore.options.doNotOutputNonCopyables){
                    return '';
                }
                return part;
            },
            function Parts(parts){return parts.join('');}
        );
    }else{
        return this.toPlainString(typedValue);
    }
};
TypeBase.prototype.fromLocalString=function fromLocalString(textWithLocalValue){
    return this.fromString(textWithLocalValue);
};
TypeBase.prototype.isValidLocalString=function isValidLocalString(textWithLocalValue){
    try{
        var typedValue = this.fromLocalString(textWithLocalValue);
        this.validateTypedData(typedValue);
        return true;
    }catch(err){
        return false;
    }
};
/* istanbul ignore next */
TypeBase.prototype.getDomFixtures=function getDomFixtures(){
    return [
        {tagName:'div', attributes:{}},
        {tagName:'input', attributes:{type:'text'}}
    ];
};
TypeBase.prototype.emptyValue=null;
Object.defineProperty(TypeBase.prototype, 'align', {
    get: function(){ return TypeStore.locale.align; }
});

TypeStore.type.boolean = function TypeBoolean(){ TypeBase.apply(this, arguments); };
TypeStore.type.boolean.prototype = Object.create(TypeBase.prototype);
TypeStore.type.boolean.prototype.typeDbPg='boolean';
TypeStore.type.boolean.prototype.typedControlName='boolean';
TypeStore.type.boolean.prototype.pgSpecialParse=false;
TypeStore.type.boolean.prototype.toPlainString=function toPlainString(typedValue){
    return typedValue+'';
};
TypeStore.type.boolean.prototype.fromString=function fromString(textWithValue){
    var falseInitials={'n':true,'N':true,'0':true,'2':true,'F':true,'f':true,'\u043d':true,'\u041d':true,'\u0147':true,'\u0148':true};
    return !falseInitials[textWithValue[0]];
};
TypeStore.type.boolean.prototype.toLocalString=function toLocalString(typedValue){
    return TypeStore.messages.boolean[typedValue];
};
TypeStore.type.boolean.prototype.toPlainJson=function toPlainJson(typedValue){
    return typedValue;
};
TypeStore.type.boolean.prototype.fromPlainJson=function fromPlainJson(textOrNumberOrBoolean){
    return textOrNumberOrBoolean;
};
TypeStore.type.boolean.prototype.toHtml=function toHtmlBoolean(typedValue){
    return html.span({"class": "boolean"},[html.span({"class": "boolean-"+typedValue},this.toLocalString(typedValue))]);
};
TypeStore.type.boolean.prototype.isValidTypedData=function isValidTypedData(typedData){
    return typedData==null || typeof typedData === 'boolean';
};

TypeStore.type.text = function TypeText(typeInfo){ TypeBase.apply(this, arguments); };
TypeStore.type.text.prototype = Object.create(TypeBase.prototype);
TypeStore.type.text.prototype.typeDbPg='text';
TypeStore.type.text.prototype.typedControlName='text';
TypeStore.type.text.prototype.pgSpecialParse=false;
TypeStore.type.text.prototype.toPlainString=function toPlainString(typedValue){
    return typedValue;
};
TypeStore.type.text.prototype.fromString=function fromString(textWithValue){
    return textWithValue;
};
TypeStore.type.text.prototype.fromLocalString=function fromLocalString(textWithValue){
    if(this.typeInfo.toUpperWithoutDiacritics){
        return textWithValue.toUpperCase()
            .replace(/[áÁàÀ]/g,'A')
            .replace(/[éÉèÈ]/g,'E')
            .replace(/[íÍìÌ]/g,'I')
            .replace(/[óÓòÒ]/g,'O')
            .replace(/[úÚùÙüÜ]/g,'U')
            .replace(/[ñ]/g,'Ñ')
            .replace(/[^A-Z0-9_]/g,'_')
    }
    return textWithValue;
};
TypeStore.type.text.prototype.toHtml=function toHtmlText(typedValue){
    var answer=typedValue;
    if(typedValue===''){
        answer=html.span({"class": "text-empty"});
    }
    if(typedValue==null){
        answer=html.span({"class": "text-null"});
    }
    return html.span({"class": "text"}, answer);
};
TypeStore.type.text.prototype.rejectedChar = function rejectedChar(char, position){
    return !!this.typeInfo.acceptedChars && !this.typeInfo.acceptedChars.test(char);
};
TypeStore.type.text.prototype.isValidTypedData=function isValidTypedData(typedData){
    return this.whyTypedDataIsInvalid(typedData)==null;
};
TypeStore.type.text.prototype.whyTypedDataIsInvalid=function isValidTypedData(typedData){
    if(typedData==null || typeof typedData === 'string'){
        if(!this.typeInfo.allowEmptyText && typedData===''){
            return 'text cannot be empty';
        }else{
            return null;
        }
    }
    return 'not a text in input';
};
Object.defineProperty(TypeStore.type.text.prototype, 'emptyValue',{
    get:function(){ return this.typeInfo.allowEmptyText && !this.typeInfo.nullable?'':null; }
});

TypeStore.typeNumber = function TypeNumber(){ TypeBase.apply(this, arguments); };
TypeStore.typeNumber.prototype = Object.create(TypeBase.prototype);
TypeStore.typeNumber.prototype.typedControlName='number';
TypeStore.typeNumber.prototype.rejectedChar=function rejectedChar(char, position){
    return (
        !(/\d/.test(char)) && 
        (char!=='.' || this.isInteger) &&
        (char!==TypeStore.locale.number.decimalSeparator || this.isInteger) &&
        (char!=='-' || this.minValue>=0)
    )===true;
};
TypeStore.typeNumber.prototype.pgSpecialParse=false;
TypeStore.typeNumber.prototype.inexactNumber=true;
TypeStore.typeNumber.prototype.pg_OID=701;
TypeStore.typeNumber.prototype.toPlainString=function toPlainString(typedValue){
    return typedValue.toString();
};
TypeStore.typeNumber.prototype.toPlainJson=function toPlainJson(typedValue){
    return typedValue;
};
TypeStore.typeNumber.prototype.fromPlainJson=function fromPlainJson(textOrNumberOrBoolean){
    return textOrNumberOrBoolean;
};
TypeStore.typeNumber.prototype.toLocalParts=function toLocalParts(typedValue,fPart,fParts){
    var str = this.toPlainString(typedValue);
    var rta = [];
    str.replace(/^([-+]?[0-9 ]+)((\.)([0-9 ]*))?$/, function(str, left, dotPart, dot, decimals){
        left.replace(/^([-+]?)([0-9][0-9]?[0-9]?)(([0-9][0-9][0-9])*)$/, function(str, sign, prefix, triplets){
            if(sign=='-'){
                rta.push(fPart(sign,"number-sign"));
            }
            rta.push(fPart(prefix,"number-miles"));
            triplets.replace(/[0-9][0-9][0-9]/g,function(triplet,a,b,c){
                rta.push(fPart(TypeStore.locale.number.milesSeparator,"number-separator",true));
                rta.push(fPart(triplet,"number-miles"));
            });
        });
        if(dot){
            rta.push(fPart(TypeStore.locale.number.decimalSeparator,"number-dot"));
        }
        if(decimals){
            rta.push(fPart(decimals,"number-decimals"));
        }
    });
    return fParts(rta,"number");
};
TypeStore.typeNumber.prototype.isValidTypedData=function isValidTypedData(typedData){
    return typedData==null || typeof typedData === 'number' || typedData instanceof Big;
};
TypeStore.typeNumber.prototype.fromLocalString=function fromLocalString(textWithLocalValue){
    return this.fromString(textWithLocalValue.replace(new RegExp("\\"+TypeStore.locale.number.milesSeparator.split('').join('\\'),'g'),''));
};
TypeStore.typeNumber.prototype.toExcelType=function toExcelType(typedValue){
    return 'n';
};
//TypeStore.typeNumber.prototype.getDomFixtures = function getDomFixtures(){
//    return TypeBase.prototype.getDomFixtures.call(this).concat({tagName:'input', attributes:{type:'number'}});
//}
Object.defineProperty(TypeStore.typeNumber.prototype, 'align', {
    get: function(){ return TypeStore.locale.number.align; }
});

TypeStore.type.double = function TypeDouble(){ TypeStore.typeNumber.apply(this, arguments); };
TypeStore.type.double.prototype=Object.create(TypeStore.typeNumber.prototype);
TypeStore.type.double.prototype.typeDbPg='double precision';
TypeStore.type.double.prototype.fromString=function fromString(textWithNumber){
    var answer = Number(textWithNumber);
    if(isNaN(answer) && typeof textWithNumber == "string" && /^\s*\d+,\d+\s*$/.test(textWithNumber)){
        return Number(textWithNumber.replace(',','.'));
    }else{
        return answer;
    }
};

TypeStore.type.hugeint = function TypeHugint(){ TypeStore.typeNumber.apply(this, arguments); };
TypeStore.type.hugeint.prototype=Object.create(TypeStore.typeNumber.prototype);
TypeStore.type.hugeint.prototype.maxBig= 1000000000000000;
TypeStore.type.hugeint.prototype.minBig=-1000000000000000;
TypeStore.type.hugeint.prototype.isInteger=true;
TypeStore.type.hugeint.prototype.typeDbPg='numeric(1000)';
TypeStore.type.hugeint.prototype.pgSpecialParse=true;
// TypeStore.type.hugeint.prototype.pg_OID:1700,
TypeStore.type.hugeint.prototype.fromString=function fromString(textWithHugeInt){
    var self = this;
    var number = Number(textWithHugeInt);
    if('maxValue' in self && number>self.maxValue || 'minValue' in self && number<self.minValue){
        throw new TypeError("type-store: value out of range");
    }
    if(number<self.minBig || number>self.maxBig){
        number = new TypeStore.class.Big(textWithHugeInt, self.typeName);
    }
    self.setTypeInfo(number);
    return number;
};
TypeStore.type.hugeint.prototype.toPlainJson=TypeBase.prototype.toPlainJson;
TypeStore.type.hugeint.prototype.fromPlainJson=TypeBase.prototype.fromPlainJson;
TypeStore.type.integer=function TypeInteger(){ TypeStore.type.hugeint.apply(this,arguments); };
TypeStore.type.integer.prototype=Object.create(TypeStore.type.hugeint.prototype);
TypeStore.type.integer.prototype.maxValue= 2147483647;
TypeStore.type.integer.prototype.minValue= -2147483648;
TypeStore.type.integer.prototype.typeDbPg='integer';
TypeStore.type.integer.prototype.pgSpecialParse=false;
TypeStore.type.integer.prototype.pg_OID=23;

TypeStore.type.bigint=function TypeBigint(){ TypeStore.type.hugeint.apply(this,arguments); };
TypeStore.type.bigint.prototype=Object.create(TypeStore.type.hugeint.prototype);
TypeStore.type.bigint.prototype.maxValue= 9223372036854775807;
TypeStore.type.bigint.prototype.minValue= -9223372036854775808;
TypeStore.type.bigint.prototype.typeDbPg='bigint';
TypeStore.type.bigint.prototype.pg_OID=20;

TypeStore.type.decimal=function TypeDecimal(){ TypeStore.typeNumber.apply(this,arguments); };
TypeStore.type.decimal.prototype=Object.create(TypeStore.typeNumber.prototype);
TypeStore.type.decimal.prototype.maxBigLength= 10;
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
    if(typeof textWithValue!=="string" ||
      textWithValue.length>self.maxBigLength ||
      !/\./.test(textWithValue) && number.toString()!==textWithValue
    ){
        number = new TypeStore.class.Big(textWithValue, self);
    }
    self.setTypeInfo(number);
    return number;
};
TypeStore.type.decimal.prototype.fromExcelCell=function fromExcelCell(cell){
    return cell.v?(cell.t === 'n')?this.fromString(cell.v):cell.v.replace(/,/g, '.'):null;
};
TypeStore.type["ARRAY:text"] = function TypeArrayText(){ TypeBase.apply(this, arguments); };
TypeStore.type["ARRAY:text"].prototype = Object.create(TypeBase.prototype);
TypeStore.type["ARRAY:text"].prototype.typeDbPg='text[]';
TypeStore.type["ARRAY:text"].prototype.isValidTypedData=function isValidTypedData(typedData){
    return this.whyTypedDataIsInvalid(typedData)==null;
};
TypeStore.type["ARRAY:text"].prototype.whyTypedDataIsInvalid=function whyTypedDataIsInvalid(anyValue){
    if(anyValue!=null){
        if(!(anyValue instanceof Array)){
            return "Non an Array in type-store ARRAY:text";
        }else{
            return anyValue.reduce(function(accum, anyElement, i){
                if(accum){
                    return accum;
                }
                if(typeof anyElement!=='string'){
                    return "Non a string in type-store ARRAY:text["+i+"]";
                }else{
                    return null;
                }
            },null);
        }
    }
    return null;
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

TypeStore.type.jsonb = function TypeArrayJsonb(){ TypeBase.apply(this, arguments); };
TypeStore.type.jsonb.prototype = Object.create(TypeBase.prototype);
TypeStore.type.jsonb.prototype.typeDbPg='jsonb';
TypeStore.type.jsonb.prototype.pgSpecialParse=true;
TypeStore.type.jsonb.prototype.pg_OID=3802;
TypeStore.type.jsonb.prototype.fromString=function fromString(stringWithJsonb){
    return JSON.parse(stringWithJsonb);
};
TypeStore.type.jsonb.prototype.isValidTypedData=function isValidTypedData(object){
    return object===null || object instanceof Object;
};
TypeStore.type.jsonb.prototype.toPlainString=function toPlainString(typedValue){
    return JSON.stringify(typedValue);
};
TypeStore.type.jsonb.prototype.toHtml=function toHtml(typedValue){
    var innerPart;
    var self=this;
    if(typedValue instanceof Array){
        innerPart=[html.span({class:'json-array-delimiter'},'[')];
        typedValue.forEach(function(element,i){
            if(i){
                innerPart.push(html.span({class:'json-array-separator'},','));
            }
            innerPart.push(html.span({class:'json-array-element'},self.toHtml(element)));
        });
        innerPart.push(html.span({class:'json-array-delimiter'},']'));
        return html.span({class:'json-array'},innerPart);
    }else if(typedValue instanceof Object){
        innerPart=[html.span({class:'json-object-delimiter'},'{')];
        var i=0;
        likeAr(typedValue).forEach(function(element,key){
            if(i++){
                innerPart.push(html.span({class:'json-object-separator'},','));
            }
            innerPart.push(html.span({class:'json-object-key'},JSON.stringify(key)));
            innerPart.push(html.span({class:'json-object-separator'},':'));
            innerPart.push(html.span({class:'json-object-element'},self.toHtml(element)));
        });
        innerPart.push(html.span({class:'json-object-delimiter'},'}'));
        return html.span({class:'json-object'},innerPart);
    }else if(typedValue==null){
        return html.span({class:'json-null'},'null');
    }else{
        return html.span({class:'json-'+typeof typedValue},JSON.stringify(typedValue));
    }
};

TypeStore.type.date = function TypeDate(){ TypeBase.apply(this, arguments); };
TypeStore.type.date.prototype = Object.create(TypeBase.prototype);
TypeStore.type.date.prototype.typeDbPg='date';
TypeStore.type.date.prototype.fromString=function fromString(text){
    return bestGlobals.date.iso(text);
};
TypeStore.type.date.prototype.fromExcelCell=function fromExcelCell(cell){
    return cell.v?bestGlobals.date.ymd(1899,12,31).add({days: cell.v-(cell.v>60?1:0)}):null;
};
TypeStore.type.date.prototype.isValidTypedData=function isValidTypedData(typedData){
    return this.whyTypedDataIsInvalid(typedData)==null;
};
TypeStore.type.date.prototype.whyTypedDataIsInvalid=function whyTypedDataIsInvalid(object){
    if(object==null){
        return null;
    }
    if(!(object instanceof Date)){
        return 'Not a date in input';
    }
    if(!object.isRealDate){
        return 'Not a real date in input';
    }
    return null;
};
TypeStore.type.date.prototype.toPlainString=function toPlainString(typedValue){
    return typedValue.toYmd();
};
TypeStore.type.date.prototype.toExcelValue=function toExcelValue(typedValue){
    return typedValue.toYmd();
};
TypeStore.type.date.prototype.toExcelType=function toExcelType(typedValue){
    return 'd';
};
TypeStore.type.date.prototype.toLocalParts=function toLocalParts(typedValue, fPart, fParts){
    var partData={day:typedValue.getDate(),month:typedValue.getMonth()+1,year:typedValue.getFullYear()};
    var parts=[];
    TypeStore.locale.datetime.partsOrder.forEach(function(partName, i){
        if(i){
            parts.push(fPart(TypeStore.locale.datetime.dateSeparator,"date-sep"));
        }
        var part=partData[partName];
        if(partName==='year'){
            part=part.toString();
            part=fParts([fPart(part.substr(0,part.length-2),"date-century"),part.substr(part.length-2)],"date-year");
        }else{
            part=fPart(part,"date-"+partName)
        }
        parts.push(part);
    });
    return fParts(parts, "date");
};
TypeStore.type.date.prototype.fromLocalString=function fromLocalString(textWithLocalValue){
    var arr=[new Date().getFullYear(),0,0];
    var partsPositions={year:0, month:1, day:2};
    var i=0;
    textWithLocalValue.replace(/\d+/g, function(number){
        arr[partsPositions[TypeStore.locale.datetime.partsOrder[i++]]]=Number(number);
    });
    return bestGlobals.date.array(arr);
};

TypeStore.type.interval = function TypeArrayInterval(){ TypeBase.apply(this, arguments); };
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
TypeStore.type.interval.prototype.regExp=/^(?:(\d+)\s*(?:y|years?|años?|ann?i?os?))?\s*(?:(\d+)\s*(?:m|months?|mese?s?))?\s*(?:(\d+)\s*(?:d|days?|días?|dias?))?\s*(?:(\d+)\s*(?:h|:|hours?|horas?))?\s*(?:(\d+)\s*(?:m|:|'|min|minutes?|minutos?)?)?\s*(?:(\d+)\s*(?:s|"|sec|seg|seconds?|segundos?)?)?\s*?$/i;
TypeStore.type.interval.prototype.fromString=function fromString(stringWithInterval, typeInfo){
    var self = this;
    typeInfo = typeInfo || this.typeInfo;
    if(!isNaN(stringWithInterval)){
        if(!typeInfo.timeUnit){
            throw new TypeError('NOT timeInterval');
        }
        stringWithInterval=stringWithInterval+typeInfo.timeUnit;
    }
    var matches=stringWithInterval.match(self.regExp);
    /* istanbul ignore next */
    if(!matches){
        return null;
    }
    var interval={};
    self.partDefs.forEach(function(partDef, i){
        if(matches[i+1]){
            interval[partDef.name]=Number(matches[i+1]);
        }
    });
    return bestGlobals.timeInterval(interval);
};
TypeStore.type.interval.prototype.isValidTypedData=function isValidTypedData(object){
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
TypeStore.type.interval.prototype.toExcelValue=function toExcelValue(typedValue){
    return typedValue.timeInterval.ms?typedValue.timeInterval.ms/(1000*60*60*24):null;
};
TypeStore.type.interval.prototype.toExcelType=function toExcelType(typedValue){
    return 'n';
};
TypeStore.type.interval.prototype.fromExcelCell=function fromExcelCell(cell){
    return cell.v?bestGlobals.timeInterval(cell.v*1000*60*60*24).toPlainString():null;
};
TypeStore.type.timestamp = function TypeTimestamp(){ TypeBase.apply(this, arguments); };
TypeStore.type.timestamp.prototype = Object.create(TypeBase.prototype);
TypeStore.type.timestamp.prototype.typeDbPg='timestamp';
TypeStore.type.timestamp.prototype.pgSpecialParse=true;
TypeStore.type.timestamp.prototype.pg_OIDS=[1114/*,1184*/];
// constructorFunction:new PostgresInterval().constructor,
TypeStore.type.timestamp.prototype.fromString=function fromString(text){
    return bestGlobals.datetime.iso(text);
};
TypeStore.type.timestamp.prototype.isValidTypedData=function isValidTypedData(object){
    return object===null || object instanceof bestGlobals.Datetime;
};
TypeStore.type.timestamp.prototype.toPlainString=function toPlainString(typedValue){
    return typedValue.toYmdHmsM();
};

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

/*
json4all.addType(bestGlobals.Datetime,{
    construct: function construct(value){ 
        return new bestGlobals.Datetime(value); 
    }, 
    deconstruct: function deconstruct(o){
        return o.parts;
    },
});
*/

json4all.addType(Big,{
    construct: function construct(value){ 
        return new Big(value); 
    }, 
    deconstruct: function deconstruct(o){
        return o.toString();
    },
});

bestGlobals.registerJson4All(json4all);

likeAr(TypeStore.type).forEach(function(typer, typeName){
    typer.prototype.typeName = typeName;
    /* istanbul ignore next */
    if(!typer.prototype.hasOwnProperty('constructor')){
        typer.prototype.constructor = typer;
    }
    /*
    json4all.addType(typeName,{
        construct: function construct(value){ 
            return new bestGlobals.TimeInterval(value); 
        }, 
        deconstruct: function deconstruct(o){
            return o.timeInterval;
        },
    });
    */
});

/* istanbul ignore next */
TypeStore.completeTypeInfo = function(typeInfo){
    if(typeInfo.typeName in TypeStore.type){
        likeAr(TypeStore.type[typeInfo.typeName]).forEach(function(value, attr){
            if(!(attr in typeInfo)){
                typeInfo[attr]=value;
            }
        });
    }
};

TypeStore.TypeBase = TypeBase;

TypeStore.typerFrom = function typerFrom(typeInfo){
    return new TypeStore.type[typeInfo.typeName](typeInfo);
};

return TypeStore;

});