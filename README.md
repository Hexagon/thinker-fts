# thinker

[![Build status](https://travis-ci.org/Hexagon/thinker-fts.svg)](https://travis-ci.org/Hexagon/thinker-fts) [![npm version](https://badge.fury.io/js/thinker-fts.svg)](https://badge.fury.io/js/thinker-fts) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/f4a95b3f01b644d9af07476e4e048c60)](https://www.codacy.com/app/robinnilsson/thinker-fts?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Hexagon/thinker-fts&amp;utm_campaign=Badge_Grade) [![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://img.shields.io/badge/license-MIT-blue.svg)

Fast, extendible and stand alone pure JavaScript full text search engine.

## Features

  * In-memory operation
  * Highly optimized, will give a ranked resultset within 10 ms on a 5000 (average wikipedia sized) document dataset.
  * Few external dependencies
  * Natural language search
  * Partial matching
  * Expression correction / suggestions
  * Weighted ranker (configurable weights for each field, all-expression-match-factor, partial vs exact factor etc.)
  * Search modifiers (+ require, - exclude, "searchword" precise match which excepts wordprocessors)
  * Result filters
  * Field preprocessors
	 * HTML-Stripper
  * Word preprocessors
	 * [Stemmers](https://en.wikipedia.org/wiki/Stemming)
	    * Swedish
	    * English
	 * [Stop words](https://en.wikipedia.org/wiki/Stop_words)
	 * Word forms
	 * [Soundex](https://en.wikipedia.org/wiki/Soundex)
	 * Stripper for repeated characters


## Installation

	  npm install thinker-fts


## Quick-start

A simple setup with feeding and searching would look something like the snippet below

```javascript
var 	Thinker = require('thinker-fts'),
		thinker = Thinker();

// Connect standard ranker
thinker.ranker = Thinker.rankers.standard();

// Feed thinker with an array of documents formatted like { id: id, fields: [textfield, textfield] }
thinker.feed([
	{ id: 1, fields: ['Lorem', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'] },
	{ id: 2, fields: ['Ipsum', 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'] }
]);

// Search for text
var result = thinker.find('ut in');

// Show result
console.log(result);
{ 
	expressions: [ 
		{ 
			original: 'ut',
			interpretation: [Object],
			suggestion: undefined,
			modifier: undefined,
			exactMode: false 
		},
		{
			original: 'in',
			interpretation: [Object],
			suggestion: undefined,
			modifier: undefined,
			exactMode: false 
		}
	],
	performance: { 
		find: 1.107075,
		rank: 0.598558,
		sort: 0.688598,
		filter: 0.060182,
		total: 2.639159 
	},
	documents: [
		{ id: 2, weight: 1.5, expressions: [Object] },
		{ id: 1, weight: 1.5, expressions: [Object] } 
	],
	totalHits: 2,
	returnedHits: 2 
}

```

Please not that you _have to_ connect a ranker, else find won't provide a result set. The ranker build the result set.

## Basic configuration

Thinkers default configuration is overridden by supplying an options object to Thinkers constructor.

```javascript

// Options only available at initialization
var thinker = Thinker({
	characters: /([a-zA-Z0-9]*)/g,
	caseSensitive: false,
	minWildcardWordLen: 3,
	maxWildcardWordLen: 32,
	minWordLen: 2,
	maxWordLen: 32,
	suggestionMinWordCount: 6,
	enableSuggestions: false,
	optionalPlusFromExpressions: 1,
	coalesceWords: 1
});

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

#### opts.suggestionMinWordCount

Set how many times a word have to exist in the index to be used for suggestions. Defaults to 6.

#### opts.enableSuggestions

If this is enabled, thinker will use unprocessed words from the inputted texts to give suggestions when expressions doesn't give an direct match.

This is what results.expressions[n] will look like when you search for 'exression' (missing p)

#### opts.optionalPlusFromExpressions

Will be renamed, I promise. 

This is how many words there should be in the expression before all words become optional. Defaults to 1 (disabled).

If you set this to 4, and search for a three word expression, all words will need to exist in the document to giva e match. In the background ```what you want``` become ```+what +you +want```.
If you giva a four word expression, all words become optional as usuabl.

#### opts.coalesceWords

When this property is set to greater than one, augmented words will be inserted into the index, consisting of current and next word. If this property is set to 3 and the field is "i want cookies today", a search for ```iwantcookies```, ```wantcookiestoday``` or ```wantcookies``` will give a match.

```javascript 
{
	interpretation: {
		original: 'expression',
		...
	},
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
		eachPartialExpressionFactor: 1.5,
		eachDirectExpressionFactor: 2,
		fields: {
			1: { weight: 4, boostPercentage: false },
			2: { weight: 2, boostPercentage: false }
		}
	});

thinker.ranker = ranker;
```

#### directHit / partialHit

Factor to weight when an expression match a word directly resp. partially

#### eachPartialExpressionFactor

Factor which is applied to a documents total weight when a expressions give a partial match. If the query consist of three expressions that all match partially this factor will be applied three times.

#### eachDirectExpressionFactor

Same as above, but with direct hits.

#### fields

Object defining a different base weight for a match in each field of a document, if your documents look like

```javascript
var docs = [
	{ id: 1, fields: ["This is the title", "This is the ingress", "This is the text"] },
	...
];
```

and your fields weights look like

```javascript
fields: {
	0: { weight: 4, boostPercentage: true },
	1: { weight: 2, boostPercentage: false },
	2: { weight: 2, boostPercentage: false }
}
```

Matches in the title field would get a weight of four, matches in the ingress field would get a weight of two etc. 

Additionally, as boostPercentage is set to true for title, that weight can get up to it's double if the match is the only word in the title. 

For example, if the title is 'This is the stuff', and we search for 'stuff', the base weight is four, and that is multiplied by a calculated factor 

1 word matched, 4 words totally

1+1/4

1+0.25

gives 1.25 in boostPercentage factor

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

#### Stop words

Removes words that don't give better precision, normally stuff like 'and', 'I', 'they', 'we', 'can'. Adding the most common words here can speed up the quries a bit, and save some RAM.

Example setting up thinker with standard ranker and stop words

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

#### Stemmers

Finds the stem of each word that is indexed, 'computers' will become 'computer', 'organized' will become 'organize' etc. This greatly improves accuracy of the matches and weighting.

An optional feature of the stemmers is to supply a list of words that you don't want to stem down.

Currently there is two stemmers available, swedish through a custom version of the Snowball algorithm, and english through the Porter algorithm.

Example setting up thinker with standard ranker, english stemming and some stemmer stopwords.

```javascript
var
	thinker 	= Thinker(),
	ranker 		= Thinker.rankers.standard(),
	stemmer 	= Thinker.processors.stemmers.english({
		"stemmer": true,
		"stemming": true,
		"dontstemthiseither": true,
		"leonardo": true,
		"anders", true
	});

thinker.addWordProcessor(stemmer);

thinker.ranker = ranker;

```


Example setting up thinker with standard ranker, swedish stemming, and stemmer stop words

```javascript
var
	thinker 	= Thinker(),
	ranker 		= Thinker.rankers.standard(),
	stemmer 	= Thinker.processors.stemmers.swedish({
		"berta": true,
		"jonas": true,
		"leonardo": true,
		"anders", true
	});

thinker.addWordProcessor(stemmer);

thinker.ranker = ranker;
```

#### Soundex

Soundex preprocesses the words in such way that words that sounds alike matches each other.

Example setting up thinker with Soundex processing.

```javascript
var
	thinker 	= Thinker(),
	ranker 		= Thinker.rankers.standard(),
	soundex 	= Thinker.processors.soundex();

thinker.addWordProcessor(soundex);

thinker.ranker = ranker;
```


## Dependencies

Note: Dependencies is installed automatically by npm

  [fast-levenshtein](https://github.com/hiddentao/fast-levenshtein) (https://github.com/hiddentao/fast-levenshtein)

  [stemmer](https://github.com/wooorm/stemmer) (https://github.com/wooorm/stemmer)

  [node-soundex](https://github.com/LouisT/node-soundex) (https://github.com/LouisT/node-soundex)


## Development dependencies

Note: Not needed for normal usage

  [mocha](https://github.com/mochajs/mocha) (https://github.com/mochajs/mocha)

  [should](https://github.com/shouldjs/should.js) (https://github.com/shouldjs/should.js)


## Credits
   
  [Hexagon](https://github.com/hexagon/)
   
  [Pehr Boman](https://github.com/unkelpehr/)


## Licence

Licensed under the [MIT License](http://opensource.org/licenses/MIT)
