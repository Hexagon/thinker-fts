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

'use strict';

var should = require('should'),
	Thinker = require('../lib/Thinker.js');

/* START OF EXAMPLE DATA */
var exampleTexts = [
	[0,"Artikel nummer noll","Det här är ettan i det hela, Anders är ett namn. Jonas likaså antikvitets. Bemötandet. effektivitet Kalle"],
	[1,"Bemötande testtitel med extra ord","Brödtext nummer ett. Ander antikviteten"],
	[2,"Titeln med extra Testning","Brödtext i sanden artikeln två. Bemött namn Andersson antikvitet nyhet, nyheter, nyheten, nyhetens, nya"],
];

/* END OF EXAMPLE DATA */
describe('Simple usage', function () {
	var thinker = Thinker();

	thinker.ranker = Thinker.rankers.standard();

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Search for "artikel"', function () {	
		var result = thinker.find("artikel i");

		// The second expressin is ignored as default minWordLength is 2
		it('Should return one expression', function () {	
			result.results.expressions.length.should.equal(1);
		});

		it('Expression interpretation should equal "artikel"', function () {
			result.results.expressions[0].interpretation.should.equal("artikel");
		});

		it('Should return two results', function () {
			result.results.documents.length.should.equal(2);
		});

		it('First result should have id 0', function () {
			result.results.documents[0].documentId.should.equal(0);
		});

		it('First result should be an direct match', function () {
			result.results.documents[0].directMatches.should.equal(1);
			result.results.documents[0].partialMatches.should.equal(0);
		});

		it('Second result should have id 2', function () {
			result.results.documents[1].documentId.should.equal(2);
		});

		it('Second result should be an partial match', function () {
			result.results.documents[1].directMatches.should.equal(0);
			result.results.documents[1].partialMatches.should.equal(1);
		});
	});
});

describe('Stemmer', function () {
	var stemmerStopwords = {
		"anders": true,
		"jonas": true
	};

	var thinker 	= Thinker();
	var ranker 		= Thinker.rankers.standard();
	var stemmer 	= Thinker.processors.swedishStemmer(stemmerStopwords);
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.addWordProcessor(stemmer);
	thinker.ranker = ranker;

	thinker.feed(exampleTextsCopy, {
		characters: /[^a-zA-Z0-9åäöÅÄÖ']/g
	});

	describe('Search for stopword "anders"', function () {	
		var result = thinker.find("anders");

		it('Should return one expression', function () {	
			result.results.expressions.length.should.equal(1);
		});

		it('Expression interpretation be unchanged("anders")', function () {
			result.results.expressions[0].interpretation.should.equal("anders");
		});

		it('Should return two results', function () {
			result.results.documents.length.should.equal(2);
		});

		it('First result should be a direct match (anders)', function () {
			result.results.documents[0].directMatches.should.equal(1);
			result.results.documents[0].partialMatches.should.equal(0);
		});

		it('Second result should be a partial match (andersson)', function () {
			result.results.documents[1].directMatches.should.equal(0);
			result.results.documents[1].partialMatches.should.equal(1);
		});
	});
});

describe('Partial match', function () {
	var thinker = Thinker();

	thinker.ranker = Thinker.rankers.standard();

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy, {
		characters: /[^a-zA-Z0-9åäöÅÄÖ']/g
	});

	describe('Search for "emöt"', function () {	
		var result = thinker.find("emöt");

		it('Should return one expression', function () {	
			result.results.expressions.length.should.equal(1);
		});

		it('Expression interpretation should equal "emöt"', function () {
			result.results.expressions[0].interpretation.should.equal("emöt");
		});

		it('Should return three results (bemötandet, bemötande, bemött)', function () {
			result.results.documents.length.should.equal(3);
		});

		it('All results should be a partial match', function () {
			result.results.documents[0].directMatches.should.equal(0);
			result.results.documents[0].partialMatches.should.equal(1);
			result.results.documents[1].directMatches.should.equal(0);
			result.results.documents[1].partialMatches.should.equal(1);
			result.results.documents[2].directMatches.should.equal(0);
			result.results.documents[2].partialMatches.should.equal(1);
		});
	});
});

describe('Partial match with minimum word length match 5', function () {
	var thinker = Thinker(),
		ranker = Thinker.rankers.standard();

	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	thinker.feed(JSON.parse(JSON.stringify(exampleTexts)), {
		characters: /[^a-zA-Z0-9åäöÅÄÖ']/g,
		minWildcardWordLen: 5
	});

	describe('Search for "emöt"', function () {
		var result = thinker.find('emöt');

		it('Should return one expression', function () {	
			result.results.expressions.length.should.equal(1);
		});

		it('Expression interpretation should equal "emöt"', function () {
			result.results.expressions[0].interpretation.should.equal("emöt");
		});

		it('Should return zero results', function () {
			result.results.documents.length.should.equal(0);
		});
	});
});

describe('Ranker', function () {
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

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy, {
		characters: /[^a-zA-Z0-9åäöÅÄÖ']/g
	});

	describe('Basic search "artikel"', function () {	
		var result = thinker.find("artikel");

		it('Should return two results', function () {
			result.results.documents.length.should.equal(2);
		});

		describe('Result order', function () {
			it('First result should have id 0', function () {
				result.results.documents[0].documentId.should.equal(0);

			});

			it('Second result should have id 2', function () {
				result.results.documents[1].documentId.should.equal(2);

			});
		});

		describe('Result type', function () {
			it('First result should be direct', function () {
				result.results.documents[0].partialMatches.should.equal(0);
				result.results.documents[0].directMatches.should.equal(1);

			});

			it('Second result should be partial', function () {
				result.results.documents[1].directMatches.should.equal(0);
				result.results.documents[1].partialMatches.should.equal(1);

			});
		});

		describe('Result weight', function () {
			it('First result should have a weight of 4*1*6', function () {
				result.results.documents[0].totalWeight.should.equal(24);

			});

			it('Second result should have a weight of 2*0.5*3', function () {
				result.results.documents[1].totalWeight.should.equal(3);

			});
		});
	});
});

describe('Advanced ranker', function () {
	var thinker = Thinker();
	var ranker = Thinker.rankers.standard({
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

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy, {
		characters: /[^a-zA-Z0-9åäöÅÄÖ']/g
	});

	describe('Basic search "artikel"', function () {	
		var result = thinker.find("artikel anders namn");

		it('Should return two results', function () {
			result.results.documents.length.should.equal(2);
		});

		describe('Result order', function () {
			it('First result should have id 0', function () {
				result.results.documents[0].documentId.should.equal(0);

			});

			it('Second result should have id 2', function () {
				result.results.documents[1].documentId.should.equal(2);

			});
		});

		describe('Result type', function () {
			it('First result should be 3 direct matches', function () {
				result.results.documents[0].partialMatches.should.equal(0);
				result.results.documents[0].directMatches.should.equal(3);

			});

			it('Second result should be 2 partial and one direct', function () {
				result.results.documents[1].directMatches.should.equal(1);
				result.results.documents[1].partialMatches.should.equal(2);

			});
		});

		describe('Result weight', function () {
			it('First result should have a weight of ((4*1)+(2*1)+(2*1))*6', function () {
				result.results.documents[0].totalWeight.should.equal(48);

			});

			it('Second result should have a weight of ((2*0.5)+(2*0.5)+(2*1))*3', function () {
				result.results.documents[1].totalWeight.should.equal(12);

			});
		});
	});
});

describe('Suggestion', function () {
	var thinker = Thinker();
	var ranker = Thinker.rankers.standard();

	thinker.enableSuggestions = true;
	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy, {
		characters: /[^a-zA-Z0-9åäöÅÄÖ']/g
	});

	describe('Search "liaså"', function () {	
		var result = thinker.find("liaså");

		it('Should return one expression', function () {
			result.results.expressions.length.should.equal(1);
		});

		it('Should return "likaså" as suggestion', function () {
			result.results.expressions[0].suggestion.should.equal('likaså');
		});
	});
});

describe('Word-processor: Stopwords', function () {
	var thinker   = Thinker();
	var ranker 	  = Thinker.rankers.standard();
	var stopwords = Thinker.processors.stopwords({
		"artikel": true,
		"bemötande": true
	});

	thinker.addWordProcessor(stopwords);
	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy, {
		characters: /[^a-zA-Z0-9åäöÅÄÖ']/g
	});

	describe('Basic search "Bemötande"', function () {	
		var result = thinker.find("bemötande");

		it('Should return zero expressions', function () {
			result.results.expressions.length.should.equal(0);
		});

		it('Should return zero documents', function () {
			result.results.documents.length.should.equal(0);
		});
	});
});

describe('Word-processor: Multiples', function () {
	var thinker   = Thinker();
	var ranker 	  = Thinker.rankers.standard();
	var multiples = Thinker.processors.multiples({
		"kallle": true
	});

	thinker.addWordProcessor(multiples);
	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy, {
		characters: /[^a-zA-Z0-9åäöÅÄÖ']/g
	});

	describe('Search "KaaalLlle"', function () {
		var result = thinker.find("KaaalLlle");

		it('Should return one result', function () {
			result.results.documents.length.should.equal(1);
		});
	});

	describe('Search "kallle" (stopword)', function () {
		var result = thinker.find("kallle");

		it('Should return zero result', function () {
			result.results.documents.length.should.equal(0);
		});
	});

	describe('Search "k000aaaallle"', function () {
		var result = thinker.find("k000aaaallle");

		it('Expression interpretation should equal "k000ale"', function () {
			result.results.expressions[0].interpretation.should.equal("k000ale");
		});
	});
});

describe('Field processor: HTML-Stripper', function () {
	var thinker = Thinker();
	var ranker = Thinker.rankers.standard();
	var stripHtml = Thinker.processors.stripHtml();

	thinker.addFieldProcessor(stripHtml);
	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleHtml = [
		[0,"&#x74;&#x69;&#x74;&#x6C;&#x65;","<!-- htmlcomment --><p><script>scriptcontent</script><h1>atitle</h1><style> div > #id { stylecontent; } </style><img alt=\"imgdescription\"><a href=\"http://url\">linktext</a><br><hr/><fakeunclosedtag>aword<strong>&Aring;rsringar &lt;innanf&ouml;r&gt; </p>"]
	];

	thinker.feed(exampleHtml, {
		characters: /[^a-zA-Z0-9åäöÅÄÖ']/g
	});

	describe('Search "title"', function () {
		var result = thinker.find("title");

		it('Should return one result', function () {
			result.results.documents.length.should.equal(1);
		});
	});

	describe('Search "htmlcomment"', function () {	
		var result = thinker.find("htmlcomment");

		it('Should return zero results', function () {
			result.results.documents.length.should.equal(0);
		});
	});

	describe('Search "scriptcontent"', function () {	
		var result = thinker.find("scriptcontent");

		it('Should return zero results', function () {
			result.results.documents.length.should.equal(0);
		});
	});

	describe('Search "stylecontent"', function () {	
		var result = thinker.find("stylecontent");

		it('Should return zero results', function () {
			result.results.documents.length.should.equal(0);
		});
	});

	describe('Search "atitle"', function () {	
		var result = thinker.find("atitle");

		it('Should return one results', function () {
			result.results.documents.length.should.equal(1);
		});
	});

	describe('Search "imgdescription"', function () {	
		var result = thinker.find("imgdescription");

		it('Should return one results', function () {
			result.results.documents.length.should.equal(1);
		});
	});

	describe('Search "http"', function () {	
		var result = thinker.find("http");

		it('Should return one results', function () {
			result.results.documents.length.should.equal(1);
		});
	});

	describe('Search "fakeunclosedtag"', function () {	
		var result = thinker.find("fakeunclosedtag");

		it('Should return zero results', function () {
			result.results.documents.length.should.equal(0);
		});
	});

	describe('Search "aword"', function () {	
		var result = thinker.find("aword");

		it('Should return one result', function () {
			result.results.documents.length.should.equal(1);
		});
	});

	describe('Search "årsringar"', function () {	
		var result = thinker.find("årsringar");

		it('Should return one result', function () {
			result.results.documents.length.should.equal(1);
		});
	});

	describe('Search "innanför"', function () {	
		var result = thinker.find("innanför");

		it('Should return one result', function () {
			result.results.documents.length.should.equal(1);
		});
	});
});