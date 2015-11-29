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

var	Index = require('./index.js'),
	processors = require('./processors.js'),
	rankers = require('./rankers.js'),
	utils = require('./utils.js');

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
		return new Thinker(opts);
	}

	self.ranker = function() {};

	// All these options must be set before indexing and
	// cannot change afterwards (the object will also be frozen).
	self.options = utils.defaults({
		characters: /([a-zA-Z0-9]*)/g,
		caseSensitive: false,
		minWildcardWordLen: 4,
		maxWildcardWordLen: 32,
		minWordLen: 2,
		maxWordLen: 32,
		wordProcessors: [],
		fieldProcessors: [],
		suggestionMinWordCount: 6,
		enableSuggestions: false
	}, opts );

	// Changing settings after initializing the index would break things, we will try to prevent that
	Object.freeze(self.options);

	// Index backend
	self.index = new Index(self.options);

};

Thinker.prototype.feed = function (texts) {
	var self = this,
		opts = self.options,
		currentDocument,
		currentField,
		currentWord,
		i,j,k;


	// Helper function adding a single word to the index
	function addWord (word, docid, fieldIdx) {
		var wIndex,
			i, j;
		
		// Add original
		wIndex = self.index.populate(word, docid, fieldIdx);

		// Add partials
		for (i = opts.minWildcardWordLen; i < word.original.length && i < opts.maxWildcardWordLen; i++) {
			for (j = 0; j < (word.original.length - i) + 1; j++) {
				// Do not input partial if equals processed or equals original
				if( word.original.substr(j,i) !== word.processed && word.original.substr(j,i) !== word.original ) {
					self.index.populatePartial(word.original.substr(j, i), wIndex);
				}
			}
		}
	}

	/* Stage 1, query index for each individual word */
	while (currentDocument = texts.pop()) {
		
		// split text into separate words, removing empty results
		// Loop through all textfields (index > 0)
		for (j = 1 ; j < currentDocument.length; j++) {

			// Extract current field
			if (currentField = currentDocument[j]) {

				// Apply all fieldProcessors
				for (i = 0; i < opts.fieldProcessors.length; i++) {
					if (currentField) {
						currentField = opts.fieldProcessors[i](currentField);
					}
				}

				// Split field into separate words
				currentField = currentField.match(opts.characters);

				// Extract unique words
				for (k = 0; k < currentField.length; k++) {
					if (currentWord !== '' && (currentWord = processWord(currentField[k], opts))) {
						addWord(currentWord, currentDocument[0], j);
					}
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

Thinker.prototype.find = function (string) {

	utils.time('findTime');

	var self = this,

		// Extract valid parts of the expression
		words = string.split(" "),
		word,

		// Find matching texts
		resultSet = { expressions: [] },

		queryResult,
		suggestion,
		i;

	for (i = 0; i < words.length; i++) {

		var modifier=undefined, exact=false;

		// Find modifiers, set flags, and remove their textual representation
		if ( ["+","-"].indexOf(words[i][0]) !== -1) {
			modifier = words[i][0];
			words[i] = words[i].substring(1,words[i].length);
		}

		// Trigger exact mode
		if ( words[i][0] == "\"" ) {
			exact = true;
		}
		words[i] = words[i].replace(/\"/g,"");

		// Normalize and validate word
		if (!(word = words[i]) || !(word = processWord(words[i], self.options))) {
			continue;
		}

		//
		queryResult = self.index.query(word, exact);

		// Enable suggestions if self.options.enableSuggestions is true 
		suggestion = undefined;
		if (!queryResult.direct.length && self.options.enableSuggestions) {
			suggestion = self.index.findClosestWord(word.original);
		}

		// Push this expression to result array
		resultSet.expressions.push({
			interpretation: exact ? word.original : word.processed,
			original: word.original,
			suggestion: suggestion,
			modifier: modifier,
			exactMode: exact,
			hits: queryResult
		});

	}

	// Done finding
	resultSet.findTime = utils.time('findTime');

	// Start ranking
	utils.time('rankTime')
	resultSet.documents = self.ranker(resultSet,self.index.getWordCount());

	// Remove expression[m].hits from resultset, not needed anymore
	for (i = 0; i < resultSet.expressions.length; i++) {
		delete resultSet.expressions[i].hits;
	}

	// Done fanking
	resultSet.rankTime = utils.time('rankTime');

	return resultSet;
};

Thinker.processors = processors;
Thinker.rankers = rankers;

module.exports = Thinker;