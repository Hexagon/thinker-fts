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

var levenshtein = require('./levenshtein.js');

function index() {

	var data = [],
		lookupPartial = {},
		lookupFull = {},
		lookupOriginal = {},

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


		exports = {
			populatePartial: function ( location, word ) {

				var i, location;

			    // Add object
			    if(lookupPartial[location] === undefined) {
			    	lookupPartial[location] = [word];
			    } else {
			    	// Only insert if not already existing
			    	if( lookupPartial[location].indexOf(word) === -1) {
			    		lookupPartial[location].push(word);
			    	}
			    }
			},
			populate: function ( location, docId, fieldIdx ) {

			    // Add object
			    var i,j,
			    	indexProcessed,
			    	indexOriginal,
			    	match,found;

			    indexProcessed = lookupFull[location.processed];
			    indexOriginal = lookupOriginal[location.original];

			    // Index processed
				if(indexProcessed === undefined) {
					indexProcessed = data.length;
			    	lookupFull[location.processed] = indexProcessed;
			    	data[indexProcessed] = [docId, fieldIdx, 1];
			    } else {
			    	found = false;
			    	match = data[indexProcessed];
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

			    // Index original
				if(indexOriginal === undefined) {
			    	lookupOriginal[location.original] = true;
			    }

			    return indexProcessed;

			},
			query: function ( location, exact ) {
				var result = ((index = lookupFull[location.processed]) !== undefined) ? data[index] : undefined,
					resultPartial = queryPartial( location.original ) || queryPartial( location.partial );

			    // Add object
			    return { direct: result, partial: resultPartial };
			},
			getData: function ( ) {
				return [data,lookupPartial,lookupFull,lookupOriginal];
			},
			setData: function ( d ) {
				data = d[0];
				lookupPartial = d[1];
				lookupFull = d[2];
				lookupOriginal = d[3];
			},
			findClosestWord: function ( w ) {
				var i, closestValue = Infinity, closestIndex, distance;

				// Convert to array on first run
				if ( Object.prototype.toString.call( lookupOriginal ) !== '[object Array]' ) {
					lookupOriginal = Object.keys(lookupOriginal).map(function (key) { return key; });
				}

				for (i = 0; i < lookupOriginal.length; i++) {
					distance = levenshtein.get(w, lookupOriginal[i]);
					if (distance < closestValue) {
						closestIndex = i;
						closestValue = distance;
					}
				}


				if (closestIndex !== undefined) {
					return lookupOriginal[closestIndex];
				}
			}
		};
	return exports;
}

module.exports = index;