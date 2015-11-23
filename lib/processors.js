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

var porterStemmer = require('stemmer');

function stopwords ( stopwords ) {
	var stopwords = stopwords || {};
	return function ( w ) {
		if ( stopwords[w] === true ) return;
		return w;
	};
};

function wordforms ( wordforms ) {
	var wordforms = wordforms || {};
	return function ( w ) {
		return wordforms[w] || w;
	};

};

function multiples ( stopwords ) {
	var stopwords = stopwords || {};
	return function ( w ) {
		if ( stopwords[w] === true ) return;
		return w.replace(/([a-zåäö])\1+/gi, '$1');
	};
};

function stripHtml ( ) {
	
	var replaceMap = {
		"nbsp": 	" ",
		"gt": 		">",
		"lt": 		"<",
		"aring": 	"å",
		"Aring": 	"Å",
		"ouml": 	"ö",
		"Ouml": 	"O",
		"auml": 	"ä",
		"Äuml": 	"Ä",
		"Oslash": 	"Ø",
		"oslash": 	"ø",
		"uuml": 	"ü",
		"Uuml": 	"Ü",
		"quot": 	"\""
	}, result, num;

	return function ( field ) { 

		// Remove link and images-tags, keeping alt values and content
		field=field.replace(/<a.*href=(?:"|')(.*?)(?:"|').*?>(.*?)<\/a>/gi, " $2 $1 ");
		field=field.replace(/<img.*alt=(?:"|')(.*?)(?:"|').*?>/gi, " $1 ");
		
		// Remove script tags altogether
		field=field.replace(/<script.*?>.*?<\/script>/gi, "");

		// ... as well as style tags
		field=field.replace(/<style.*?>.*?<\/style>/gi, "");

		// Remove reaining tags
		field=field.replace(/<(?:.|\s)*?>/g, " ");

		// Replace numerical HTML-entities
		field=field.replace(/&#([0-9]{1,3});/gi, function(match, numStr) {
	        num = parseInt(numStr, 10);
	        return String.fromCharCode(num);
	    });

	    // Replace textual html-entities using replaceMap
	    field=field.replace(/&([a-z]{2,5});/gi, function(match, entity) {
		  
		  // We want to return a space in case the entity isn't found, hence the if
		  if( ( result = replaceMap[entity] ) !== undefined) {
		  	return result;
		  }
		  
		  return ' ';
		});

		return field;

	}
}

/* Inspired by http://snowball.tartarus.org/algorithms/swedish/stemmer.html */
function swedishStemmer ( stopwords ) {

	var i,

		stopwords = stopwords || {},

		wovels = ["a", "e", "i", "o", "u", "y", "å", "ä", "ö"],
		suffix2 = ["dd",   "gd",   "nn",   "dt",   "gt", "mm", "tt"],
		suffix3 = ["lig",   "ig",   "els" , "itet", "it"],
		sEndings = ["b" ,"c" ,"d" ,"f" ,"g" ,"h" ,"j" ,"k" ,"l" ,"m" ,"n" ,"o" ,"p" ,"r" ,"t" ,"v" ,"y"],
		endings = ["a", "an", "ande", "andet", "arna", "anden", "erna"   ,"heterna" ,"orna"   ,"ad"   ,"e"   ,"ade"   ,"e"   ,"arne"   ,"are"   ,"aste"   ,"en"   ,"en"   ,"aren"   ,"heten"   ,"ern"   ,"ar"   ,"er"   ,"heter"   ,"or"   ,"as"   ,"arnas","ernas","ornas","es","ades","es","ens", "arens","hetens","erns","at" ,"het","ast","et"],
		nEndings = ["ing", "ning"],

		// The stem of all words that doesn't match r1 conditions, the longest alternative first (nyhet before ny)!!
		r1exceptions = ["nyhet", "ny"];

	return function ( w ) {

		var w_orig = w,
			longestEnding = "",
			r1="",r1_copy,r1_tmp,r1_extra,r1_excepted=false;

		// Dont process stopwords
		if ( stopwords[w] === true ) return w;

		// Find R1
		for ( i = 0; i < r1exceptions.length; i++) {
			if (w.substring(0,r1exceptions[i].length) == r1exceptions[i]) {
				r1 = w.substring(r1exceptions[i].length, w.length);
				r1_excepted = true;
				break;
			}
		}

		// Find exceptions to r1
		if( !r1_excepted ) {
			for ( i = 1; i < w.length; i++) {
				// R1 is the region after the first non-vowel following a vowel, or is the null region at the end of the word if there is no such non-vowel.
				if ( wovels.indexOf(w[i]) === -1 && wovels.indexOf(w[i-1]) !== -1 ) {
					r1 = w.substring(i+1,w.length);
					break;
				}
			}
		}

		if ( r1 == "" ) return w;

		// Stage 1a-1
		for( i = 0; i < endings.length; i++) {
			var currentEnding = endings[i];
			// Check that the word is longer than r1
			if (w.length - currentEnding.length + 1 > 0) {
				r1_extra = 0;
				if(w[w.length-1]=='s') r1_extra = 1;
				r1_tmp = r1.substr(r1.length-currentEnding.length-r1_extra,r1.length);
				if(r1_tmp.indexOf(currentEnding) > -1 && currentEnding.length > longestEnding.length) {
					longestEnding = currentEnding;
				}
			}
		}

		r1_tmp = r1.substr(r1.length-longestEnding.length-r1_extra,r1.length);

		// Finish stage 1a, delete ending by replacing r1 with r1 - longest ending
		if (longestEnding !== '') {
			w = w.substring(0,w.lastIndexOf(longestEnding));
			r1 = r1.substring(0,r1.lastIndexOf(longestEnding));
		}

		// Stage 1a-2
		longestEnding = '';
		for( i = 0; i < nEndings.length; i++) {
			var currentEnding = nEndings[i];
			// Check that the word is longer than r1
			if (w.length - currentEnding.length + 1 > 0) {
				r1_extra = 0;
				if(w[w.length-1]=='s') r1_extra = 1;
				r1_tmp = r1.substr(r1.length-currentEnding.length-r1_extra,r1.length);
				if(r1_tmp.indexOf(currentEnding) > -1 && currentEnding.length > longestEnding.length) {
					longestEnding = currentEnding;
				}
			}
		}

		r1_tmp = r1.substr(r1.length-longestEnding.length-r1_extra,r1.length);

		// Finish stage 1a, delete ending by replacing r1 with r1 - longest ending
		if (longestEnding !== '') {
			w = w.substring(0,w.lastIndexOf(longestEnding));
		}


		// Stage 1b, remove trailing s if preceded by an sEnding
		for( i = 0; i < sEndings.length; i++) {
			if ( w[w.length-2] == sEndings[i] && w[w.length-1] == 's' ) {
				w = w.substr(0,w.length-1);
				break;
			}
		}

		// Stage 2, shorten suffixes
		for( i = 0; i < suffix2.length; i++) {
			if ( w.substr(w.length-2,w.length) == suffix2[i] ) {
				w = w.substr(0,w.length-1);
				break;
			}
		}

		// Stage 3a, delete lig   ig   els
		for( i = 0; i < suffix3.length; i++) {
			if ( w.substr(w.length-suffix3[i].length,w.length) == suffix3[i] ) {
				w = w.substr(0,w.length-suffix3[i].length);
				break;
			}
		}

		// Stage 3b, replace löst with lös
		if ( w.substr(w.length-4,w.length) == 'löst' ) {
			w = w.substr(0,w.length-4)+'lös';
		}

		// Stage 3c, replace fullt with full
		if ( w.substr(w.length-5,w.length) == 'fullt' ) {
			w = w.substr(0,w.length-5)+'full';
		}

		return w;
	};

};

/*function missingSpace ( opts , fieldIdx ) {

	var options = options

	if ( !options ) {
		throw 'missingSpace requires options, please pass thinker options as constructor parameter';
	}

	return function ( field ) { 

		var splitted = field.match( options.characters ), i, result = [];

		for (i = 1; i < splitted.length; i++) {
			if( splitted[i-1].length + splitted[i].length <= 10) {

			}
		}

		return field;

	};

}*/

function englishStemmer ( ) {
	return function ( w ) {
		return porterStemmer( w );
	};
};

module.exports = {
	stemmers: {
		swedish: swedishStemmer,
		english: englishStemmer
	},
	stopwords: stopwords,
	wordforms: wordforms,
	multiples: multiples,
	stripHtml: stripHtml
}