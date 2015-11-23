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

var levenshtein = require('fast-levenshtein');

function index(opts) {

	var	options = opts,
		data = [],
		lookupPartial = {},
		lookupProcessed = {},
		lookupOriginal = {},
		lookupSuggestion = {},
		wordCount = {},

		i, found,

		concatArray = function ( arr1, arr2 ) {
			var newIdx = arr1.length-1, i;
			for(i = 0; i < arr2.length; ++i) {
				arr1[++newIdx] = arr2[i];
			}
		},

		queryPartial = function ( location ) {

			// Add object
			var words = lookupPartial[location],
				currentResult,
				result = [],
				i;

			if( words !== undefined ) {
				for( i = 0; i < words.length; i++) {
					currentResult = data[words[i]];
					concatArray (result, currentResult);
				}
				return result;
			} else {
				return undefined;
			}

		},

		queryProcessed = function ( location ) {

			// Add object
			var words = lookupProcessed[location],
				currentResult,
				result = [],
				i;

			if( words !== undefined ) {
				for( i = 0; i < words.length; i++) {
					currentResult = data[words[i]];
					concatArray (result, currentResult);
				}
				return result;
			} else {
				return undefined;
			}

		},

		exports = {
			populateProcessed: function ( location, wordIdx ) {

				var i, location;

				// Add object
				if(lookupProcessed[location] === undefined) {
					lookupProcessed[location] = [wordIdx];
				} else {
					// Only insert if not already existing
					if( lookupProcessed[location].indexOf(wordIdx) === -1) {
						lookupProcessed[location].push(wordIdx);
					}
				}

			},
			populatePartial: function ( location, wordIdx ) {

				var i, location;

				// Add object
				if(lookupPartial[location] === undefined) {
					lookupPartial[location] = [wordIdx];
				} else {
					// Only insert if not already existing
					if( lookupPartial[location].indexOf(wordIdx) === -1) {
						lookupPartial[location].push(wordIdx);
					}
				}

			},
			populate: function ( location, docId, fieldIdx ) {

				// Add object
				var i,j,
					indexProcessed,
					indexOriginal,
					indexSuggestion,
					match,
					found;

				// Index original words
				if(indexOriginal === undefined) {
					indexOriginal = data.length;
					lookupOriginal[location.original] = indexOriginal;
					data[indexOriginal] = [docId, fieldIdx, 1];
				} else {
					found = false;
					match = data[indexOriginal];
					for (i = 0; i < match.length; i+=3) {
						if(match[i] === docId && match[i+1] === fieldIdx ) {
							match[i+2]++;
							found = true;
							break;
						}
					}
					if (!found) {
						match.push(docId, fieldIdx, 1);
					}
				}

				// Update wordcount of current document and field
				if (wordCount[docId] === undefined ) {
					wordCount[docId] = [];
				}
				wordCount[docId][fieldIdx-1] = (wordCount[docId][fieldIdx-1] || 0) + 1;

				// Index original words for expression suggestions, this is filtered on
				// first run of 'findClosestWord'
				indexSuggestion = lookupSuggestion[location.original];
				if(indexSuggestion === undefined) {
					lookupSuggestion[location.original] = 1;
				} else {
					lookupSuggestion[location.original]++;
				}

				return indexOriginal;

			},
			query: function ( location, exact ) {
				var direct,
					partial;

				if ( exact ) {
					direct = ((index = lookupOriginal[location.original]) !== undefined) ? data[index] : undefined;	
				} else {
					direct = queryProcessed( location.processed );	
				}
				partial = queryPartial( location.original ) || queryPartial( location.partial );

				// Add object
				return {
					direct: direct || [],
					partial: partial || []
				};
			},
			getWordCount: function ( ) {
				return wordCount;
			},
			getData: function ( ) {
				return [data,lookupPartial,lookupProcessed,lookupOriginal,lookupSuggestion,wordCount];
			},
			setData: function ( d ) {
				data = d[0];
				lookupPartial = d[1];
				lookupProcessed = d[2];
				lookupOriginal = d[3];
				lookupSuggestion = d[4];
				wordCount = d[5];
					
			},
			findClosestWord: function ( w ) {
				var i, closestValue = Infinity, closestIndex, distance;

				// Convert to array and filter on first run
				if ( Object.prototype.toString.call( lookupSuggestion ) !== '[object Array]' ) {
					var result = [];
					Object.keys(lookupSuggestion).forEach(function (key) { 
						if (lookupSuggestion[key] >= options.suggestionMinWordCount) {
							result.push(key);
						}
					});
					lookupSuggestion = result;
				}

				for (i = 0; i < lookupSuggestion.length; i++) {
					distance = levenshtein.get(w, lookupSuggestion[i]);
					if (distance < closestValue) {
						closestIndex = i;
						closestValue = distance;
					}
				}

				if (closestIndex !== undefined && closestValue < 5) {
					return lookupSuggestion[closestIndex];
				}
			}
		};
	return exports;
}

module.exports = index;