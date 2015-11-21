# thinker

[![Build status](https://travis-ci.org/Hexagon/thinker-fts.svg)](https://travis-ci.org/Hexagon/thinker-fts) [![npm version](https://badge.fury.io/js/thinker-fts.svg)](https://badge.fury.io/js/thinker-fts)

Fast and extendible Node.js/Javascript fulltext search engine.

## Features

  * Highly optimized, will give a ranked resultset within 20 ms on a 5000 (average wikipedia sized) document dataset.
  * In-memory operation
  * Very few external dependencies
  * Natural language search
  * Partial matching
  * Expression correction
  * Weighted ranker (configurable weights for each field, all-expression-match-factor, partial vs exact factor etc.)
  * Field preprocessors
	 * HTML-Stripper
  * Word preprocessors
	 * Swedish stemmer with stemmer stopwords
	 * Stopwords
	 * Wordforms
	 * Stripper for multiple characters
  * Allows saving/loading the index to/from disk, it's a lot faster to load a previously saved index than generating it on the fly.

## Installation

	  npm install thinker-fts

## Introduction

```javascript
var Thinker = require('./lib/Thinker'),
  thinker = new Thinker();

// Connect standard ranker
thinker.ranker = Thinker.rankers.standard();

// Feed thinker with documents of format [id, textfield, textfield, ...]
thinker.feed([
	[1, 'Lorem', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'],
	[2, 'Ipsum', 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.']
]);

// Search for text
var result = thinker.find('ut');

// Show result
console.log(result);
/* 
	{
		results: {
			expressions: [...]
			documents: [... ]
		},
		findTime: 1.208248, // ms
		rankTime: 1.109632 // ms
	}
*/
```
## 
## Credits
   
  [Hexagon](https://github.com/hexagon/)
   
  [Pehr Boman](https://github.com/unkelpehr/)

## Licence
Licensed under the [MIT License](http://opensource.org/licenses/MIT)
