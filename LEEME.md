<!--multilang v0 es:LEEME.md en:README.md -->
# type-store
<!--lang:es-->
type ecosystem
<!--lang:en--]
type ecosystem

[!--lang:*-->

<!-- cucardas -->
![extending](https://img.shields.io/badge/stability-extending-orange.svg)
[![npm-version](https://img.shields.io/npm/v/type-store.svg)](https://npmjs.org/package/type-store)
[![downloads](https://img.shields.io/npm/dm/type-store.svg)](https://npmjs.org/package/type-store)
[![build](https://github.com/codenautas/type-store/actions/workflows/node.js.yml/badge.svg)](https://github.com/codenautas/type-store/actions/workflows/node.js.yml)
[![coverage](https://img.shields.io/coveralls/codenautas/type-store/master.svg)](https://coveralls.io/r/codenautas/type-store)

<!--multilang buttons-->

idioma: ![castellano](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)
también disponible en:
[![inglés](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)](README.md)

<!--lang:es-->
# Instalación
<!--lang:en--]
# Install
[!--lang:*-->
```sh
$ npm install type-store
```

<!--lang:es-->
# Objetivo

Tener un módulo que se encargue de:

  * conocer todos los tipos que se pueden usar en un programa
  * saber cómo
    * leerlo de un input común del usuario (saber si es válido o no, por qué y como se transforma al tipo correspondiente) utilizando la configuración regional
    * transformarlo en un literal para envíar a la base de datos
    * transformarlo en otros formatos complejos para interactuar por ejemplo con el Excel (u otros que aparezcan)
    * leerlo desde la base de datos
    * detectarlo desde distintos posibles formatos de entrada (para hacer input automático)
  * conocer
    * los Regexp y las teclas permitidas para los inputs

<!--lang:en--]
# Goal

<!--lang:es-->
# Uso

```js
var TypeStore = require('../type-store');

/* Ejemplo sonso */
var typeDate = TypeStore.typerFrom({typeName:'date', label:'fecha actual', name:'fecha'})
var date = typeDate.fromString("2018-04-30"); // lo lee desde un formato canónico (no humano)
console.log('la fecha es:', typeDate.toLocalString(date));

/* La gracia es cuando uno itera sin que esté predefinido el tipo: */
fieldList.forEach(function(fieldDef){
    var typer = TypeStore.typerFrom(fieldDef);
    var text = readFromCommandLineFromAHumman('ingrese '+fieldDef.name);
    try{
        var valor = typer.fromLocalString(text);
        var textForSQL = typer.toPostgres(valor);
        sqlQuery("update table set %I = %L",[fieldDef.name, textForSQL]);
    }catch(err){
        console.log('no se pudo convertir o grabar')
    }
})

```

<!--lang:en--]
# Usage
<!--lang:es-->
# Funciones

función                 |predeterminado | uso
------------------------|---------------|-------------------------------
**textos de máquina**   |               |por ejemplo 1810-05-25 ó 1919.44
toPlainString(v)        |               |manda a texto de máquina
fromString(s)           |               |lee desde un texto de máquina
rejectedChar(c,i)       |*false*        |indica si un caracter debe rechazarse para una posición
isValidTypedData(v)     |               |
whyTypedDataIsInvalid(s)|               |devuelve un texto explicando por qué un string es inválido
validateTypedData(v)    |               |indica si el valor es del tipo especificado
toHtmlText(v)           |*<span class=...>text</span>*|devuelve algo lindo para mostrar y con la clase
toPlainJson(v)          |toPlainString  |pasa a un texto que pueda meterse en JSON (salvo para boolean y numeric)
fromPlainJson(s||n||b)  |               |recibe un valor obtenido de JSON.parse
**textos locales humanos**|             |por ejemplo 25/5/1810 ó 1.919,44
toLocalString(v)        |               |devuelve un texto humano 
fromLocalString(s)      |               |obtiene el valor a partir de un texto humano
isValidLocalString(s)   |               |indica si un texto humano es válido
*typedControlName*      |               |cómo lo conocemos dentro de typedControls
**para Postgresql**     |               |para postgresql
*typeDbPg*              |               |el tipo en la base de datos
*pgSpecialParse*        |               |si la librería *pg* puede darse cuenta sólo cómo generar un tipo en Javascript
*pg_OID*                |               |es el OID de postgres
**para Excel**          |               |transforman en celdas
toExcelValue(v)         |toPlainString  |
toExcelType(v)          |*s*            |el caracter que indica el tipo de la celda
fromExcelCell(cell)     |               |interpreta una celda de excel

```sql
select * 
  from pg_type
  where oid in (701,1700,23,20,1700,3802,114,1186,1114) or typname like '%time%' or typname like '%range%';
```

<!--lang:en--]
# Usage
[!--lang:*-->

<!--lang:es-->
## Licencia
<!--lang:en--]
## License
[!--lang:*-->

[MIT](LICENSE)

