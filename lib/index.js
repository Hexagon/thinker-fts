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

var idx = require('./backend.js'),
    processors = require('./processors.js'),
    rankers = require('./rankers.js');

(function () {
    var root = this;

    function Thinker () {

        var         
            // Default Index/Search settings
            characters = /[^a-zA-Z0-9']/g,

            minWildcardWordLen = 4,
            maxWildcardWordLen = 32,

            minWordLen = 2,
            maxWordLen = 32,
            
            caseSensitive = false,

            enableSuggestions = false,

            // Index backend
            index = new idx(),

            processors = [],

            ranker = function() {},

            addWord = function ( word, docid, fieldIdx ) {

                var wIndex, i, j;
                
                // Add processed
                wIndex = index.populate( word, docid, fieldIdx);

                // Add partials
                for(var i = minWildcardWordLen; i < word.original.length && i < maxWildcardWordLen; i++) {
                    for(var j = 0; j < word.original.length - i + 1; j++) {
                        // Do not input partial if equals processed
                        //if( word.original.substr(j,i) !== word.processed ) {
                            index.populatePartial( word.original.substr(j,i), wIndex );
                        //}
                    }
                }
            },

            wordPreprocessor = function ( w ) {

                var word, i;

                // Check if the word is too short
                if (w.length < minWordLen) return undefined;

                // Check if the word is too long
                if (w.length > maxWordLen) w = w.substring(0,maxWordLen);

                // Always convert everything to lowercase if not case sensitive
                if( !caseSensitive ) w = w.toLowerCase();

                // Prepare object
                word = { original: w, processed: undefined };

                // Apply all processors

                for(i = 0; i < processors.length; i++) {
                    if ( w !== undefined ) {
                        w = processors[i](w);
                    } else {
                        break;
                    }
                }

                // Check if the preprocessor disabled this word
                if (w === undefined  || w === '') return undefined;

                // Save processed word
                word.processed = w;

                return word;
            },

            findWord = function ( word, exact ) {

                var usedWord = exact ? word.original : word.processed,
                    hits = index.query( word , exact ),
                    closestWord;

                if ( hits.direct == undefined && enableSuggestions ) {
                    closestWord = index.findClosestWord( word.original );
                }

                return {interpretation: usedWord, original: word.original, suggestion: closestWord, exactMode: exact,  hits: hits};

            },

            exports = {

                feed: function ( texts ) {

                    var starttime = Date.now(),currentWord,currentText;

                    /* Stage 1, query index for each individual word */
                    while(currentText = texts.pop()) {
                        
                        // split text into separate words, removing empty results
                        // Loop through all textfields (index > 0)
                        for ( var j = 1 ; j < currentText.length ; j++ ) {
                            var current = currentText[j].split(characters).filter(function(elm) { return (elm !== ''); });

                            // Extract unique words
                            for( var k = 0 ; k < current.length ; k++ ) {
                                if (currentWord = wordPreprocessor(current[k])) {
                                    addWord(currentWord,currentText[0],j);
                                }
                            }
                        }
                    }

                },

                setCharacters: function ( cs ) { characters = cs; },

                setCaseSensitive: function ( cs ) { caseSensitive = cs; },

                addWordProcessor: function ( fn ) { processors.push(fn); },

                setMinWildcardWordLen: function ( wl ) { minWildcardWordLen = wl },

                setMaxWildcardWordLen: function ( wl ) { maxWildcardWordLen = wl },

                setMinWordLen: function ( wl ) { minWordLen = wl },        
                setMaxWordLen: function ( wl ) { maxWordLen = wl },     

                setRanker: function ( fn ) { ranker = fn; },

                useSuggestions: function ( b ) { enableSuggestions = b; },

                getIndex: function () { return index.getData(); },

                setIndex: function ( d ) {  return index.setData(d); },

                find: function ( expression ) {
                    
                    var totalFindTime = Date.now(), 
                        totalRankTime,

                        j,  // Iterators

                        currentWord,
                        currentResult,

                        // Extract valid parts of the expression
                        expressionSplit = expression.split(characters).filter(function(elm) { return (elm !== ''); }),

                        // Find matching texts
                        resultSet = { expressions: [] };

                    for( j = 0 ; j < expressionSplit.length ; j++ ) {

                        if ( currentWord = wordPreprocessor(expressionSplit[j]) ) {
                            var currentResult = findWord( currentWord , false);
                            resultSet.expressions.push(currentResult);
                        }

                    }

                    totalFindTime = (Date.now() - totalFindTime);

                    // Rank resultSet
                    totalRankTime = Date.now();
                    resultSet = ranker(resultSet);
                    totalRankTime = (Date.now() - totalRankTime);

                    return {
                        results: resultSet,
                        totalFindTime: totalFindTime,
                        totalRankTime: totalRankTime
                    };

                }

            };

        return exports;

    };

    Thinker.processors = processors;
    Thinker.rankers = rankers;

if (typeof module != 'undefined' && typeof module.exports === 'object') {
        module.exports = Thinker;
} else if (typeof define === 'function' && define.amd) {
        define([], Thinker);
} else {
        root.Thinker = Thinker;
}
}).call(this);