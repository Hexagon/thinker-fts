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

var utils = require('./utils.js');

/* Default ranker */
function standard (options) {
	
	// Defaults
	var	defaultFieldOptions = {
			weight: 1,
			boostPercentage: false
		},

		options = utils.defaults({
			directHit: 1,
			partialHit: 0.5,
			eachPartialExpressionFactor: 1.5,
			eachDirectExpressionFactor: 2,
			fields: {},
			minimumWeight: 0
		},options);

	return function (resultSet, wordCount) {
		
		var	documentResultsFinal = [],
			documentResults = {},

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
					flag: 2,
					rows: word.hits.direct,
					weight: options.directHit,
					length: word.hits.direct.length
				},
				{
					flag: 1,
					rows: word.hits.partial,
					weight: options.partialHit,
					length: word.hits.partial.length
				}
			];

			// Get first match (partial)
			match = matches.pop();

			// Jump to partials if it's empty
			if (!match.length) {
				match = matches.pop();
			}

			for (i = 0; i < match.length; i) {
				documentId = match.rows[i++];
				fieldIndex = match.rows[i++];
				matchCount = match.rows[i++];

				// Get the specific user-specified settings for the
				// current field or fall back on the default settings. 
				fieldOptions = options.fields[fieldIndex] || (options.fields[fieldIndex] = defaultFieldOptions);

				// Multiply match weight with field-specific weight
				weight = match.weight * fieldOptions.weight;

				// For field with boostPercentage flag enabled - add extra weight the more of the field that is matched.
				// 1 + (noOfMatchedWords / totalWordsInField)
				if (fieldOptions.boostPercentage) {
					weight *= (1 + 2.8*(matchCount / wordCount[documentId][fieldIndex - 1]));
				}

				doc = documentResults[documentId]  || (documentResults[documentId] = {
					id: documentId,
					weight: 0,
					expressions: []
				});

				doc.weight += weight;
				doc.expressions[j-1] = match.flag;

				// Jump to the next match when the current is exhausted
				if (i === match.length && matches.length) {
					match = matches.pop();
					i = 0;
				}

			}
		}

		// Convert document results from object to array (to be sortable)
		documentResultsFinal = Object.keys(documentResults).map(function (key) { return documentResults[key]; });

		// Sort documents by total weight
		documentResultsFinal.sort(function(a, b) {
			return b.weight - a.weight;
		});

		// Postprocess resultset, multiplying total weight with a factor under certain circumstances,
		var temp = [];
		for ( i = 0; i < documentResultsFinal.length; i++) {
			
			var toss = false;

			if ( documentResultsFinal[i].weight < options.minimumWeight ) {

				toss = true;

			} else {

				// - Multiply document weight by a factor
				for ( j = 0; j < resultSet.expressions.length; j++ ) {
					
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

					// Keep this row?
					if ( resultSet.expressions[j].modifier === "-" && documentResultsFinal[i].expressions[j] > 0 ) {
						toss = true;
					} else if ( resultSet.expressions[j].modifier === "+" && documentResultsFinal[i].expressions[j] === 0) {
						toss = true;
					}
				}

			}

			if (!toss) {
				temp.push(documentResultsFinal[i]);
			} 

		}
		
		resultSet = temp;

		return resultSet;
	}
	
};

module.exports = {
	standard: standard
}