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

import { Index } from "./index.js";
import * as processors from "./processors.js";
import * as rankers from "./rankers.js";
import { defaults, time } from "./utils.js";

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
	self.propertyRanker = rankers.property();

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
								
								// Check that current word wasn't removed (undefined) by processWord
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

export default Thinker;
export { Thinker };
