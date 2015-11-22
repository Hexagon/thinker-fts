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

/* ToDo:

	* Vikta titel efter hur mycket plats sökorden tar i titeln
	* Missingspacesnurra

*/

var	Index = require('./index.js'),
	processors = require('./processors.js'),
	rankers = require('./rankers.js');

// Helper function for measuring execution time
var time = (function () {
	var times = {};

	return function (id) {
		var diff;

		if (!times[id]) {
			times[id] = process.hrtime();
			return;
		}

		diff = process.hrtime(times[id]);
		times[id] = null;

		return (diff[0] * 1e9 + diff[1]) / 1E6;
	};
}());

// Helper function for option defaults
function defaults (defaults, source) {
	var obj = {},
		key;

	if (!source) {
		return defaults;
	}

	for (key in defaults) {
		obj[key] = (source[key] !== undefined) ? source[key] : defaults[key];
	}

	return obj;
}

function processWord (word, opts) {
	var result,
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
	result = { original: word, processed: undefined };

	// Apply all wordProcessors
	for (i = 0; i < opts.wordProcessors.length; i++) {
		if (!word) {
			break;
		}
		
		word = opts.wordProcessors[i](word);
	}

	// Check if the preprocessor disabled this word
	if (!word) {
		return;
	}

	// Save processed word
	result.processed = word;

	return result;
};

function Thinker (opts) {
	var self = this;

	// Optional `new` keyword
	if (!(self instanceof Thinker)) {
		return new Thinker;
	}

	// Index backend
	self.index = new Index();

	// Can be set afterwards
	self.enableSuggestions = false;
	self.ranker = function() {};

	// All these options must be set before indexing and
	// cannot change afterwards (the object will also be frozen).
	self.options = defaults({
		characters: /[^a-zA-Z0-9']/g,
		caseSensitive: false,
		minWildcardWordLen: 4,
		maxWildcardWordLen: 32,
		minWordLen: 2,
		maxWordLen: 32,
		wordProcessors: [],
		fieldProcessors: []
	}, opts && opts.options);
};

Thinker.prototype.feed = function (texts, opts) {
	var self = this,
		currentDocument,
		currentField,
		currentWord,
		i,j,k;

	// 
	opts = self.options = defaults(self.options, opts);

	// 
	Object.freeze(self.options);

	// 
	function addWord (word, docid, fieldIdx) {
		var wIndex,
			i, j;
		
		// Add processed
		wIndex = self.index.populate(word, docid, fieldIdx);

		// Add partials
		for (i = opts.minWildcardWordLen; i < word.original.length && i < opts.maxWildcardWordLen; i++) {
			for (j = 0; j < (word.original.length - i) + 1; j++) {
				// Do not input partial if equals processed
				//if( word.original.substr(j,i) !== word.processed ) {
					self.index.populatePartial(word.original.substr(j, i), wIndex);
				//}
			}
		}
	}

	/* Stage 1, query index for each individual word */
	while (currentDocument = texts.pop()) {
		
		// split text into separate words, removing empty results
		// Loop through all textfields (index > 0)
		for (j = 1 ; j < currentDocument.length; j++) {

			// Extract current field
			currentField = currentDocument[j];

			// Apply all fieldProcessors
			for (i = 0; i < opts.fieldProcessors.length; i++) {
				if (currentField) {
					currentField = opts.fieldProcessors[i](currentField);
				}
			}

			// Split field into separate words
			currentField = currentField.split(opts.characters);

			// Extract unique words
			for (k = 0; k < currentField.length; k++) {
				if ((currentWord = processWord(currentField[k], opts))) {
					addWord(currentWord, currentDocument[0], j);
				}
			}
		}
	}
};

Thinker.prototype.addFieldProcessor = function (fn) {
	return (this.options.fieldProcessors.push(fn), this);
};

Thinker.prototype.addWordProcessor = function (fn) {
	return (this.options.wordProcessors.push(fn), this);
};

Thinker.prototype.find = function (string, exact) {
	time('findTime');

	var self = this,

		// Extract valid parts of the expression
		words = string.split(self.options.characters),
		word,

		// Find matching texts
		resultSet = { expressions: [] },

		queryResult,
		suggestion,
		i;

	exact = !!exact;

	for (i = 0; i < words.length; i++) {
		// Normalize and validate word
		if (!(word = words[i]) || !(word = processWord(words[i], self.options))) {
			continue;
		}

		// 
		queryResult = self.index.query(word, exact);

		// 
		if (!queryResult.direct && self.enableSuggestions) {
			suggestion = self.index.findClosestWord(word.original);
		}

		// 
		resultSet.expressions.push({
			interpretation: exact ? word.original : word.processed,
			original: word.original,
			suggestion: suggestion,
			exactMode: exact,
			hits: queryResult
		});
	}

	// Rank resultSet
	time('rankTime')
	resultSet = self.ranker(resultSet);

	return {
		results: resultSet,
		findTime: time('findTime'),
		rankTime: time('rankTime')
	};
};

Thinker.processors = processors;
Thinker.rankers = rankers;

module.exports = Thinker;
