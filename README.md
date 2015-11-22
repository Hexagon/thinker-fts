# thinker

[![Build status](https://travis-ci.org/Hexagon/thinker-fts.svg)](https://travis-ci.org/Hexagon/thinker-fts) [![npm version](https://badge.fury.io/js/thinker-fts.svg)](https://badge.fury.io/js/thinker-fts)

Fast and extendible Node.js/Javascript fulltext search engine.

## Features

  * Highly optimized, will give a ranked resultset within 20 ms on a 5000 (average wikipedia sized) document dataset.
  * In-memory operation
  * Very few external dependencies
  * Natural language search
  * Partial matching
  * Expression correction/Suggestions
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

## Quick-start

A simple setup with feeding and searching would look something like the snippet below

```javascript
var 	Thinker = require('thinker-fts'),
		thinker = Thinker();

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

Please not that you _have to_ connect a ranker, else find won't provide a result set. The ranker build the result set.

## Basic configuration

Thinkers default configuration is overridden by supplying an optoions object to Thinkers constructor. There is also a couple of settings that can be changed on runtime, both is shown below

```javascript

// Options only available at initialization
var thinker = Thinker({
	characters: /([a-zA-Z0-9']*)/g,
	caseSensitive: false,
	minWildcardWordLen: 4,
	maxWildcardWordLen: 32,
	minWordLen: 2,
	maxWordLen: 32
});

// Options available on run time
thinker.enableSuggestions = true;

```

#### opts.characters

Regular expressing stating which characters to pick up as words, if you (as an example) want to use Thinker with swedish characters the setting would be

```javascript
{ characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g }
```

#### opts.caseSensitive

Self explanatory, true or false


#### opts.minWildcardWordLen

Thinker always does partial matching, minWildcardWordLen sets how short parts of words that should be indexed. The default setting is 4 which matches 'xpre' to 'expression', but not 'pre'. Setting this too short could give an unnessecary amount of bogus matches and could affect performance if used with a heavy ranker.

#### opts.maxWildcardWordLen

Same as above, but max.

#### opts.minWordLen

The shortest word to index, default is 2 which adds 'ex' to the index, but not 'e'

#### opts.maxWordLen

Same as above, but max.

#### thinker.enableSuggestions

If this is enabled, thinker will use unprocessed words from the inputted texts to give suggestions when expressions doesn't give an direct match.

This is what results.expressions[n] will look like when you search for 'exression' (missing p)

```javascript 
{
	interpretation: 'exression',
	...
	suggestion: 'expression',
	...
}
```

## 'Standard' ranker options

The ranker is configured by passing an options object to its constructor.

```javascript
var thinker = Thinker(),
	ranker = Thinker.rankers.standard({
		directHit: 1,
		partialHit: 0.5,
		allExpressionFactor: 3,
		allDirectExpressionFactor: 6,
		fields: {
			1: 4,
			2: 2
		}
	});

thinker.ranker = ranker;
```

#### directHit / partialHit

Factor to weight when an expression match a word directly resp. partially

#### allExpressionFactor

Factor which is applied to a documents total weight when all expressions give a match, partially or directly does not matter.

#### allDirectExpressionFactor

Factor which is applied to a documents total weight when all expressions give a direct/exact match. Both this and the above should be set fairly high to ensure documents with good matches get close to top in the result set.

#### fields

Object defining a different base weight for a match in each field of a document, if your documents look like

```javascript
var docs = [
	[1,"This is the title", "This is the ingress", "This is the text"],
	...
];
```

and your fields weights look like

```javascript
fields: {
	1: 4,
	2: 2,
	3: 2
}
```

Matches in the title field would get a weight of four, matches in the ingress field would get a weight of two etc.


## Field processors

Field processors is functions that is applied to each and every field that thinker is fed with, before the indexing is done.

#### stripHtml

Stripts HTML, leaving links (a href="*") and image descriptions (img alt="*") in the returned result.

Example setting up thinker with standard ranker and html-stripping

```javascript
var
	thinker = Thinker(),
	ranker = Thinker.rankers.standard(),
	stripHtml = Thinker.processors.stripHtml();

thinker.addFieldProcessor(stripHtml);

thinker.ranker = ranker;

```

## Word processors

Word processors is functions that is applied to each and every word that thinker is fed with. They are applied the same way both when indexing and when querying.

Word processors is handled in the same way they are configured, keep that in mind when setting up things. If you for example stem the word before applying wordforms, you need to use stemmed words in the wordforms list.

#### Wordforms

Replaces chosen words with others, effectively making synonyms equal each other.

Example setting up thinker with standard ranker and wordforms

```javascript
var thinker   = Thinker(),
	ranker 	  = Thinker.rankers.standard(),
	wordforms = Thinker.processors.wordforms({
		"we": "us",
		"they": "them",
		"github": "repository"
	});

thinker.addWordProcessor(stopwords);

thinker.ranker = ranker;
```

#### Stopwords

Removes words that don't give better precision, normally stuff like 'and', 'I', 'they', 'we', 'can'. Adding the most common words here can speed up the quries a bit, and save some RAM.

Example setting up thinker with standard ranker and stopwords

```javascript
var thinker   = Thinker(),
	ranker 	  = Thinker.rankers.standard(),
	stopwords = Thinker.processors.stopwords({
		"artikel": true,
		"bemötande": true
	});

thinker.addWordProcessor(stopwords);

thinker.ranker = ranker;
```

#### Stemmer

Finds the stem of each word that is indexed, 'computers' will become 'computer', 'organized' will become 'organize' etc. This greatly improves accuracy of the matches and weighting.

An optinal feature of the stemmers is to supply a list of words that you don't want to stem down. Names is one thing you probably want to except from the stemmer.

Currently only available for swedish

Example setting up thinker with standard ranker, stemming, and stemmer stopwords

```javascript
var
	thinker 	= Thinker(),
	ranker 		= Thinker.rankers.standard(),
	stemmer 	= Thinker.processors.swedishStemmer({
		"stemmer": true,
		"stemming": true,
		"dontstemthiseither": true,
		"leonardo": true,
		"anders", true
	});

thinker.addWordProcessor(stemmer);

thinker.ranker = ranker;
```

## Credits
   
  [Hexagon](https://github.com/hexagon/)
   
  [Pehr Boman](https://github.com/unkelpehr/)

## Licence
Licensed under the [MIT License](http://opensource.org/licenses/MIT)
