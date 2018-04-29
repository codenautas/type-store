"use strict";

/* probarlo así:

node example/example.js

*/


var TypeStore = require('../type-store');

var typeDate=new TypeStore.type.date()

var date = typeDate.fromString("2018-04-30");

console.log('esto es un date',date);

console.log('en local:', typeDate.toLocalString(date))

// usado en backend-plus con lang:es como ocpión se ve así:

TypeStore.locale   = TypeStore.i18n.locale.es;

console.log('es local:', typeDate.toLocalString(date))
