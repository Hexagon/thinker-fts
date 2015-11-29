/*

Copyright (c) 2015 Hexagon <robinnilsson@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

'use strict';

var should = require('should'),
	Thinker = require('../lib/Thinker.js'),
	sizeof = require('object-sizeof');

/* START OF EXAMPLE DATA */
var exampleTexts = [
	[0,"Artikel nummer noll","Det här är ettan i det hela, Anders är ett namn. Jonas likaså antikvitets. Bemötandet. effektivitet Kalle olle lars considerable"],
	[1,"Bemötande testtitel med extra ord","Brödtext nummer ett. Ander antikviteten olle lars sven"],
	[2,"Titeln med extra Testning","Brödtext i sanden artikeln artikeln artikeln artikeln två. Bemött namn Andersson antikvitet nyhet, nyheter, nyheten, nyhetens, nya olle"],
];

function getReadableFileSizeString(fileSizeInBytes) {

    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};

var thinker = Thinker();

thinker.ranker = Thinker.rankers.standard();

// We need to make a copy of exampletexts, as feed consumes the object
var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
var stemmer 	= Thinker.processors.stemmers.swedish();
var stopwords = Thinker.processors.stopwords({
	"titel": true,
	"in": true,
	"en": true,
	"det": true,
	"som": true,
	"och": true,
	"of": true,
	"den": true,
	"the": true,
	"and": true,
	"at": true,
	"av": true,
	"med": true,
	"de": true,
	"to": true,
	"till": true
});

thinker.addWordProcessor(stemmer);
thinker.addWordProcessor(stopwords);
thinker.feed(exampleTexts);


console.log('Rough estimate of memory used by index: \n');
console.log('In memory:\t' + getReadableFileSizeString(sizeof(thinker.index.getData())));
console.log('On Disk:\t' + getReadableFileSizeString(JSON.stringify(thinker.index.getData()).length));

console.log(thinker.index.stats());
