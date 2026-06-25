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
    [
        {input:'13:40:00', output:'13:40:00', interval:{hours:13, minutes:40, seconds:0}},
        {input:"3:30"    , output:'3:30:00' , interval:{hours:3, minutes:30}},
        {input:"13h20'"  , output:'13:20:00', interval:{hours:13, minutes:20}},
        {input:'1D'     , output:'1D', interval:{days:1}},
        {input:'1D 10h' , output:'1D 10:00:00', interval:{days:1, hours:10}},
        {input:'1D 10h' , output:'34:00:00', interval:{days:1, hours:10}, format:'hours'},
        {input:'1D 10:00:00', output:'34:00', interval:{days:1, hours:10}, format:'hm'},
        {input:'4'      , output:new TypeError('NOT timeInterval')},
        {input:'5'      , output:'0:05:00', interval:{minutes:5}, typeInfo:{timeUnit:'minutes'}},
        {input:"-3:30"  , output:'-3:30:00', interval:{negative:true, hours:3, minutes:30}},
        {input:"-03:00" , output:'-3:00:00', interval:{negative:true, hours:3, minutes:0}},
        {input:"-2'"    , output:'-0:02:00', interval:{ms:-120000}},
        {input:"1D 03:25:42.857143", output:'1D 3:25:42.857143', interval:{ms:98742857.143}},
        {input:"1D 03:25:42.857143", output:'27:25', interval:{ms:98742857.143}, format:'hm', outputLoosePrecision:true},
    ].forEach(function(fixture){
        it("accept input \""+fixture.input+"\"", function(){
            try{
                var typer = new TypeStore.type.interval({format: fixture.format});
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
            if (typeof fixture.output == 'string' && !fixture.outputLoosePrecision) {
                var reInterval = typer.fromString(fixture.output, fixture.typeInfo);
                discrepances.showAndThrow(reInterval, bestGlobals.timeInterval(fixture.interval));
            }
        });
    });
});

describe("time", function(){
    var typer = new TypeStore.type.time();
    [
        {input:'15:40:00', output:'15:40', interval:'15:40'},
        {input:"05:30"   , output:'5:30' , interval:'5:30' },
        {input:'4'       , output:new TypeError('NOT time')},
    ].forEach(function(fixture){
        function toTime(x){ return x};
        it("accept input \""+fixture.input+"\"", function(){
            try{
                var obtainedTime = typer.fromString(fixture.input, fixture.typeInfo);
                discrepances.showAndThrow(obtainedTime, toTime(fixture.interval));
                if(fixture.typeInfo){
                    var specificTyper = TypeStore.typerFrom(changing({typeName:'interval'}, fixture.typeInfo));
                    var specificObtainedInterval = specificTyper.fromString(fixture.input);
                    discrepances.showAndThrow(specificObtainedInterval, obtainedTime);
                }
                discrepances.showAndThrow(obtainedTime, toTime(fixture.interval));
                var obtainedOutput=typer.toPlainString(obtainedTime);
            }catch(err){
                obtainedOutput=err;
            }
            discrepances.showAndThrow(obtainedOutput, fixture.output);
        });
    });
});