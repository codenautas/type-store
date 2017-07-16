"use strict";

var bestGlobals = require('best-globals');
var discrepances = require('discrepances');
var assert = require('assert');
var TypeStore = require("../type-store.js");

describe("interval", function(){
    [
        {input:'13:40:00', output:'13:40:00', interval:{hours:13, minutes:40, seconds:0}},
        {input:"3:30"    , output:'3:30:00' , interval:{hours:3, minutes:30}},
        {input:"13h20'"  , output:'13:20:00', interval:{hours:13, minutes:20}},
        {input:'1D'     , output:'1D', interval:{days:1}},
        {input:'1D 10h' , output:'1D 10:00:00', interval:{days:1, hours:10}},
        {input:'4'      , output:new TypeError('NOT timeInterval')},
        {input:'5'      , output:'5:00:00', interval:{hours:5}, typeInfo:{timeUnit:'hours'}},
    ].forEach(function(fixture){
        it("accept input \""+fixture.input+"\"", function(){
            try{
                var obtainedInterval = TypeStore.type.interval.fromString(fixture.input, fixture.typeInfo);
                discrepances.showAndThrow(obtainedInterval, bestGlobals.timeInterval(fixture.interval));
                var obtainedOutput=TypeStore.type.interval.toPlainString(obtainedInterval);
            }catch(err){
                obtainedOutput=err;
            }
            discrepances.showAndThrow(obtainedOutput, fixture.output);
        });
    });
});