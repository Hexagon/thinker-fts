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

"use strict";

let porterStemmer = require("stemmer"),
	Soundex = require("soundex");

function stopwords ( stopword ) {

	stopword = stopword || {};
	return function ( w ) {
		if ( stopword[w] === true ) return;
		return w;
	};

}

function wordforms ( wordform ) {

	wordform = wordform || {};
	return function ( w ) {
		return wordform[w] || w;
	};

}

function multiples ( stopword ) {
	stopword = stopword || {};
	return function ( w ) {
		if ( stopword[w] === true ) return;
		return w.replace(/([a-zåäö])\1+/gi, "$1");
	};
}

function dashes ( stopword ) {
	stopword = stopword || {};
	return function ( w ) {
		if ( stopword[w] === true ) return;
		return w.replace(/([^\s]){1}-/, "$1");
	};
}

function stripHtml ( ) {
	
	let replaceMap = {
			"nbsp": 	" ",
			"gt": 		">",
			"lt": 		"<",
			"aring": 	"å",
			"Aring": 	"Å",
			"ouml": 	"ö",
			"Ouml": 	"Ö",
			"auml": 	"ä",
			"Auml": 	"Ä",
			"Oslash": 	"Ø",
			"oslash": 	"ø",
			"uuml": 	"ü",
			"Uuml": 	"Ü",
			"quot": 	"\""
		}, result, num;

	return function ( field ) { 

		// Remove link and images-tags, keeping alt values and content
		field=field.replace(/<a.*href=(?:"|")(.*?)(?:"|").*?>(.*?)<\/a>/gi, " $2 $1 ");
		field=field.replace(/<img.*alt=(?:"|")(.*?)(?:"|").*?>/gi, " $1 ");
		
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

			// We want to return a space in case the entity isn"t found, hence the if
			if( ( result = replaceMap[entity] ) !== undefined) {
				return result;
			} else {
				return " ";
			}

		});

		return field;

	};

}

/* Inspired by http://snowball.tartarus.org/algorithms/swedish/stemmer.html */

function swedishStemmer(stopwords) {

	let i,
		suffix = ["dd", "gd", "nn", "dt", "gt", "mm", "tt"],
		endings = ["igheter", "igheten", "ingarna", "iteten", "ingen", "anden", "andet", "orna", "aste", "aren", "arna", "ande", "erna", "arne", "itet", "ndet", "orn","het", "ast", "and", "ade", "ern", "ing", "are", "en", "ad", "an", "ar", "ig", "er", "et", "or", "at", "e", "a"];

	stopwords = stopwords || {};

	return function (w) {

		let word = w.substring(0,2),
			r1 = w.substring(2,w.length);

		// Dont process stopwords
		if (stopwords[w] === true) return w;

		if (w.length <=2) return w;
		
		// Remove trailing s
		if (r1[r1.length-1]==="s") r1 = r1.substring(0,r1.length-1);

		// Return if we didnt find r1
		if (r1.length === 0) return word;
		
		// Stage 1a-1
		for (i = 0; i < endings.length; i++) {
			if ( r1.substring(r1.length-endings[i].length,r1.length).lastIndexOf(endings[i]) > -1 ) {
				r1 = r1.substring(0, r1.lastIndexOf(endings[i]));
			}
		}
		// Return of we didnt find r1
		if (r1.length === 0) return word;

		w = word + r1;

		// Dont process stopwords
		if (stopwords[w] === true) return w;

		// Stage 2, shorten suffixes
		for (i = 0; i < suffix.length; i++) {
			if (w.substr(w.length - 2, w.length) === suffix[i]) {
				w = w.substr(0, w.length - 1);
				break;
			}
		}

		return w;
	};

}

function englishStemmer ( stopwords ) {
	stopwords = stopwords || {};
	return function ( w ) {
		// Dont process stopwords
		if ( stopwords[w] === true ) return w;
		return porterStemmer( w );
	};
}

function soundex ( ) {
	return function ( w ) {
		return Soundex( w );
	};
}

module.exports = {
	stemmers: {
		swedish: swedishStemmer,
		english: englishStemmer
	},
	soundex: soundex,
	stopwords: stopwords,
	wordforms: wordforms,
	multiples: multiples,
	stripHtml: stripHtml,
	dashes: dashes
};