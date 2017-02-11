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

var levenshtein = require("fast-levenshtein"),
	msgpack = require("msgpack-lite"),
	fs = require('fs');

function index(options) {

	var	
		// 	Array of Array with DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField
		//  Index of outer array is WordIndex, matched to an actual word through lookupOriginal, lookupPartial, lookupProcessed och lookupPreProcessed
		// 	[
		// 		[DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, ... ], 
		// 		[DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, ... ],
		// 		[DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, ... ],
		// 		[DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, DocumentIndex, FieldIndex, OcurrencesOfWordInCurrentDocumentAndField, ... ]
		//  }
		data = [],

		// Lookup Maps of original, partial, processed and preprocessed words
		//	{
		//		"ActualWord": WordIndexIn data
		//	}
		lookupOriginal = new Map(null),
		lookupPartial = new Map(null),
		lookupProcessed = new Map(null),
		lookupPreProcessed = new Map(null),

		// Map of every word and how many times it is used
		lookupSuggestion = new Map(null),

		// Map documentIndex => {
		// 	supplied: "Document metadata"	
		// }
		lookupMetadata = new Map(null),

		// Map documentId: documentIndex
		lookupDocId = new Map(null),

		// Map documentIndex: documentId
		lookupDocIdReverse = new Map(null),

		// Keep track of next available unique documentId
		currentDocIndex = 0,

		// Keep track of number of words in each document and field
		wordCount = Object.create(null),

		query = function ( location, lookupMap, filterFunc ) {

			// Add object
			var words = lookupMap.get(location),
				arr1 = [],
				arr2,
				i,
				newIdx,
				idx,
				idxKey,
				iEntry,

				subroutine = function (word, arr1) {

					arr2 = data[word];
					idx = new Map();

					for(var j = 0; j < arr2.length; j+=3) {

						if ( ! ( filterFunc && !filterFunc(lookupMetadata.get(arr2[j])))) {

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

			if( words !== undefined ) {

				if (words.constructor === Array) {
					for( i = 0; i < words.length; i++) {
						subroutine(words[i], arr1);
					}
				} else {
					subroutine(words, arr1);
				}

				return arr1;
			} else {
				return;
			}

		},

		populate = function ( location, wordIdx, lookup ) {

			var dest = lookup.get(location);

			// Add object
			if(dest === undefined) {
				lookup.set(location,[wordIdx]);

			} else {
				// Only insert if not already existing
				if( dest.indexOf(wordIdx) === -1) {
					dest[dest.length] = wordIdx;
				}

			}

		},

		docIdToIndex = function (docId) {
			let d = lookupDocId.get(docId);
			if(d === undefined) {
				d = currentDocIndex++;
				lookupDocId.set(docId, d);
				lookupDocIdReverse.set(d, docId);
			}
			return d; 
		},

		docIndexToId = function (docIndex) {
			return lookupDocIdReverse.get(docIndex);
		},

		toObject = function () {
			return {
				data: data,
				lookupOriginal: [...lookupOriginal],
				lookupPartial: [...lookupPartial],
				lookupProcessed: [...lookupProcessed],
				lookupPreProcessed: [...lookupPreProcessed],
				lookupSuggestion: [...lookupSuggestion],
				lookupMetadata: [...lookupMetadata],
				lookupDocId: [...lookupDocId],
				lookupDocIdReverse: [...lookupDocIdReverse],
				currentDocIndex: currentDocIndex,
				wordCount: wordCount
			};
		},

		fromObject = function (o) {
			data = o.data;
			lookupOriginal = new Map(o.lookupOriginal);
			lookupPartial = new Map(o.lookupPartial);
			lookupProcessed = new Map(o.lookupProcessed);
			lookupPreProcessed = new Map(o.lookupPreProcessed);
			lookupSuggestion = new Map(o.lookupSuggestion);
			lookupMetadata = new Map(o.lookupMetadata);
			lookupDocId = new Map(o.lookupDocId);
			lookupDocIdReverse = new Map(o.lookupDocIdReverse);
			currentDocIndex = o.currentDocIndex;
			wordCount = o.wordCount;
		};

	exports = {
		populatePartial: function ( location, wordIdx ) {
			populate( location, wordIdx, lookupPartial);
		},
		populateProcessed: function ( location, wordIdx ) {
			populate( location, wordIdx, lookupProcessed);
		},
		populatePreProcessed: function ( location, wordIdx ) {
			populate( location, wordIdx, lookupPreProcessed);
		},
		populateMetadata: function (docid, meta) {
			lookupMetadata.set(docIdToIndex(docid), meta);
		},
		getMetadata: function (docidx) {
			return lookupMetadata.get(docidx);
		},
		docIndexToId: docIndexToId,
		populate: function ( location, docId, fieldIdx ) {

			var 
				docIdx = docIdToIndex(docId),
				i,
				indexOriginal,
				suggestionCounter,
				match,
				found;

			// Index original words
			indexOriginal = lookupOriginal.get(location.original);
			if(indexOriginal === undefined) {
				indexOriginal = data.length;
				lookupOriginal.set(location.original, indexOriginal);
				data[indexOriginal] = [docIdx, fieldIdx, 1];
			} else {
				found = false;
				match = data[indexOriginal];
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
			if (wordCount[docIdx] === undefined ) {
				wordCount[docIdx] = [];
			}
			wordCount[docIdx][fieldIdx-1] = (wordCount[docIdx][fieldIdx-1] || 0) + 1;

			// Index original words for expression suggestions, this is filtered on
			// first run of 'findClosestWord'
			suggestionCounter = lookupSuggestion.get(location.original);
			if(suggestionCounter === undefined) {
				lookupSuggestion.set(location.original,1);
			} else {
				lookupSuggestion.set(location.original,++suggestionCounter);
			}

			return indexOriginal;

		},
		query: function ( location, exact, filterFunc ) {

			var hits = {};

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
		getWordCount: function ( ) {
			return wordCount;
		},
		findClosestWord: function ( w ) {
			var closestValue = Infinity, closestIndex, distance;
			lookupSuggestion.forEach(function(value, key) {
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
		},
		toDisk: function (path, callback) {
			var binaryData = msgpack.encode(toObject());
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
		}
	};
	return exports;
}

module.exports = index;