"use strict";

var bestGlobals = require('best-globals');
var changing = bestGlobals.changing;
var discrepances = require('discrepances');
var assert = require('assert');
var TypeStore = require("../type-store.js");

describe("date", function(){
    it('generate dow', function(){
        TypeStore.options.withDateDowAttr=true;
        var d=bestGlobals.date.today();
        var typer = new TypeStore.type.date();
        var str = typer.toHtmlText(d);
        discrepances.showAndThrow(
            str.substr(0,83),
            "<span class=date current-century current-year current-month current-day date-dow="+
            d.getDay()+">"
        );
        TypeStore.options.withDateDowAttr=false;
    })
});

describe("interval", function(){
    var typer = new TypeStore.type.interval();
    [
        {input:'13:40:00', output:'13:40:00', interval:{hours:13, minutes:40, seconds:0}},
        {input:"3:30"    , output:'3:30:00' , interval:{hours:3, minutes:30}},
        {input:"13h20'"  , output:'13:20:00', interval:{hours:13, minutes:20}},
        {input:'1D'     , output:'1D', interval:{days:1}},
        {input:'1D 10h' , output:'1D 10:00:00', interval:{days:1, hours:10}},
        {input:'4'      , output:new TypeError('NOT timeInterval')},
        {input:'5'      , output:'0:05:00', interval:{minutes:5}, typeInfo:{timeUnit:'minutes'}},
    ].forEach(function(fixture){
        it("accept input \""+fixture.input+"\"", function(){
            try{
                var obtainedInterval = typer.fromString(fixture.input, fixture.typeInfo);
                discrepances.showAndThrow(obtainedInterval, bestGlobals.timeInterval(fixture.interval));
                if(fixture.typeInfo){
                    var specificTyper = TypeStore.typerFrom(changing({typeName:'interval'}, fixture.typeInfo));
                    var specificObtainedInterval = specificTyper.fromString(fixture.input);
                    discrepances.showAndThrow(specificObtainedInterval, obtainedInterval);
                }
                discrepances.showAndThrow(obtainedInterval, bestGlobals.timeInterval(fixture.interval));
                var obtainedOutput=typer.toPlainString(obtainedInterval);
            }catch(err){
                obtainedOutput=err;
            }
            discrepances.showAndThrow(obtainedOutput, fixture.output);
        });
    });
});