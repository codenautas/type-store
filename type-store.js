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

var Big = require('big.js');
var json4all=require('json4all');

TypeStore.bigint={};
TypeStore.bigint.fromString = function fromString(textWithBigInt){
    var number = Number(textWithBigInt);
    if(number>=1000000000000000 || number<=-1000000000000000){
        return new Big(textWithBigInt);
    }
    return number;
};

json4all.addType(Big,{
    construct: function construct(value){
        return new Big(value); 
    }, 
    deconstruct: function deconstruct(o){
        return o.toString();
    },
});

return TypeStore;

});