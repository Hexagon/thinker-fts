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

var	idx = require('./backend.js'),
	processors = require('./processors.js'),
	rankers = require('./rankers.js');

function Thinker () {
	var self = this;

	// Optional `new` keyword
	if (!(self instanceof Thinker)) {
		return new Thinker;
	}

	self.characters = /[^a-zA-Z0-9']/g;

	self.minWildcardWordLen = 4;
	self.maxWildcardWordLen = 32;

	self.minWordLen = 2;
	self.maxWordLen = 32;

	self.caseSensitive = false;
	self.enableSuggestions = false;

	// Index backend
	self.index = new idx();

	self.wordProcessors = [];
	self.fieldProcessors = [];

	self.ranker = function() {};
};

// Priv
Thinker.prototype.addWord = function (word, docid, fieldIdx) {
	var self = this,
		wIndex,
		i, j;
	
	// Add processed
	wIndex = self.index.populate( word, docid, fieldIdx);

	// Add partials
	for (i = self.minWildcardWordLen; i < word.original.length && i < self.maxWildcardWordLen; i++) {
		for (j = 0; j < (word.original.length - i) + 1; j++) {
			// Do not input partial if equals processed
			//if( word.original.substr(j,i) !== word.processed ) {
				self.index.populatePartial(word.original.substr(j, i), wIndex);
			//}
		}
	}
};

// Priv
Thinker.prototype.wordPreprocessor = function (word) {
	var self = this,
		result,
		i;

	// Check if the word is too short
	if (word.length < self.minWordLen) {
		return;
	}

	// Check if the word is too long
	if (word.length > self.maxWordLen) {
		word = word.substring(0, self.maxWordLen);
	}

	// Always convert everything to lowercase if not case sensitive
	if (!self.caseSensitive) {
		word = word.toLowerCase();
	}

	// Prepare object
	result = { original: word, processed: undefined };

	// Apply all wordProcessors
	for (i = 0; i < self.wordProcessors.length; i++) {
		if (!word) {
			break;
		}
		
		word = self.wordProcessors[i](word);
	}

	// Check if the preprocessor disabled this word
	if (!word) {
		return;
	}

	// Save processed word
	result.processed = word;

	return result;
};

// Priv
Thinker.prototype.findWord = function (word, exact) {
	var self = this,
		usedWord = exact ? word.original : word.processed,
		hits = self.index.query(word, exact),
		closestWord;

	if (!hits.direct && self.enableSuggestions) {
		closestWord = self.index.findClosestWord(word.original);
	}

	return {
		interpretation: usedWord,
		original: word.original,
		suggestion: closestWord,
		exactMode: exact,
		hits: hits
	};
};

Thinker.prototype.feed = function (texts) {
	var self = this,
		currentDocument,
		currentField,
		currentWord,
		i,j,k;

	/* Stage 1, query index for each individual word */
	while (currentDocument = texts.pop()) {
		
		// split text into separate words, removing empty results
		// Loop through all textfields (index > 0)
		for (j = 1 ; j < currentDocument.length; j++) {

			// Extract current field
			currentField = currentDocument[j];

			// Apply all fieldProcessors
			for (i = 0; i < self.fieldProcessors.length; i++) {
				if (currentField) {
					currentField = self.fieldProcessors[i](currentField);
				}
			}

			// Split field into separate words
			currentField = currentField.split(self.characters).filter(function(elm) { return (elm !== ''); });

			// Extract unique words
			for( k = 0 ; k < currentField.length ; k++ ) {
				if (currentWord = self.wordPreprocessor(currentField[k])) {
					self.addWord(currentWord,currentDocument[0],j);
				}
			}
		}
	}

};

Thinker.prototype.addFieldProcessor = function (fn) {
	this.fieldProcessors.push(fn);
};

Thinker.prototype.addWordProcessor = function (fn) {
	this.wordProcessors.push(fn);
};

Thinker.prototype.getIndex = function () {
	return this.index.getData();
};

Thinker.prototype.setIndex = function (d) {
	return this.index.setData(d);
};

Thinker.prototype.find = function (expression) {
	var self = this,
		totalFindTime = Date.now(), 
		totalRankTime,
		i,
		currentWord,
		currentResult,

		// Extract valid parts of the expression
		expressionSplit = expression.split(self.characters).filter(function(elm) { return (elm !== ''); }),

		// Find matching texts
		resultSet = { expressions: [] };

	for (i = 0; i < expressionSplit.length; i++) {
		if (currentWord = self.wordPreprocessor(expressionSplit[i]) ) {
			var currentResult = self.findWord(currentWord, false);
			resultSet.expressions.push(currentResult);
		}
	}

	totalFindTime = (Date.now() - totalFindTime);

	// Rank resultSet
	totalRankTime = Date.now();
	resultSet = self.ranker(resultSet);
	totalRankTime = (Date.now() - totalRankTime);

	return {
		results: resultSet,
		totalFindTime: totalFindTime,
		totalRankTime: totalRankTime
	};
};

Thinker.processors = processors;
Thinker.rankers = rankers;

module.exports = Thinker;