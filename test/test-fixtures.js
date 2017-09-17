"use strict";

var bestGlobals = require('best-globals');
var changing = bestGlobals.changing;
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
    before(function(){
        TypeStore.messages = changing({},TypeStore.i18n.messages.es);
        TypeStore.locale   = changing({},TypeStore.i18n.locale.es  );
    });
  [
      {typeName:'boolean', fixtures:[
          {fromString:'s', value:true , toPlainString:'true' , local:'sí', fromLocal:'s', toHtmlText:"<span class=boolean><span class='boolean-true'>sí</span></span>"},
          {fromString:'f', value:false, toPlainString:'false', local:'no', fromLocal:'N', toHtmlText:"<span class=boolean><span class='boolean-false'>no</span></span>"},
          {                value:null , toHtmlText:"<span class=boolean><span class='boolean-null'></span></span>"},
      ]},
      {typeName:'text', fixtures:[
          {fromString:'-64x6', value:'-64x6', toPlainString:'-64x6', local:'-64x6', toHtmlText:"<span class=text>-64x6</span>"},
          {                    value:null, toHtmlText:"<span class=text><span class='text-null'></span></span>"},
      ], invalidValues:[1, new Date(), /x/, {value:'', expectedError:/text cannot be empty/i}]},
      {typeName:'text', fixtures:[
          {fromString:'-64x6', value:'-64x6', toPlainString:'-64x6', local:'-64x6', toHtmlText:"<span class=text>-64x6</span>"},
          {fromString:''     , value:'', toPlainString:'', toHtmlText:"<span class=text><span class='text-empty'></span></span>"},
          {                    value:null, toHtmlText:"<span class=text><span class='text-null'></span></span>"},
      ], typeInfo:{typeName:'text', allowEmptyText:true}},
      {typeName:'hugeint', fixtures:[
      ]},
      {typeName:'integer', fixtures:[
          {fromString:'-646', value:-646, toHtmlText:"<span class=number><span class='number-sign'>-</span><span class='number-miles'>646</span></span>"},
          {fromString:'2147483648',
           fromStringError:new TypeError ('type-store: value out of range')
          }
      ], rejectChars:['.','x',' ']},
      {typeName:'decimal', fixtures:[
          {fromString:'2147483646', value:2147483646, local:'2.147.483.646', toHtmlText:"<span class=number><span class='number-miles'>2</span><span class='number-separator'>.</span><span class='number-miles'>147</span><span class='number-separator'>.</span><span class='number-miles'>483</span><span class='number-separator'>.</span><span class='number-miles'>646</span></span>"},
          {fromString:'2,3', value:2.3, toPlainString:'2.3', local:'2,3', toHtmlText:"<span class=number><span class='number-miles'>2</span><span class='number-dot'>,</span><span class='number-decimals'>3</span></span>"},
          {fromString:'2147483648.010000000001', toPlainString:'2147483648.010000000001', value:new Big('2147483648.010000000001'), local:'2.147.483.648,010000000001'}
      ], invalidValues:['x', new Date()]
      , rejectChars:['x',' ']},
      {typeName:'double', fixtures:[
          {fromString:'2.3', value:2.3, toPlainString:'2.3', local:'2,3', toHtmlText:"<span class=number><span class='number-miles'>2</span><span class='number-dot'>,</span><span class='number-decimals'>3</span></span>"},
      ], invalidValues:['9.3']},
      {typeName:'ARRAY:text', fixtures:[
          {fromString:'a;b;cc', toPlainString:'a;b;cc', value:['a','b','cc']},
          {fromString:'a;b', toHtmlText:"<span class=array><span class='array-element'>a</span><span class='array-separator'>;</span><span class='array-element'>b</span></span>"},
      ], invalidValues:[7 , [7]]},
      {typeName:'jsonb', fixtures:[
          {fromString:'{"a": "b"}', toPlainString:'{"a":"b"}', value:{a:'b'}, local:'{"a":"b"}'},
          {value:[null, null, 'hi', {a:7, b:false}], 
           toHtmlText:"<span class='json-array'><span class='json-array-delimiter'>[</span><span class='json-array-element'><span class='json-null'>null</span></span><span class='json-array-separator'>,</span><span class='json-array-element'><span class='json-null'>null</span></span><span class='json-array-separator'>,</span><span class='json-array-element'><span class='json-string'>&quot;hi&quot;</span></span><span class='json-array-separator'>,</span><span class='json-array-element'><span class='json-object'><span class='json-object-delimiter'>{</span><span class='json-object-key'>&quot;a&quot;</span><span class='json-object-separator'>:</span><span class='json-object-element'><span class='json-number'>7</span></span><span class='json-object-separator'>,</span><span class='json-object-key'>&quot;b&quot;</span><span class='json-object-separator'>:</span><span class='json-object-element'><span class='json-boolean'>false</span></span><span class='json-object-delimiter'>}</span></span></span><span class='json-array-delimiter'>]</span></span>",
           local:"[null,null,\"hi\",{\"a\":7,\"b\":false}]"
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
      {typeName:'date', fixtures:[
          {fromString:'2017-12-23', toPlainString:'2017-12-23', value:bestGlobals.date.iso('2017-12-23'), local:'23/12/2017', toHtmlText:"<span class=date><span class='date-day'>23</span><span class='date-sep'>/</span><span class='date-month'>12</span><span class='date-sep'>/</span><span class='date-year'>2017</span></span>"},
          /* {fromString:'2017-12-23', toPlainString:'2017-12-23', value:new Date(2017,11,23,0,0,0), local:'23/12/2017', toHtmlText:"<span class=date><span class='date-day'>23</span><span class='date-sep'>/</span><span class='date-month'>12</span><span class='date-sep'>/</span><span class='date-year'>2017</span></span>"},*/
          {fromString:'4'       , fromStringError:new Error('invalid date')},
      ], constructorFunction:bestGlobals.date.iso
      , invalidValues:[7 , [7], '2017-12-12 10:30:45', new Date(),'2017-12-23',"2017-09-02T15:08:16.318Z"]
      , invalidLocales:['2017-12-30']},
      {typeName:'timestamp', fixtures:[
          {fromString:'2017-12-23 13:40:00', toPlainString:'2017-12-23 13:40:00.000', value:bestGlobals.datetime.iso('2017-12-23 13:40:00')},
          {fromString:'4'       , fromStringError:new Error('invalid datetime')},
      ], constructorFunction:bestGlobals.datetime},
  ].forEach(function(typeDef){
    if(!typeDef.skip){
      describe(typeDef.typeName+' '+(typeDef.describeFixtures||''), function(){
        var typer = TypeStore.typerFrom(typeDef.typeInfo||{typeName:typeDef.typeName});
        likeAr(typeDef).forEach(function(value, attr){
            typer[attr]=value;
        });
        typeDef.fixtures.forEach(function(fixture){
          if(!fixture.skip){
            it("accept \""+fixture.fromString+"\"", function(){
              if(fixture.fromStringError){
                try{
                  var obtainedFromString = typer.fromString(fixture.fromString);
                }catch(err){
                  var obtainedError = err;
                }
                discrepances.showAndThrow(obtainedError, fixture.fromStringError);
              }else{
                var obtainedFromString;
                var obtainedFromConstructor;
                var obtained;
                if('fromString' in fixture){
                    obtained = obtainedFromString = typer.fromString(fixture.fromString);
                }
                if('construct' in fixture){
                    obtainedFromConstructor = typeDef.constructorFunction(fixture.construct);
                    obtained = obtainedFromConstructor;
                }
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
                typer.validateTypedData(null);
                typer.validateTypedData(obtained);
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
                    var obtainedOutput=typer.toPlainString(obtained);
                    discrepances.showAndThrow(obtainedOutput, fixture.toPlainString);
                }
                if('toHtmlText' in fixture){
                    var obtainedHtml=typer.toHtmlText(obtained);
                    discrepances.showAndThrow(obtainedHtml, fixture.toHtmlText);
                }
                if('local' in fixture){
                    var localText = fixture.local;
                }else if('toPlainString' in fixture){
                    var localText = fixture.toPlainString;
                }else if('fromString' in fixture){
                    var localText = fixture.fromString;
                }else if(obtainedOutput!==undefined){
                    var localText = fixture.fromString;
                }else{
                    var skipFromLocal=true;
                    var localText = '';
                }
                if(obtained!==null){
                    var localObtained=typer.toLocalString(obtained);
                    localObtained.split('').forEach(function(char,position){
                        discrepances.showAndThrow(typer.rejectedChar(char,position),false,{showContext:'NOT rejecting '+JSON.stringify(char)+' in position '+position});
                    });
                    discrepances.showAndThrow(localObtained, localText, {showContext:json4all.stringify(obtained)});
                    discrepances.showAndThrow(typer.isValidLocalString(localObtained),true,{showContext:'local:'+localObtained});
                    if(!skipFromLocal){
                        var localObtained=typer.fromLocalString(localText);
                        discrepances.showAndThrow(localObtained, obtained);
                    }
                }
              }
            });
          }
        });
        (typeDef.invalidValues||[]).forEach(function(invalidFixture){
            it("reject "+JSON.stringify(invalidFixture), function(){
                var invalidValue = invalidFixture && invalidFixture.expectedError?invalidFixture.value:invalidFixture;
                var expectedError = invalidFixture && invalidFixture.expectedError?invalidFixture.expectedError:/No[nt] an? /i;
                var obtained;
                try{
                    typer.validateTypedData(invalidValue);
                }catch(err){
                    obtained=err;
                }
                discrepances.showAndThrow(obtained instanceof Error,true);
                if(!expectedError.test(obtained.message)){
                    discrepances.showAndThrow(obtained.message,expectedError.toString());
                }
            });
        });
        (typeDef.invalidLocales||[]).forEach(function(invalidLocal){
            it("reject local \""+invalidLocal+"\"", function(){
                discrepances.showAndThrow(typer.isValidLocalString(invalidLocal),false);
            });
        });
        (typeDef.rejectChars||[]).forEach(function(rejectChar){
            it("reject local \""+rejectChar+"\"", function(){
                var char=typeof rejectChar==='string'?rejectChar:rejectChar.char;
                var position=typeof rejectChar==='string'?1:rejectChar.position;
                discrepances.showAndThrow(typer.rejectedChar(char,1),true);
            });
        });
      });
    }
  });
});