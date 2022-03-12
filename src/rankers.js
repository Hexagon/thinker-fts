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

let utils = require("./utils.js");

/* Default ranker */
function standard (options) {
	
	// Defaults
	let	defaultFieldOptions = {
		weight: 1,
		boostPercentage: false
	};

	options = utils.defaults({
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

		options = utils.defaults({
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

module.exports = {
	standard: standard,
	property: property
};