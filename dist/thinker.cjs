(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Thinker = factory());
})(this, (function () { 'use strict';

  var levenshtein$1 = {exports: {}};

  const peq = new Uint32Array(0x10000);
  const myers_32 = (a, b) => {
    const n = a.length;
    const m = b.length;
    const lst = 1 << (n - 1);
    let pv = -1;
    let mv = 0;
    let sc = n;
    let i = n;
    while (i--) {
      peq[a.charCodeAt(i)] |= 1 << i;
    }
    for (i = 0; i < m; i++) {
      let eq = peq[b.charCodeAt(i)];
      const xv = eq | mv;
      eq |= ((eq & pv) + pv) ^ pv;
      mv |= ~(eq | pv);
      pv &= eq;
      if (mv & lst) {
        sc++;
      }
      if (pv & lst) {
        sc--;
      }
      mv = (mv << 1) | 1;
      pv = (pv << 1) | ~(xv | mv);
      mv &= xv;
    }
    i = n;
    while (i--) {
      peq[a.charCodeAt(i)] = 0;
    }
    return sc;
  };

  const myers_x = (a, b) => {
    const n = a.length;
    const m = b.length;
    const mhc = [];
    const phc = [];
    const hsize = Math.ceil(n / 32);
    const vsize = Math.ceil(m / 32);
    let score = m;
    for (let i = 0; i < hsize; i++) {
      phc[i] = -1;
      mhc[i] = 0;
    }
    let j = 0;
    for (; j < vsize - 1; j++) {
      let mv = 0;
      let pv = -1;
      const start = j * 32;
      const end = Math.min(32, m) + start;
      for (let k = start; k < end; k++) {
        peq[b.charCodeAt(k)] |= 1 << k;
      }
      score = m;
      for (let i = 0; i < n; i++) {
        const eq = peq[a.charCodeAt(i)];
        const pb = (phc[(i / 32) | 0] >>> i) & 1;
        const mb = (mhc[(i / 32) | 0] >>> i) & 1;
        const xv = eq | mv;
        const xh = ((((eq | mb) & pv) + pv) ^ pv) | eq | mb;
        let ph = mv | ~(xh | pv);
        let mh = pv & xh;
        if ((ph >>> 31) ^ pb) {
          phc[(i / 32) | 0] ^= 1 << i;
        }
        if ((mh >>> 31) ^ mb) {
          mhc[(i / 32) | 0] ^= 1 << i;
        }
        ph = (ph << 1) | pb;
        mh = (mh << 1) | mb;
        pv = mh | ~(xv | ph);
        mv = ph & xv;
      }
      for (let k = start; k < end; k++) {
        peq[b.charCodeAt(k)] = 0;
      }
    }
    let mv = 0;
    let pv = -1;
    const start = j * 32;
    const end = Math.min(32, m - start) + start;
    for (let k = start; k < end; k++) {
      peq[b.charCodeAt(k)] |= 1 << k;
    }
    score = m;
    for (let i = 0; i < n; i++) {
      const eq = peq[a.charCodeAt(i)];
      const pb = (phc[(i / 32) | 0] >>> i) & 1;
      const mb = (mhc[(i / 32) | 0] >>> i) & 1;
      const xv = eq | mv;
      const xh = ((((eq | mb) & pv) + pv) ^ pv) | eq | mb;
      let ph = mv | ~(xh | pv);
      let mh = pv & xh;
      score += (ph >>> (m - 1)) & 1;
      score -= (mh >>> (m - 1)) & 1;
      if ((ph >>> 31) ^ pb) {
        phc[(i / 32) | 0] ^= 1 << i;
      }
      if ((mh >>> 31) ^ mb) {
        mhc[(i / 32) | 0] ^= 1 << i;
      }
      ph = (ph << 1) | pb;
      mh = (mh << 1) | mb;
      pv = mh | ~(xv | ph);
      mv = ph & xv;
    }
    for (let k = start; k < end; k++) {
      peq[b.charCodeAt(k)] = 0;
    }
    return score;
  };

  const distance = (a, b) => {
    if (a.length > b.length) {
      const tmp = b;
      b = a;
      a = tmp;
    }
    if (a.length === 0) {
      return b.length;
    }
    if (a.length <= 32) {
      return myers_32(a, b);
    }
    return myers_x(a, b);
  };

  const closest = (str, arr) => {
    let min_distance = Infinity;
    let min_index = 0;
    for (let i = 0; i < arr.length; i++) {
      const dist = distance(str, arr[i]);
      if (dist < min_distance) {
        min_distance = dist;
        min_index = i;
      }
    }
    return arr[min_index];
  };

  var fastestLevenshtein = {
    closest, distance
  };

  (function (module, exports) {
  (function() {
    
    var collator;
    try {
      collator = (typeof Intl !== "undefined" && typeof Intl.Collator !== "undefined") ? Intl.Collator("generic", { sensitivity: "base" }) : null;
    } catch (err){
      console.log("Collator could not be initialized and wouldn't be used");
    }

    var levenshtein = fastestLevenshtein;

    // arrays to re-use
    var prevRow = [],
      str2Char = [];
    
    /**
     * Based on the algorithm at http://en.wikipedia.org/wiki/Levenshtein_distance.
     */
    var Levenshtein = {
      /**
       * Calculate levenshtein distance of the two strings.
       *
       * @param str1 String the first string.
       * @param str2 String the second string.
       * @param [options] Additional options.
       * @param [options.useCollator] Use `Intl.Collator` for locale-sensitive string comparison.
       * @return Integer the levenshtein distance (0 and above).
       */
      get: function(str1, str2, options) {
        var useCollator = (options && collator && options.useCollator);
        
        if (useCollator) {
          var str1Len = str1.length,
            str2Len = str2.length;
          
          // base cases
          if (str1Len === 0) return str2Len;
          if (str2Len === 0) return str1Len;

          // two rows
          var curCol, nextCol, i, j, tmp;

          // initialise previous row
          for (i=0; i<str2Len; ++i) {
            prevRow[i] = i;
            str2Char[i] = str2.charCodeAt(i);
          }
          prevRow[str2Len] = str2Len;

          var strCmp;
          // calculate current row distance from previous row using collator
          for (i = 0; i < str1Len; ++i) {
            nextCol = i + 1;

            for (j = 0; j < str2Len; ++j) {
              curCol = nextCol;

              // substution
              strCmp = 0 === collator.compare(str1.charAt(i), String.fromCharCode(str2Char[j]));

              nextCol = prevRow[j] + (strCmp ? 0 : 1);

              // insertion
              tmp = curCol + 1;
              if (nextCol > tmp) {
                nextCol = tmp;
              }
              // deletion
              tmp = prevRow[j + 1] + 1;
              if (nextCol > tmp) {
                nextCol = tmp;
              }

              // copy current col value into previous (in preparation for next iteration)
              prevRow[j] = curCol;
            }

            // copy last col value into previous (in preparation for next iteration)
            prevRow[j] = nextCol;
          }
          return nextCol;
        }
        return levenshtein.distance(str1, str2);
      }

    };

    // amd
    if (module !== null && 'object' !== "undefined" && module.exports === exports) {
      module.exports = Levenshtein;
    }
    // web worker
    else if (typeof self !== "undefined" && typeof self.postMessage === 'function' && typeof self.importScripts === 'function') {
      self.Levenshtein = Levenshtein;
    }
    // browser main thread
    else if (typeof window !== "undefined" && window !== null) {
      window.Levenshtein = Levenshtein;
    }
  }());
  }(levenshtein$1, levenshtein$1.exports));

  var levenshtein = levenshtein$1.exports;

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

  //msgpack = require("msgpack-lite"),
  //fs = require("fs");

  function Index(options) {

  	let	
  		// 	Array of Array with DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField
  		//  Index of outer array is WordIndex, matched to an actual word through lookupOriginal, lookupPartial, lookupProcessed och lookupPreProcessed
  		// 	[
  		// 		[DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, ... ], 
  		// 		[DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, ... ],
  		// 		[DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, ... ],
  		// 		[DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, ... ]
  		//  }
  		words = [],

  		//  Array of Array with [docId, metaData, wordCountField1, wordCOuntField2, ...]
  		//  Index of outer array is DocumentIdex
  		//  [
  		//  	[docId,metaData,wordCountf1,wordCountf2,wordCountf3,wordCountf4],
  		// 		[docId,metaData,wordCountf1,wordCountf2,wordCountf3,wordCountf4],
  		//  ]
  		documents = [],

  		// Lookup Maps of original words
  		//	{
  		//		"ActualWord": WordIndexIn data
  		//	}
  		lookupPreProcessed = new Map(null),

  		// Lookup Maps of partial and processed words
  		//	{
  		//		"ActualWord": [WordIndexIn data, WordIndexIn data, ... ]
  		//	}
  		lookupPartial = new Map(null),
  		lookupProcessed = new Map(null),
  		lookupSuggestion = new Map(null),

  		query = function ( location, lookupMap, filterFunc ) {

  			// Add object
  			let matches = lookupMap.get(location),
  				arr1 = [],
  				arr2,
  				i,
  				newIdx,
  				idx,
  				idxKey,
  				iEntry,

  				subroutine = function (word, arr1) {

  					arr2 = words[word];
  					idx = new Map();

  					for(let j = 0; j < arr2.length; j+=3) {

  						if ( ! ( filterFunc && !filterFunc(documents[arr2[j]][1]))) {

  							idxKey = arr2[j]*1e10+arr2[j+1];

  							if ( (iEntry = idx.get(idxKey)) ) {
  								arr1[iEntry+2]++;
  							} else {
  								newIdx = arr1.length;
  								idx.set(idxKey, newIdx);
  								arr1[newIdx] = arr2[j];
  								arr1[newIdx+1] = arr2[j+1];
  								arr1[newIdx+2] = arr2[j+2];
  							}

  						}

  					}

  				};

  			if( matches !== undefined ) {

  				if (matches.constructor === Array) {
  					for( i = 0; i < matches.length; i++) {
  						subroutine(matches[i], arr1);
  					}
  				} else {
  					subroutine(matches, arr1);
  				}

  				return arr1;
  			} else {
  				return;
  			}

  		},

  		populate = function ( location, wordIdx, lookup ) {

  			let dest = lookup.get(location);

  			// Add object
  			if(dest === undefined) {
  				lookup.set(location, wordIdx);

  			} else {
  				// Only insert if not already existing
  				if( dest.constructor === Array ) {
  					if ( dest.indexOf(wordIdx) === -1 ) {
  						dest[dest.length] = wordIdx;
  						lookup.set(location, dest);
  					}
  				} else {
  					if ( dest !== wordIdx ) {
  						dest = [dest, wordIdx];
  						lookup.set(location, dest);
  					}
  				}

  			}

  		};

  	const exported = {
  		populatePartial: function ( location, wordIdx ) {
  			populate( location, wordIdx, lookupPartial);
  		},
  		populateProcessed: function ( location, wordIdx ) {
  			populate( location, wordIdx, lookupProcessed);
  		},
  		populateDocuments: function (docid, meta) {
  			documents.push([docid, meta]);
  			return documents.length-1;
  		},
  		getMetadata: function (docidx) {
  			return documents[docidx][1];
  		},
  		docIndexToId: function (docidx) {
  			return documents[docidx][0];
  		},
  		populatePreProcessed: function ( location, docIdx, fieldIdx, suggest ) {

  			let 
  				i,
  				indexOriginal,
  				suggestionCounter,
  				match,
  				found;

  			// Index original words
  			indexOriginal = lookupPreProcessed.get(location.preprocessed);
  			if(indexOriginal === undefined) {
  				indexOriginal = words.length;
  				lookupPreProcessed.set(location.preprocessed, indexOriginal);
  				words[indexOriginal] = [docIdx, fieldIdx, 1];
  			} else {
  				found = false;
  				match = words[indexOriginal];
  				for (i = 0; i < match.length; i+=3) {
  					if(match[i] === docIdx && match[i+1] === fieldIdx ) {
  						match[i+2]++;
  						found = true;
  						break;
  					}
  				}
  				if (!found) {
  					match.push(docIdx, fieldIdx, 1);
  				}
  			}

  			// Update wordcount of current document and field
  			documents[docIdx][fieldIdx+2] = (documents[docIdx][fieldIdx+2] || 0) + 1;

  			// Index original words for expression suggestions, this is filtered on
  			// first run of 'findClosestWord'
  			// ---
  			// Do not suggest augmented words
  			if (suggest) {
  				suggestionCounter = lookupSuggestion.get(location.original);
  				if(suggestionCounter === undefined) {
  					lookupSuggestion.set(location.original, 1);
  				} else {
  					lookupSuggestion.set(location.original, ++suggestionCounter);
  				}	
  			}

  			return indexOriginal;

  		},
  		getDocuments: function () {
  			return documents;
  		},
  		query: function ( location, exact, filterFunc ) {

  			let hits = {};

  			if ( exact ) {
  				hits.exact = query( location.preprocessed, lookupPreProcessed, filterFunc ) || [];	
  				hits.processed = [];
  				hits.partial = [];

  			} else {
  				hits.exact = query( location.preprocessed, lookupPreProcessed, filterFunc ) || [];
  				hits.processed = query( location.processed, lookupProcessed, filterFunc ) || [];
  				if ( (hits.partial = query( location.preprocessed, lookupPartial, filterFunc )) === undefined ) hits.partial = query( location.processed, lookupPartial, filterFunc ) || [];

  			}

  			return hits;

  		},
  		findClosestWord: function ( w ) {
  			let closestValue = Infinity, closestIndex, distance;
  			lookupSuggestion.forEach(function(value, key) {
  				distance = levenshtein.get(w, key);
  				if (distance < closestValue) {
  					closestIndex = key;
  					closestValue = distance;
  				}
  			});
  			if (closestIndex !== undefined && closestValue < 5) {
  				return closestIndex;
  			}
  		},
  		compress: function () {
  			// Always
  			if (options.enableSuggestions) {
  				lookupSuggestion.forEach(function(value, key) {
  					if(value < options.suggestionMinWordCount) {
  						lookupSuggestion.delete(key);
  					}
  				});
  			}
  		}
  	};
  	return exported;
  }

  var stemmer_1 = stemmer;

  // Standard suffix manipulations.
  var step2list = {
    ational: 'ate',
    tional: 'tion',
    enci: 'ence',
    anci: 'ance',
    izer: 'ize',
    bli: 'ble',
    alli: 'al',
    entli: 'ent',
    eli: 'e',
    ousli: 'ous',
    ization: 'ize',
    ation: 'ate',
    ator: 'ate',
    alism: 'al',
    iveness: 'ive',
    fulness: 'ful',
    ousness: 'ous',
    aliti: 'al',
    iviti: 'ive',
    biliti: 'ble',
    logi: 'log'
  };

  var step3list = {
    icate: 'ic',
    ative: '',
    alize: 'al',
    iciti: 'ic',
    ical: 'ic',
    ful: '',
    ness: ''
  };

  // Consonant-vowel sequences.
  var consonant = '[^aeiou]';
  var vowel = '[aeiouy]';
  var consonants = '(' + consonant + '[^aeiouy]*)';
  var vowels = '(' + vowel + '[aeiou]*)';

  var gt0 = new RegExp('^' + consonants + '?' + vowels + consonants);
  var eq1 = new RegExp(
    '^' + consonants + '?' + vowels + consonants + vowels + '?$'
  );
  var gt1 = new RegExp('^' + consonants + '?(' + vowels + consonants + '){2,}');
  var vowelInStem = new RegExp('^' + consonants + '?' + vowel);
  var consonantLike = new RegExp('^' + consonants + vowel + '[^aeiouwxy]$');

  // Exception expressions.
  var sfxLl = /ll$/;
  var sfxE = /^(.+?)e$/;
  var sfxY = /^(.+?)y$/;
  var sfxIon = /^(.+?(s|t))(ion)$/;
  var sfxEdOrIng = /^(.+?)(ed|ing)$/;
  var sfxAtOrBlOrIz = /(at|bl|iz)$/;
  var sfxEED = /^(.+?)eed$/;
  var sfxS = /^.+?[^s]s$/;
  var sfxSsesOrIes = /^.+?(ss|i)es$/;
  var sfxMultiConsonantLike = /([^aeiouylsz])\1$/;
  var step2 = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
  var step3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
  var step4 = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;

  // Stem `value`.
  // eslint-disable-next-line complexity
  function stemmer(value) {
    var firstCharacterWasLowerCaseY;
    var match;

    value = String(value).toLowerCase();

    // Exit early.
    if (value.length < 3) {
      return value
    }

    // Detect initial `y`, make sure it never matches.
    if (
      value.charCodeAt(0) === 121 // Lowercase Y
    ) {
      firstCharacterWasLowerCaseY = true;
      value = 'Y' + value.slice(1);
    }

    // Step 1a.
    if (sfxSsesOrIes.test(value)) {
      // Remove last two characters.
      value = value.slice(0, value.length - 2);
    } else if (sfxS.test(value)) {
      // Remove last character.
      value = value.slice(0, value.length - 1);
    }

    // Step 1b.
    if ((match = sfxEED.exec(value))) {
      if (gt0.test(match[1])) {
        // Remove last character.
        value = value.slice(0, value.length - 1);
      }
    } else if ((match = sfxEdOrIng.exec(value)) && vowelInStem.test(match[1])) {
      value = match[1];

      if (sfxAtOrBlOrIz.test(value)) {
        // Append `e`.
        value += 'e';
      } else if (sfxMultiConsonantLike.test(value)) {
        // Remove last character.
        value = value.slice(0, value.length - 1);
      } else if (consonantLike.test(value)) {
        // Append `e`.
        value += 'e';
      }
    }

    // Step 1c.
    if ((match = sfxY.exec(value)) && vowelInStem.test(match[1])) {
      // Remove suffixing `y` and append `i`.
      value = match[1] + 'i';
    }

    // Step 2.
    if ((match = step2.exec(value)) && gt0.test(match[1])) {
      value = match[1] + step2list[match[2]];
    }

    // Step 3.
    if ((match = step3.exec(value)) && gt0.test(match[1])) {
      value = match[1] + step3list[match[2]];
    }

    // Step 4.
    if ((match = step4.exec(value))) {
      if (gt1.test(match[1])) {
        value = match[1];
      }
    } else if ((match = sfxIon.exec(value)) && gt1.test(match[1])) {
      value = match[1];
    }

    // Step 5.
    if (
      (match = sfxE.exec(value)) &&
      (gt1.test(match[1]) ||
        (eq1.test(match[1]) && !consonantLike.test(match[1])))
    ) {
      value = match[1];
    }

    if (sfxLl.test(value) && gt1.test(value)) {
      value = value.slice(0, value.length - 1);
    }

    // Turn initial `Y` back to `y`.
    if (firstCharacterWasLowerCaseY) {
      value = 'y' + value.slice(1);
    }

    return value
  }

  var soundex$1 = {exports: {}};

  /*
    Soundex - v0.2.1 - Node.js & Browser
    By Louis T. <louist@ltdev.im>
    https://github.com/LouisT/node-soundex/
  */

  (function (module, exports) {
  (function(Setup) {
    Setup(function (str,scale,mysql) {
            var split = String(str).toUpperCase().replace(/[^A-Z]/g,'').split(''),
                map = {BFPV:1,CGJKQSXZ:2,DT:3,L:4,MN:5,R:6},
                keys = Object.keys(map).reverse();
            var build = split.map(function (letter, index, array) {
                  for (var num in keys) {
                      if (keys[num].indexOf(letter) != -1) {
                         return map[keys[num]];
                      }                }          });
            if (mysql) {
               build = build.filter(function(key){return key;}); 
            }          var first = build.splice(0,1)[0];
            build = build.filter(function(num, index, array) {
                 return ((index===0)?num !== first:num !== array[index-1]);
            });
            var len = build.length,
                max = (scale?((max=~~((mysql?len:len*2/3.5)))>3?max:3):3);
            return split[0]+(build.join('')+(new Array(max+1).join('0'))).slice(0,max);
    });
  })((function(fn){module.exports=fn;}));
  }(soundex$1));

  var Soundex = soundex$1.exports;

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
  		return stemmer_1( w );
  	};
  }

  function soundex ( ) {
  	return function ( w ) {
  		return Soundex( w );
  	};
  }

  const stemmers = {
  	swedish: swedishStemmer,
  	english: englishStemmer
  };

  var processors = /*#__PURE__*/Object.freeze({
    __proto__: null,
    stemmers: stemmers,
    soundex: soundex,
    stopwords: stopwords,
    wordforms: wordforms,
    multiples: multiples,
    stripHtml: stripHtml,
    dashes: dashes
  });

  // Helper function for measuring execution time
  let time = (function () {
  	let times = {};

  	// Node 16, Deno, Browser
  	if (typeof performance !== "undefined" && performance) {
  		return function (id) {
  			let diff;

  			if (!times[id]) {
  				times[id] = performance.now();
  				return;
  			}

  			diff = performance.now() - times[id];
  			times[id] = undefined;

  			return diff;
  		};

  	// Node pre 16
  	} else {
  		return function (id) {
  			let diff;

  			if (!times[id]) {
  				times[id] = process.hrtime();
  				return;
  			}

  			diff = process.hrtime(times[id]);
  			times[id] = undefined;

  			return (diff[0] * 1e9 + diff[1]) / 1E6;
  		};
  	}
  }());

  // Helper function for option defaults
  function defaults (defaults, source) {
  	let obj,
  		key;

  	if (source) {

  		obj = {};

  		for (key in defaults) {
  			if (Object.prototype.hasOwnProperty.call(defaults, key)) {
  				obj[key] = (source[key] !== void 0) ? source[key] : defaults[key];
  			}
  		}

  		for (key in source) {
  			if (Object.prototype.hasOwnProperty.call(source, key)) {
  				if (defaults[key] === void 0 ) {
  					let err = new Error("Unknown key '" + key + "' in options ");
  					throw (err);
  				}
  			}
  		}

  	} else {

  		obj = defaults;

  	}

  	return obj;

  }

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

  /* Default ranker */
  function standard (options) {
  	
  	// Defaults
  	let	defaultFieldOptions = {
  		weight: 1,
  		boostPercentage: false
  	};

  	options = defaults({
  		exactHit: 1.5,
  		processedHit: 1,
  		partialHit: 0.5,
  		fields: {},
  		minimumWeight: 0
  	},options);

  	return function (resultSet, documents) {
  		
  		let	documentResultsFinal = [],
  			documentResultsLookup = {},

  			i, j,

  			documentId,
  			fieldIndex,
  			matchCount,

  			doc,

  			fieldOptions,
  			weight,

  			matches,
  			word,
  			match;

  		j = 0;
  		while ((word = resultSet.expressions[j++]))  {

  			matches = [
  				{
  					flag: 1,
  					rows: word.hits.partial,
  					weight: options.partialHit,
  					length: word.hits.partial.length
  				},
  				{
  					flag: 2,
  					rows: word.hits.processed,
  					weight: options.processedHit,
  					length: word.hits.processed.length
  				},
  				{
  					flag: 3,
  					rows: word.hits.exact,
  					weight: options.exactHit,
  					length: word.hits.exact.length
  				}
  			];

  			// Jump to processed if it"s empty
  			while((match = matches.pop())) {

  				for (i = 0; i < match.length; i) {

  					documentId = match.rows[i++];
  					fieldIndex = match.rows[i++];
  					matchCount = match.rows[i++];

  					// Ensure that document exists in results
  					if (documentResultsLookup[documentId] === void 0) {
  						documentResultsLookup[documentId] = documentResultsFinal.length;

  						doc = documentResultsFinal[documentResultsLookup[documentId]] = {
  							id: documentId,
  							weight: 0,
  							expressions: [],
  						};

  					} else {
  						doc = documentResultsFinal[documentResultsLookup[documentId]];	
  					}

  					// Don't do unnessesary work
  					if ( !doc.expressions[j-1] ) {

  						// Get the specific user-specified settings for the
  						// current field or fall back on the default settings. 
  						fieldOptions = options.fields[fieldIndex] || (options.fields[fieldIndex] = defaultFieldOptions);

  						// Multiply match weight with field-specific weight
  						weight = match.weight * fieldOptions.weight;

  						// For field with boostPercentage flag enabled - add extra weight the more of the field that is matched.
  						// 1 + (noOfMatchedWords / totalWordsInField)
  						if (fieldOptions.boostPercentage) {
  							weight *= (1 + 2.8*(matchCount / documents[documentId][fieldIndex + 2]));
  						}

  						doc.weight += weight;
  						doc.expressions[j-1] = match.flag;

  					}

  				}
  			}
  		}

  		// Postprocess resultset, multiplying total weight with a factor under certain circumstances,
  		let temp = [];
  		for ( i = 0; i < documentResultsFinal.length; i++) {
  			
  			let toss = false;

  			if ( documentResultsFinal[i].weight < options.minimumWeight ) {
  				toss = true;
  			} else {
  				// - Multiply document weight by a factor
  				for ( j = 0; j < resultSet.expressions.length; j++ ) {

  					if (!documentResultsFinal[i].expressions[j]) documentResultsFinal[i].expressions[j] = 0;

  					// Keep this row?
  					if ( resultSet.expressions[j].modifier === "-" && documentResultsFinal[i].expressions[j] > 0 ) {
  						toss = true;
  					} else if ( resultSet.expressions[j].modifier === "+" && documentResultsFinal[i].expressions[j] === 0) {
  						toss = true;
  					}
  				}
  			}

  			if (!toss) {
  				temp[temp.length] = documentResultsFinal[i];
  			} 

  		}

  		return temp;
  	};
  	
  }

  /* Rank by generic property */
  function property () {

  	return function (options) {

  		options = defaults({
  			resultSet: null,
  			index: null,
  			sortBy: null
  		},options);
  		
  		let	documentResultsFinal = [],
  			documentResultsLookup = {},

  			i, j,

  			documentId,

  			doc,

  			weight,

  			matches,
  			word,
  			match;

  		j = 0;
  		while ((word = options.resultSet.expressions[j++]))  {

  			matches = [
  				{
  					flag: 1,
  					rows: word.hits.partial,
  					weight: options.partialHit,
  					length: word.hits.partial.length
  				},
  				{
  					flag: 2,
  					rows: word.hits.processed,
  					weight: options.processedHit,
  					length: word.hits.processed.length
  				},
  				{
  					flag: 3,
  					rows: word.hits.exact,
  					weight: options.exactHit,
  					length: word.hits.exact.length
  				}
  			];

  			// Jump to processed if it"s empty
  			while((match = matches.pop())) {

  				for ( i = 0; i < match.length; i) {

  					documentId = match.rows[i++];
  					i++;	// Just iterate, dont' assign it to "fieldIndex" as this inst used here
  					i++;	// ... same for matchCount

  					// Ensure that document exists in results
  					if (documentResultsLookup[documentId] === void 0) {
  						documentResultsLookup[documentId] = documentResultsFinal.length;

  						doc = documentResultsFinal[documentResultsLookup[documentId]] = {
  							id: documentId,
  							weight: 0,
  							expressions: [],
  						};

  					} else {
  						doc = documentResultsFinal[documentResultsLookup[documentId]];	
  					}

  					// Don't do unnessesary work
  					if ( !doc.expressions[j-1] ) {

  						// Multiply match weight with field-specific weight
  						weight = options.index.getMetadata(documentId)[options.sortBy];

  						doc.weight += weight;
  						doc.expressions[j-1] = match.flag;

  					}

  				}
  			}
  		}

  		// Postprocess resultset, dropping records and stuff
  		let temp = [];
  		for ( i = 0; i < documentResultsFinal.length; i++) {
  			
  			let toss = false;

  			if ( documentResultsFinal[i].weight < options.minimumWeight ) {
  				toss = true;
  			} else {
  				for ( j = 0; j < options.resultSet.expressions.length; j++ ) {

  					if (!documentResultsFinal[i].expressions[j]) documentResultsFinal[i].expressions[j] = 0;

  					// Keep this row?
  					if ( options.resultSet.expressions[j].modifier === "-" && documentResultsFinal[i].expressions[j] > 0 ) {
  						toss = true;
  					} else if ( options.resultSet.expressions[j].modifier === "+" && documentResultsFinal[i].expressions[j] === 0) {
  						toss = true;
  					}
  				}
  			}

  			if (!toss) {
  				temp[temp.length] = documentResultsFinal[i];
  			} 

  		}

  		return temp;
  	};
  	
  }

  var rankers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    standard: standard,
    property: property
  });

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

  function processWord (word, opts) {

  	let result,
  		i;

  	// Check if the word is too short
  	if (!word || word.length < opts.minWordLen) {
  		return;
  	}

  	// Check if the word is too long
  	if (word.length > opts.maxWordLen) {
  		word = word.substring(0, opts.maxWordLen);
  	}

  	// Always convert everything to lowercase if not case sensitive
  	if (!opts.caseSensitive) {
  		word = word.toLowerCase();
  	}

  	// Prepare object
  	result = { original: word, preprocessed: undefined, processed: undefined };

  	// Apply all wordProcessors
  	for (i = 0; i < opts.wordPreProcessors.length; i++) {
  		if (!word) {
  			break;
  		}
  		
  		word = opts.wordPreProcessors[i](word);
  	}

  	// Check if the preprocessor disabled this word
  	if (!word) {
  		return;
  	}

  	result.preprocessed = word;

  	// Apply all wordProcessors
  	for (i = 0; i < opts.wordProcessors.length; i++) {
  		if (!word) {
  			break;
  		}
  		
  		word = opts.wordProcessors[i](word);
  	}

  	// Check if the wordProcessors disabled this word
  	if (!word) {
  		return;
  	}

  	// Save processed word
  	result.processed = word;

  	return result;
  }

  function Thinker (opts) {

  	let self = this;

  	// Optional `new` keyword
  	if (!(self instanceof Thinker)) {
  		return new Thinker(opts);
  	}

  	self.ranker = function() {};
  	self.propertyRanker = property();

  	// All these options must be set before indexing and
  	// cannot change afterwards (the object will also be frozen).
  	self.options = defaults({
  		characters: /([a-zA-Z0-9]*)/g,
  		caseSensitive: false,
  		minWildcardWordLen: 3,
  		maxWildcardWordLen: 32,
  		minWordLen: 2,
  		maxWordLen: 32,
  		wordProcessors: [],
  		wordPreProcessors: [],
  		fieldProcessors: [],
  		suggestionMinWordCount: 6,
  		enableSuggestions: false,
  		optionalPlusFromExpressions: 1,
  		concatenateWords: 1
  	}, opts );

  	// Changing settings after initializing the index would break things, we will try to prevent that
  	Object.freeze(self.options);

  	// Index backend
  	self.index = new Index(self.options);

  }

  Thinker.prototype.feed = function (texts, done) {

  	let self = this,
  		opts = self.options,
  		currentDocument,
  		currentField,
  		currentWord,
  		k;

  	if (done === undefined) done = true;

  	// Helper function adding a single word to the index
  	function addWord (word, docIdx, fieldIdx, augmented) {

  		let wIndex,
  			i, j;

  		// Add original, preprocessed and processed
  		wIndex = self.index.populatePreProcessed(word, docIdx, fieldIdx, (!augmented && opts.enableSuggestions) );
  		self.index.populateProcessed(word.processed, wIndex);

  		if (!augmented) {
  			for (i = opts.minWildcardWordLen; i < word.original.length && i < opts.maxWildcardWordLen; i++) {
  				for (j = 0; j < (word.original.length - i) + 1; j++) {
  					// Do not input partial if equals processed or equals original
  					if( word.preprocessed.substr(j,i) !== word.processed && word.preprocessed.substr(j,i) !== word.preprocessed ) {
  						self.index.populatePartial(word.preprocessed.substr(j, i), wIndex);
  					}
  				}
  			}
  		}

  	}

  	/* Stage 1, query index for each individual word */
  	while ( (currentDocument = texts.pop() ) ) {

  		// Add metatada for current document
  		let docIdx = self.index.populateDocuments(currentDocument.id, currentDocument.metadata);

  		// split text into separate words, removing empty results
  		// Loop through all textfields (index > 0)
  		for (let j = 0; j < currentDocument.fields.length; j++) {

  			// Extract current field
  			if ( (currentField = currentDocument.fields[j]) ) {

  				const wordHistory = [];

  				// Apply all fieldProcessors
  				for (let i = 0; i < opts.fieldProcessors.length; i++) {
  					if (currentField) {
  						currentField = opts.fieldProcessors[i](currentField);
  					}
  				}

  				// Split field into separate words
  				currentField = currentField.match(opts.characters);

  				// Extract unique words
  				for (k = 0; k < currentField.length; k++) {

  					// Check that the current word is't invalidated by the word processors, and add it to the index
  					if (currentWord !== "" && (currentWord = processWord(currentField[k], opts))) {
  						addWord(currentWord, docIdx, j);
  					}

  					// concatenate words (making separate words and written together words equal)
  					// This bypasses the valid word check, allowing single character words etc to be concatenated
  					if (opts.concatenateWords > 1 && currentField[k] !== "") {
  						
  						wordHistory.push(currentField[k]);

  						if (wordHistory.length > 1 ) {
  							for(let l = 0; l < wordHistory.length - 1; l++) {
  								let augmentedWord = processWord(wordHistory.slice(l,wordHistory.length).join(""), opts);
  								
  								// Check that current word wasnt removed (undefined) by processWord
  								if (augmentedWord) {
  									addWord(augmentedWord, docIdx, j, true);  	
  								}
  							}
  							if (wordHistory.length >= opts.concatenateWords) {
  								wordHistory.shift();
  							}

  						}

  					}

  				}

  			}

  		}

  	}

  	if (done) self.index.compress();

  };

  Thinker.prototype.addFieldProcessor = function (fn) {
  	return (this.options.fieldProcessors.push(fn), this);
  };

  Thinker.prototype.addWordPreProcessor = function (fn) {
  	return (this.options.wordPreProcessors.push(fn), this);
  };

  Thinker.prototype.addWordProcessor = function (fn) {
  	return (this.options.wordProcessors.push(fn), this);
  };

  Thinker.prototype.find = function (params) {

  	time("totalFindTime");

  	time("findTime");

  	// Allow search string instead of params
  	// Ignore that f-ed up strings can be typeof "object" :)
  	if (typeof params === "string") {
  		params = { expression: params };
  	}

  	// Exapand params with refaults
  	params = defaults({

  		// Search string
  		// Value: String
  		expression: null,

  		// Direction
  		// Value: Boolean
  		//   true = descending
  		//   false = ascending
  		direction: true,

  		// Filter function
  		// Filter results on
  		// filter: function (metadata) {
  		//   return metadata.active;	
  		// }
  		filter: null,

  		// Reduce function
  		// Reduce results on
  		// reduce: function (metadata) {
  		//   return ~metadata.tags.indexOf("atag");	
  		// }
  		reduce: null,

  		// Collect all possible values of the specified metadatakey into resultSet.collection[]
  		// Using filtered resultset
  		collectAll: null,
  		
  		// Collect values  of the specified metadatakey into resultSet.collection[]
  		// Using reduced resultset
  		collect: null,

  		// Sort by
  		// Value: String
  		//   sortBy: weight    <- Default, sort by ranker weight
  		//   sortBy: anything  <- Sort by metadata propert "anything"
  		sortBy: "weight",

  		// Limit number of results
  		// Value: null or integer
  		limit: null
  		
  	}, params);

  	// Handle inconsistencies
  	if (!params.expression) params.expression = "";

  	let self = this,

  		words,
  		word,

  		resultSet = { expressions: [], performance: {} },

  		queryResult,
  		suggestion,
  		i,

  		expression;

  	// Remove "loose" dashes
  	expression = params.expression.replace(/-\s+/g, " ");

  	// Remove dashes without space in front
  	expression = expression.replace(/([^\s]){1}-/, "$1");

  	// Replace multipla spaces with singles
  	expression = expression.replace(/\s+/g, " ");

  	// Remove leading and trailing spaces from search query
  	expression = expression.trim(" ");

  	// Split query into searate words on whitespace charcter
  	words = expression.split(" ");

  	for (i = 0; i < words.length; i++) {

  		let modifier=undefined, exact=false;

  		// Find modifiers, set flags, and remove their textual representation
  		// Plus modifier is automagically applied to each word(expression) if total
  		if ( ["+","-"].indexOf(words[i][0]) !== -1) {
  			modifier = words[i][0];
  			words[i] = words[i].substring(1,words[i].length);
  		} else {
  			// Default to plus modifier
  			if ( words.length < self.options.optionalPlusFromExpressions ) {
  				modifier = "+";
  			}
  		}

  		// Trigger exact mode
  		if ( words[i][0] === "\"" ) {
  			exact = true;
  		}
  		words[i] = words[i].replace(/"/g,"");

  		// Normalize and validate word
  		if (!(word = processWord(words[i], self.options))) {
  			continue;
  		}

  		//
  		queryResult = self.index.query(word, exact, params.filter);

  		// Enable suggestions if self.options.enableSuggestions is true 
  		suggestion = undefined;
  		if ((!queryResult.exact.length && !queryResult.processed.length) && self.options.enableSuggestions) {
  			suggestion = self.index.findClosestWord(word.original);
  		}

  		// Push this expression to result array
  		resultSet.expressions.push({
  			original: words[i],
  			interpretation: word,
  			suggestion: suggestion,
  			modifier: modifier,
  			exactMode: exact,
  			hits: queryResult
  		});

  	}

  	// Done finding
  	resultSet.performance.find = time("findTime");

  	// Start ranking
  	time("rankTime");

  	// Rank by weight
  	if (params.sortBy === "weight") {
  		resultSet.documents = self.ranker(resultSet, self.index.getDocuments());

  	// Rank by metadata
  	} else {
  		resultSet.documents = self.propertyRanker({
  			resultSet: resultSet,
  			index: self.index,
  			sortBy: params.sortBy
  		});

  	}

  	// Done ranking
  	resultSet.performance.rank = time("rankTime");

  	// Start filtering
  	time("filterTime");

  	resultSet.totalHits = resultSet.documents.length;

  	// Remove expression[m].hits from resultset, not needed anymore
  	for (i = 0; i < resultSet.expressions.length; i++) {
  		delete resultSet.expressions[i].hits;
  	}

  	// Restore document ids,  append meta
  	if (params.collect || params.collectAll) resultSet.collections = {};

  	// Create collection objects
  	if (params.collect) {
  		resultSet.collections.reduced = {};
  		for( let c = 0 ; c < params.collect.length ; c++ ) {
  			if (resultSet.collections.reduced[params.collect[c]] === undefined) {
  				resultSet.collections.reduced[params.collect[c]] = new Map();
  			}
  		}
  	}
  	if (params.collectAll) {
  		resultSet.collections.filtered = {};
  		for( let c = 0 ; c < params.collectAll.length ; c++ ) {
  			if (resultSet.collections.filtered[params.collectAll[c]] === undefined) {
  				resultSet.collections.filtered[params.collectAll[c]] = new Map();
  			}
  		}
  	}

  	for (i = 0; i < resultSet.documents.length; i++) {
  		
  		let docIdx = resultSet.documents[i].id;

  		// Restore metadata and document id
  		resultSet.documents[i].metadata = self.index.getMetadata(docIdx);
  		resultSet.documents[i].id = self.index.docIndexToId(resultSet.documents[i].id);

  		// Need to collect?
  		if (params.collectAll && params.collectAll.length) for( let c = 0 ; c < params.collectAll.length ; c++ ) {
  			
  			let collectedMetaKey = params.collectAll[c],
  				currentDocument = resultSet.documents[i];

  			// Sanity check
  			if (collectedMetaKey && currentDocument.metadata && currentDocument.metadata[collectedMetaKey]) {
  				let currentMetadata = currentDocument.metadata[collectedMetaKey];

  				// If metadata is an array, collect each array element
  				if (Array.isArray(currentMetadata)) {
  					for(let j = 0; j < currentMetadata.length; j++) {
  						let count = resultSet.collections.filtered[collectedMetaKey].get(currentMetadata[j]) || 0;
  						resultSet.collections.filtered[collectedMetaKey].set(currentMetadata[j], ++count);
  					}
  				} else {
  					let count = resultSet.collections.filtered[collectedMetaKey].get(currentMetadata) || 0;
  					resultSet.collections.filtered[collectedMetaKey].set(currentMetadata, ++count);
  				}

  			}

  		}

  	}

  	// Reduce results
  	if (params.reduce) {
  		let tmpRes = [];
  		for (i = resultSet.documents.length -1; i >= 0; i--) {
  			if (params.reduce(resultSet.documents[i].metadata)) {
  				tmpRes.push(resultSet.documents[i]);
  			}
  		}
  		resultSet.documents = tmpRes;
  	}

  	// Collect from reduced resultSet
  	if (params.collect) {
  		for( let c = 0 ; c < params.collect.length ; c++ ) {

  			let collectedMetaKey = params.collect[c];

  			for (i = 0; i < resultSet.documents.length; i++) {

  				let currentDocument = resultSet.documents[i];

  				// Sanity check
  				if (collectedMetaKey && currentDocument.metadata && currentDocument.metadata[collectedMetaKey]) {
  					let currentMetadata = currentDocument.metadata[collectedMetaKey];

  					// If metadata is an array, collect each array element
  					if (Array.isArray(currentMetadata)) {
  						for(let j = 0; j < currentMetadata.length; j++) {
  							let count = resultSet.collections.reduced[collectedMetaKey].get(currentMetadata[j]) || 0;
  							resultSet.collections.reduced[collectedMetaKey].set(currentMetadata[j], ++count);
  						}
  					} else {
  						let count = resultSet.collections.reduced[collectedMetaKey].get(currentMetadata) || 0;
  						resultSet.collections.reduced[collectedMetaKey].set(currentMetadata, ++count);
  					}
  				}

  			}
  		}
  	}

  	// Start sorting
  	time("sortTime");

  	// Sort documents by total weight
  	resultSet.documents = resultSet.documents.sort(function(a, b) {
  		return params.direction ? (b.weight - a.weight) : (a.weight - b.weight);
  	});

  	// Done sorting
  	resultSet.performance.sort = time("sortTime");
  	
  	// Limit results, if needed
  	if (params.limit && resultSet.documents.length > params.limit) {
  		resultSet.documents = resultSet.documents.slice(0, params.limit);
  	}

  	resultSet.returnedHits = resultSet.documents.length;

  	resultSet.performance.filter = time("filterTime");

  	resultSet.performance.total = time("totalFindTime");

  	return resultSet;

  };

  Thinker.processors = processors;
  Thinker.rankers = rankers;

  return Thinker;

}));
