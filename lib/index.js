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

var levenshtein = require('fast-levenshtein');

function index(options) {

	var	data = [],
		lookupPartial = new Map(null),
		lookupProcessed = new Map(null),
		lookupOriginal = new Map(null),
		lookupSuggestion = new Map(null),
		wordCount = new Object(null),

		found,

		concatArray = function ( arr1, arr2 ) {
			var j, i, found, newIdx;
			for(i = 0; i < arr2.length; i+=3) {
				found = false;
				for(j = 0; j < arr1.length; j+=3) {
					if (arr2[i] == arr1[j] && arr2[i+1] == arr1[j+1]) {
						arr1[j+2]++;
						found = true;
						break;
					}
				}
				if (!found) {
					newIdx = arr1.length-1;
					arr1[++newIdx] = arr2[i];
					arr1[++newIdx] = arr2[i+1];
					arr1[++newIdx] = arr2[i+2];
				}
			}
			return arr1;
		},

		queryPartial = function ( location ) {

			// Add object
			var words = lookupPartial.get(location),
				currentResult,
				result = [],
				i;

			if( words !== undefined ) {
				for( i = 0; i < words.length; i++) {
					currentResult = data[words[i]];
					result = concatArray (result, currentResult);
				}
				return result;
			} else {
				return undefined;
			}

		},

		queryProcessed = function ( location ) {

			// Add object
			var words = lookupProcessed.get(location),
				currentResult,
				currentIndex,
				addedIndex = [],
				result = [],
				i;

			if( words !== undefined ) {
				for( i = 0; i < words.length; i++) {
					currentResult = data[words[i]];
					result = concatArray (result, currentResult);
				}
				return result;
			} else {
				return undefined;
			}

		},

		exports = {
			populateProcessed: function ( location, wordIdx ) {

				var i, location, dest = lookupProcessed.get(location);

				// Add object
				if(dest === undefined) {
					lookupProcessed.set(location,[wordIdx]);
				} else {
					// Only insert if not already existing
					if( dest.indexOf(wordIdx) === -1) {
						dest.push(wordIdx);
					}
				}

			},
			populatePartial: function ( location, wordIdx ) {

				var i, location, dest = lookupPartial.get(location);

				// Add object
				if(dest === undefined) {
					lookupPartial.set(location,[wordIdx]);
				} else {
					// Only insert if not already existing
					if( dest.indexOf(wordIdx) === -1) {
						dest.push(wordIdx);
					}
				}

			},
			populate: function ( location, docId, fieldIdx ) {

				// Add object
				var i,
					indexOriginal,
					indexSuggestion,
					match,
					found;

				// Index original words
				indexOriginal = lookupOriginal.get(location.original);
				if(indexOriginal === undefined) {
					indexOriginal = data.length;
					lookupOriginal.set(location.original,indexOriginal);
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
				indexSuggestion = lookupSuggestion.get(location.original);
				if(indexSuggestion === undefined) {
					lookupSuggestion.set(location.original,1);
				} else {
					lookupSuggestion.set(location.original,indexSuggestion++);
				}

				return indexOriginal;

			},
			query: function ( location, exact ) {
				var direct,
					partial;

				if ( exact ) {
					direct = ((index = lookupOriginal.get(location.original)) !== undefined) ? data[index] : undefined;	
				} else {
					direct = queryProcessed( location.processed );
					if ( (partial = queryPartial( location.original )) === undefined ) partial = queryPartial( location.processed );
				}

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
				lookupSuggestion.forEach(function(value,key) {
					if(value >= options.suggestionMinWordCount) {
						distance = levenshtein.get(w, key);
						if (distance < closestValue) {
							closestIndex = key;
							closestValue = distance;
						}
					} else {
						lookupSuggestion.delete(key);
					}
				});

				if (closestIndex !== undefined && closestValue < 5) {
					return closestIndex;
				}
			}
		};
	return exports;
}

module.exports = index;