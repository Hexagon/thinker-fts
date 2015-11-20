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

module.exports = {
	swedishStemmer: swedishStemmer,
	stopwords: stopwords,
	wordforms: wordforms,
	multiples: multiples
}