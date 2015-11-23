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

/* Default ranker */
function standard( options ) {

	var	currentExpression,
		currentMatch,
		currentMatchWeight,
		currentFieldWeight,
		currentDocument,

		i, j, k, found, // iterators

		// Defaults
		options = options || {
			directHit: 1,
			partialHit: 0.5,
			eachPartialExpressionFactor: 1.5,
			eachDirectExpressionFactor: 2,
			fields: {
				1: { weight: 1, boostPercentage: false },
				2: { weight: 1, boostPercentage: false },
				3: { weight: 1, boostPercentage: false },
				4: { weight: 1, boostPercentage: false },
				5: { weight: 1, boostPercentage: false },
				6: { weight: 1, boostPercentage: false },
				7: { weight: 1, boostPercentage: false },
				8: { weight: 1, boostPercentage: false },
				9: { weight: 1, boostPercentage: false }
			}
		};

	return  function ( resultSet, wordCount ) {

		var	documentResultsFinal = [],
			documentResults = {},

			directMatches,
			partialMatches,

			currentDocument,

			i, j,

			// Helper function to create or get a document result object
			getResultObj = function (docId) {
				var doc;
				if ( !(doc = documentResults[docId]) ) {
					doc = documentResults[docId] = {
						id: docId,
						weight: 0,
						expressions: []
					};
				}
				return doc;
			};

		// Find all documents
		for ( j = 0; j < resultSet.expressions.length; j++ ) {

			currentExpression = resultSet.expressions[j];

			directMatches = currentExpression.hits.direct;
			partialMatches = currentExpression.hits.partial;

			// Create result object
			if (directMatches !== undefined ) {
				for( i = 0; i < directMatches.length; i+=3 ) {
					currentDocument = getResultObj (directMatches[i]);
					if ( options.fields[directMatches[i+1]].boostPercentage ) {
						currentDocument.weight += 
							options.directHit 
							* options.fields[directMatches[i+1]].weight
							* (1+(directMatches[i+2]/wordCount[currentDocument.id][directMatches[i+1]-1]));
					} else {
						currentDocument.weight += options.directHit * options.fields[directMatches[i+1]].weight;
					}
					currentDocument.expressions[j] = 2;
				}
			}

			if (partialMatches !== undefined ) {
				for( i = 0; i < partialMatches.length; i+=3 ) {
					currentDocument = getResultObj (partialMatches[i]);
					if ( options.fields[partialMatches[i+1]].boostPercentage ) {
						currentDocument.weight += 
							options.partialHit 
							* options.fields[partialMatches[i+1]].weight
							* (1+(partialMatches[i+2]/wordCount[currentDocument.id][partialMatches[i+1]-1]));
					} else {
						currentDocument.weight += options.partialHit * options.fields[partialMatches[i+1]].weight;
					}
					if (!currentDocument.expressions[j]) currentDocument.expressions[j] = 1;
				}
			}

		};

		// Convert document results from object to array (to be sortable)
		documentResultsFinal = Object.keys(documentResults).map(function (key) { return documentResults[key]; });

		// Sort documents by total weight
		documentResultsFinal.sort(function(a, b) {
			return b.weight - a.weight
		});

		// Postprocess resultset, multiplying total weight with a factor under certain circumstances
		for ( i = 0; i < documentResultsFinal.length; i++) {
			for ( j = 0; j < resultSet.expressions.length; j++ ) {
				// - Add extra weight if all expressions matched directly
				
				// 2 == Exact match
				if (documentResultsFinal[i].expressions[j]==2) {
					documentResultsFinal[i].weight *= options.eachDirectExpressionFactor;
				// 1 == Partial match
				} else if (documentResultsFinal[i].expressions[j]==1) {
					documentResultsFinal[i].weight *= options.eachPartialExpressionFactor;
				// Else set to zero
				} else {
					documentResultsFinal[i].expressions[j] = 0;
				}
				
			}
		}
		
		resultSet = documentResultsFinal;

		return resultSet;
	}
	
};

module.exports = {
	standard: standard
}