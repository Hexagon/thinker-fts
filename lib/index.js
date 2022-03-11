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

let levenshtein = require("fast-levenshtein"),
	msgpack = require("msgpack-lite"),
	fs = require("fs");

function index(options) {

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

		},

		toObject = function () {
			return {

				// Array
				words: words,
				documents: documents,

				// Maps (EcmaScript note, when dropping support for ES5, change these to lookup: [...lookupMap])
				lookupPreProcessed: Array.from(lookupPreProcessed.entries()),

				lookupPartial: Array.from(lookupPartial.entries()),
				lookupProcessed: Array.from(lookupProcessed.entries()),
				lookupSuggestion: Array.from(lookupSuggestion.entries())

			};
		},

		fromObject = function (o) {
			
			words = o.words;
			documents = o.documents;

			lookupPreProcessed = new Map(o.lookupPreProcessed);

			lookupPartial = new Map(o.lookupPartial);
			lookupProcessed = new Map(o.lookupProcessed);
			lookupSuggestion = new Map(o.lookupSuggestion);

		};

	exports = {
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
		toDisk: function (path, callback) {
			let binaryData = msgpack.encode(toObject());
			fs.writeFile(path, binaryData, function(err) {
				if(err) {
					callback(err);
				} else {
					callback();
				}
			});
		},
		fromDisk: function (path, callback) {
			fs.readFile(path, function (err, data) {
				if (err) {
					callback(err);
				} else {
					try {
						fromObject(msgpack.decode(data));
						callback();
					} catch (e) {
						callback(e);
					}
				}
			});
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
	return exports;
}

module.exports = index;