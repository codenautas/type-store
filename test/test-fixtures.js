"use strict";

var bestGlobals = require('best-globals');
var discrepances = require('discrepances');
var assert = require('assert');
var likeAr = require('like-ar');
var TypeStore = require("../type-store.js");
var Big = require('big.js');
var json4all = require('json4all');

function ignoreTypeInfoAndThrow(obtained, expected){
    if(expected instanceof Object && !('typeInfo' in expected) && ('typeInfo' in obtained)){
        expected.typeInfo=obtained.typeInfo;
    }
    if(obtained instanceof Object && ('typeInfo' in expected) && !('typeInfo' in obtained)){
        obtained.typeInfo=expected.typeInfo;
    }
    discrepances.showAndThrow(obtained, expected);
}

describe("fixtures", function(){
  [
      {typeName:'hugeint', fixtures:[
      ]},
      {typeName:'integer', fixtures:[
          {fromString:'-646', value:-646, toHtmlText:"<span class=number><span class='number-sign'>-</span><span class='number-miles'>646</span></span>"},
          {fromString:'2147483648',
           fromStringError:new TypeError ('type-store: value out of range')
          }
      ]},
      {typeName:'decimal', fixtures:[
          {fromString:'2147483646', value:2147483646, toHtmlText:"<span class=number><span class='number-miles'>2</span><span class='number-separator'></span><span class='number-miles'>147</span><span class='number-separator'></span><span class='number-miles'>483</span><span class='number-separator'></span><span class='number-miles'>646</span></span>"},
          {fromString:'2,3', value:2.3, toPlainString:'2.3', toHtmlText:"<span class=number><span class='number-miles'>2</span><span class='number-dot'>.</span><span class='number-decimals'>3</span></span>"},
          {fromString:'2147483648.010000000001', toPlainString:'2147483648.010000000001', value:new Big('2147483648.010000000001')}
      ]},
      {typeName:'ARRAY:text', fixtures:[
          {fromString:'a;b;cc', toPlainString:'a;b;cc', value:['a','b','cc']},
          {fromString:'a;b', toHtmlText:"<span class=array><span class='array-element'>a</span><span class='array-separator'>;</span><span class='array-element'>b</span></span>"},
      ], invalidValues:[7 , [7]]},
      {typeName:'jsonb', fixtures:[
          {fromString:'{"a": "b"}', toPlainString:'{"a":"b"}', value:{a:'b'}},
          {value:[undefined, null, 'hi', {a:7, b:false}], 
           toHtmlText:"<span class='json-array'><span class='json-array-delimiter'>[</span><span class='json-array-element'><span class='json-undefined'>undefined</span></span><span class='json-array-separator'>,</span><span class='json-array-element'><span class='json-object'>null</span></span><span class='json-array-separator'>,</span><span class='json-array-element'><span class='json-string'>&quot;hi&quot;</span></span><span class='json-array-separator'>,</span><span class='json-array-element'><span class='json-object'><span class='json-object-delimiter'>{</span><span class='json-object-key'>&quot;a&quot;</span><span class='json-object-separator'>:</span><span class='json-object-element'><span class='json-number'>7</span></span><span class='json-object-separator'>,</span><span class='json-object-key'>&quot;b&quot;</span><span class='json-object-separator'>:</span><span class='json-object-element'><span class='json-boolean'>false</span></span><span class='json-object-delimiter'>}</span></span></span><span class='json-array-delimiter'>]</span></span>"
          },
      ]},
      {typeName:'interval', fixtures:[
          {fromString:'13:40:00', toPlainString:'13:40:00', construct:{hours:13, minutes:40, seconds:0}},
          {fromString:"3:30"    , toPlainString:'3:30:00' , construct:{hours:3, minutes:30}},
          {fromString:"13h20'"  , toPlainString:'13:20:00', construct:{hours:13, minutes:20}},
          {fromString:'1D'      , toPlainString:'1D'      , construct:{days:1}, toHtmlText:'<span class=interval>1D</span>'},
          {fromString:'1D 10h'  , toPlainString:'1D 10:00:00', construct:{days:1, hours:10}},
          {fromString:'4'       , fromStringError:new TypeError('NOT timeInterval')},
      ], constructorFunction:bestGlobals.timeInterval},
      {typeName:'interval', describeFixtures:'with unit', timeUnit:'hours', fixtures:[
          {fromString:'5'       , toPlainString:'5:00:00'},
      ]},
      {typeName:'timestamp', fixtures:[
          {fromString:'2017-12-23 13:40:00', toPlainString:'2017-12-23 13:40:00.000', value:bestGlobals.datetime.iso('2017-12-23 13:40:00')},
          {fromString:'4'       , fromStringError:new Error('invalid datetime')},
      ], constructorFunction:bestGlobals.datetime},
  ].forEach(function(typeDef){
    if(!typeDef.skip){
      describe(typeDef.typeName+' '+(typeDef.describeFixtures||''), function(){
        var typeActual = new TypeStore.type[typeDef.typeName]();
        likeAr(typeDef).forEach(function(value, attr){
            typeActual[attr]=value;
        });
        typeDef.fixtures.forEach(function(fixture){
          if(!fixture.skip){
            it("accept \""+fixture.fromString+"\"", function(){
              if(fixture.fromStringError){
                try{
                  var obtainedFromString = typeActual.fromString(fixture.fromString);
                }catch(err){
                  var obtainedError = err;
                }
                discrepances.showAndThrow(obtainedError, fixture.fromStringError);
              }else{
                var obtainedFromString;
                var obtainedFromConstructor;
                var obtained;
                if('fromString' in fixture){
                    obtained = obtainedFromString = typeActual.fromString(fixture.fromString);
                }
                if('construct' in fixture){
                    obtainedFromConstructor = typeDef.constructorFunction(fixture.construct);
                    obtained = obtainedFromConstructor;
                }
                typeActual.validateTypedData(null);
                typeActual.validateTypedData(obtained);
                if('fromString' in fixture && 'construct' in fixture){
                    discrepances.showAndThrow(obtainedFromString, obtainedFromConstructor);
                }
                if('value' in fixture){
                    if('fromString' in fixture || 'construct' in fixture){
                        ignoreTypeInfoAndThrow(obtained, fixture.value);
                    }else{
                        obtained = fixture.value;
                    }
                }
                try{
                    var jsonText=json4all.stringify(obtained);
                    var jsonObtained=json4all.parse(jsonText);
                    ignoreTypeInfoAndThrow(jsonObtained, obtained);
                }catch(err){
                    console.log('value', obtained);
                    console.log('jsonObtained', jsonObtained);
                    console.log('jsonText', jsonText);
                    throw err;
                }
                if('toPlainString' in fixture){
                    var obtainedOutput=typeActual.toPlainString(obtained);
                    discrepances.showAndThrow(obtainedOutput, fixture.toPlainString);
                }
                if('toHtmlText' in fixture){
                    var obtainedOutput=typeActual.toHtmlText(obtained);
                    discrepances.showAndThrow(obtainedOutput, fixture.toHtmlText);
                }
              }
            });
          }
        });
        (typeDef.invalidValues||[]).forEach(function(invalidValue){
            it("reject \""+invalidValue+"\"", function(){
                var obtained;
                try{
                    typeActual.validateTypedData(invalidValue);
                }catch(err){
                    obtained=err;
                }
                discrepances.showAndThrow(obtained instanceof Error,true);
                if(!/No[nt] an? /.test(obtained.message)){
                    discrepances.showAndThrow(obtained.message,"/No[nt] an? /");
                }
            });
        });
      });
    }
  });
});