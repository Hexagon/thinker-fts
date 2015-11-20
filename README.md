# thinker

![Build status](https://travis-ci.org/Hexagon/thinker-fts.svg)

Fast and extendible Node.js/Javascript fulltext search engine.

## Installation

      npm install thinker-fts

## Usage
```javascript
var Thinker = require('./lib');

var thinker 	= Thinker(),
	ranker 		= Thinker.rankers.standard();

// Connect standard ranker
thinker.setRanker(ranker);

// Feed thinker with documents of format [id, textfield, textfield, ...]
thinker.feed([
    [1, "Title", "Text"],
    [2, "Title2", "Texts"]
]);

// Search for text
var result = thinker.find("Text");

// Show result
console.log(result);
/* 
    {
		results: {
			expressions: [ ... ]
			documents: [... ]
		},
		totalFindTime: 0,
		totalRankTime: 0
    }
*/
```

## Credits
   
  [Hexagon](https://github.com/hexagon/)
   
  [Pehr Boman](https://github.com/unkelpehr/)

## Licence
Licensed under the [MIT License](http://opensource.org/licenses/MIT)
