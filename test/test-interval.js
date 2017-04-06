"use strict";

var assert = require('assert');
var TypeStore = require("../type-store.js");

var PostgresInterval = require('postgres-interval');

describe("postgres-interval", function(){
    [
        {input:'3:40:00', output:'3:40:00', interval:{hours:3, minutes:40, seconds:0}},
        {input:"3:30"   , output:'3:30:00', interval:{hours:3, minutes:30}},
        {input:"3h20'"  , output:'3:20:00', interval:{hours:3, minutes:20}},
        {input:'1D'     , output:'1D', interval:{days:1}},
        {input:'1D 10h' , output:'1D 10:00:00', interval:{days:1, hours:10}}
    ].forEach(function(fixture){
        it("accept input \""+fixture.input+"\"", function(){
            var obtainedInterval = TypeStore.type.interval.fromString(fixture.input);
            assert.deepEqual(obtainedInterval, fixture.interval);
            assert(obtainedInterval instanceof PostgresInterval);
            var obtainedOutput=TypeStore.type.interval.toPlainString(obtainedInterval);
            assert.equal(obtainedOutput, fixture.output);
        });
    });
});