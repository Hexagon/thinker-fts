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

function index(options) {

	var	data = [],
		lookupPartial = new Object(null),
		lookupProcessed = new Object(null),
		lookupSuggestion = new Object(null),
		wordCount = new Object(null),

		i, found,

		concatArray = function ( arr1, arr2 ) {
			var j, i, found;
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
					var newIdx = arr1.length-1;
					arr1[++newIdx] = arr2[i];
					arr1[++newIdx] = arr2[i+1];
					arr1[++newIdx] = arr2[i+2];
				}
			}
			return arr1;
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
					result = concatArray (result, currentResult);
				}
				return result;
			} else {
				return undefined;
			}

		},

		exports = {
			stats: function () {

				var commonWords = [],i;

				Object.keys(lookupProcessed).forEach(function(key) {
					commonWords.push([key,data[lookupProcessed[key]].length/3]);
				});

				commonWords.sort(function(a,b) {
					return b[1] - a[1];
				});
				
				return {
					commonWords: commonWords.splice(0,20),
					uniqueWords: {
						processed: Object.keys(lookupProcessed).length,
						partial: Object.keys(lookupPartial).length,
						suggestions: Object.keys(lookupSuggestion).length
					}
				};
				
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
				var i,
					indexOriginal,
					indexSuggestion,
					match,
					found;

				// Index original words
				indexOriginal = lookupProcessed[location.processed];
				if(indexOriginal === undefined) {
					indexOriginal = data.length;
					lookupProcessed[location.processed] = indexOriginal;
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
					direct = ((index = lookupProcessed[location.processed]) !== undefined) ? data[index] : undefined;	
				} else {
					direct = ((index = lookupProcessed[location.processed]) !== undefined) ? data[index] : undefined;	
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
				return [data,lookupPartial,lookupProcessed,lookupSuggestion,wordCount];
			},
			setData: function ( d ) {
				data = d[0];
				lookupPartial = d[1];
				lookupProcessed = d[2];
				lookupSuggestion = d[3];
				wordCount = d[4];
					
			},
			findClosestWord: function ( w ) {
				var i, closestValue = Infinity, closestIndex, distance;

				// Convert to array and filter on first run
				if ( !lookupSuggestion.length ) {
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