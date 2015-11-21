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
	Thinker = require('../lib/index.js');

/* START OF EXAMPLE DATA */
var exampleTexts = [
	[0,"Artikel nummer noll","Det här är ettan i det hela, Anders är ett namn. Jonas likaså antikvitets. Bemötandet. effektivitet Kalle"],
	[1,"Bemötande testtitel med extra ord","Brödtext nummer ett. Ander antikviteten"],
	[2,"Titeln med extra Testning","Brödtext i sanden artikeln två. Bemött namn Andersson antikvitet nyhet, nyheter, nyheten, nyhetens, nya"],
];

/* END OF EXAMPLE DATA */
describe('Simple usage', function () {

	var thinker 	= Thinker();
	var ranker 		= Thinker.rankers.standard();

	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Search for "artikel"', function () {
	
		var result = thinker.find("artikel i");

		// The second expressin is ignored as default minWordLength is 2
		it('Should return one expression', function (done) {	
			result.results.expressions.length.should.equal(1);
			done();
		});

		it('Expression interpretation should equal "artikel"', function (done) {
			result.results.expressions[0].interpretation.should.equal("artikel");
			done();
		});

		it('Should return two results', function (done) {
			result.results.documents.length.should.equal(2);
			done();
		});

		it('First result should have id 0', function (done) {
			result.results.documents[0].documentId.should.equal(0);
			done();
		});

		it('First result should be an direct match', function (done) {
			result.results.documents[0].directMatches.should.equal(1);
			result.results.documents[0].partialMatches.should.equal(0);
			done();
		});

		it('Second result should have id 2', function (done) {
			result.results.documents[1].documentId.should.equal(2);
			done();
		});


		it('Second result should be an partial match', function (done) {
			result.results.documents[1].directMatches.should.equal(0);
			result.results.documents[1].partialMatches.should.equal(1);
			done();
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

	// We will be using ÅÄÖåäö here.
	thinker.setCharacters(/[^a-zA-Z0-9åäöÅÄÖ']/g);

	thinker.addWordProcessor(stemmer);
	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Search for "Bemötas"', function () {
	
		var result = thinker.find("Bemötas");

		it('Should return one expression', function (done) {	
			result.results.expressions.length.should.equal(1);
			done();
		});

		it('Expression interpretation should equal "bemöt"', function (done) {
			result.results.expressions[0].interpretation.should.equal("bemöt");
			done();
		});

		it('Should return three results (bemötandet, bemötande, bemött)', function (done) {
			result.results.documents.length.should.equal(3);
			done();
		});

		it('All results should be a direct match', function (done) {
			result.results.documents[0].directMatches.should.equal(1);
			result.results.documents[0].partialMatches.should.equal(0);
			result.results.documents[1].directMatches.should.equal(1);
			result.results.documents[1].partialMatches.should.equal(0);
			result.results.documents[2].directMatches.should.equal(1);
			result.results.documents[2].partialMatches.should.equal(0);
			done();
		});
	
	});

	describe('Search for "nyheternas"', function () {
	
		var result = thinker.find("nyheternas");

		it('Should return one expression', function (done) {	
			result.results.expressions.length.should.equal(1);
			done();
		});

		it('Expression interpretation should equal "nyhet"', function (done) {
			result.results.expressions[0].interpretation.should.equal("nyhet");
			done();
		});

		it('Should return 1 document', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

		it('All four (nyhet, nyheter, nyheten, nyhetens)results should be a direct match on the first result', function (done) {
			result.results.documents[0].directMatches.should.equal(4);
			result.results.documents[0].partialMatches.should.equal(0);
			done();
		});
	
	});

	describe('Search for "nya"', function () {
	
		var result = thinker.find("nya");

		it('Should return one expression', function (done) {	
			result.results.expressions.length.should.equal(1);
			done();
		});

		it('Expression interpretation should equal "ny"', function (done) {
			result.results.expressions[0].interpretation.should.equal("ny");
			done();
		});

		it('Should return one document', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

		it('The result should be a direct match on the first result', function (done) {
			result.results.documents[0].directMatches.should.equal(1);
			result.results.documents[0].partialMatches.should.equal(0);
			done();
		});
	
	});

	describe('Search for "radioar"', function () {
	
		var result = thinker.find("radioar");

		it('Expression interpretation should equal "radio"', function (done) {
			result.results.expressions[0].interpretation.should.equal("radio");
			done();
		});
	
	});

	describe('Search for "sprit"', function () {
	
		var result = thinker.find("sprit");

		it('Expression interpretation should equal "sprit"', function (done) {
			result.results.expressions[0].interpretation.should.equal("sprit");
			done();
		});
	
	});

	describe('Search for "produktutveckling"', function () {
	
		var result = thinker.find("produktutveckling");

		it('Expression interpretation should equal "produktutveckl"', function (done) {
			result.results.expressions[0].interpretation.should.equal("produktutveckl");
			done();
		});
	
	});

	describe('Search for "produktutvecklare"', function () {
	
		var result = thinker.find("produktutvecklare");

		it('Expression interpretation should equal "produktutveckl"', function (done) {
			result.results.expressions[0].interpretation.should.equal("produktutveckl");
			done();
		});
	
	});

	describe('Search for "produktutvecklarens"', function () {
	
		var result = thinker.find("produktutvecklarens");

		it('Expression interpretation should equal "produktutveckl"', function (done) {
			result.results.expressions[0].interpretation.should.equal("produktutveckl");
			done();
		});
	
	});

	describe('Search for "skrotverktyget"', function () {
	
		var result = thinker.find("skrotverktyget");

		it('Expression interpretation should equal "skrotverktyg"', function (done) {
			result.results.expressions[0].interpretation.should.equal("skrotverktyg");
			done();
		});
	
	});


	describe('Search for "skrotverktygets"', function () {
	
		var result = thinker.find("skrotverktygets");


		it('Expression interpretation should equal "skrotverktyg"', function (done) {
			result.results.expressions[0].interpretation.should.equal("skrotverktyg");
			done();
		});
	
	});

	describe('Search for "sandning"', function () {
	
		var result = thinker.find("sandning");

		it('Expression interpretation should equal "sand"', function (done) {
			result.results.expressions[0].interpretation.should.equal("sand");
			done();
		});
	
	});

	describe('Search for "sand"', function () {
	
		var result = thinker.find("sand");

		it('Expression interpretation should equal "sand"', function (done) {
			result.results.expressions[0].interpretation.should.equal("sand");
			done();
		});
	
	});

	describe('Search for "sandarens"', function () {
	
		var result = thinker.find("sandarens");

		it('Expression interpretation should equal "sand"', function (done) {
			result.results.expressions[0].interpretation.should.equal("sand");
			done();
		});
	
	});


	describe('Search for "skrotverktyg"', function () {
	
		var result = thinker.find("skrotverktyg");

		it('Expression interpretation should equal "skrotverktyg"', function (done) {
			result.results.expressions[0].interpretation.should.equal("skrotverktyg");
			done();
		});
	
	});

	describe('Search for "inbyggda"', function () {
	
		var result = thinker.find("inbyggda");

		it('Expression interpretation should equal "inbygg"', function (done) {
			result.results.expressions[0].interpretation.should.equal("inbygg");
			done();
		});
	
	});

	describe('Search for "inbyggd"', function () {
	
		var result = thinker.find("inbyggd");

		it('Expression interpretation should equal "inbygg"', function (done) {
			result.results.expressions[0].interpretation.should.equal("inbygg");
			done();
		});
	
	});

	describe('Search for "antikviteten"', function () {
	
		var result = thinker.find("antikviteten");

		it('Should return one expression', function (done) {	
			result.results.expressions.length.should.equal(1);
			done();
		});

		it('Expression interpretation should equal "antikv"', function (done) {
			result.results.expressions[0].interpretation.should.equal("antikv");
			done();
		});

		it('Should return one result (antikviteten, antivitet, antikvitets)', function (done) {
			result.results.documents.length.should.equal(3);
			done();
		});

		it('All results should be a direct match', function (done) {
			result.results.documents[0].directMatches.should.equal(1);
			result.results.documents[0].partialMatches.should.equal(0);
			result.results.documents[1].directMatches.should.equal(1);
			result.results.documents[1].partialMatches.should.equal(0);
			result.results.documents[2].directMatches.should.equal(1);
			result.results.documents[2].partialMatches.should.equal(0);
			done();
		});
	
	});

	describe('Search for stopword "anders"', function () {
	
		var result = thinker.find("anders");

		it('Should return one expression', function (done) {	
			result.results.expressions.length.should.equal(1);
			done();
		});

		it('Expression interpretation be unchanged("anders")', function (done) {
			result.results.expressions[0].interpretation.should.equal("anders");
			done();
		});

		it('Should return two results', function (done) {
			result.results.documents.length.should.equal(2);
			done();
		});

		it('First result should be a direct match (anders)', function (done) {
			result.results.documents[0].directMatches.should.equal(1);
			result.results.documents[0].partialMatches.should.equal(0);
			done();
		});

		it('Second result should be a partial match (andersson)', function (done) {
			result.results.documents[1].directMatches.should.equal(0);
			result.results.documents[1].partialMatches.should.equal(1);
			done();
		});

	});

});

describe('Partial match', function () {


	var thinker 	= Thinker();
	var ranker 		= Thinker.rankers.standard();

	// We will be using ÅÄÖåäö here.
	thinker.setCharacters(/[^a-zA-Z0-9åäöÅÄÖ']/g);

	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Search for "emöt"', function () {
	
		var result = thinker.find("emöt");

		it('Should return one expression', function (done) {	
			result.results.expressions.length.should.equal(1);
			done();
		});

		it('Expression interpretation should equal "emöt"', function (done) {
			result.results.expressions[0].interpretation.should.equal("emöt");
			done();
		});

		it('Should return three results (bemötandet, bemötande, bemött)', function (done) {
			result.results.documents.length.should.equal(3);
			done();
		});

		it('All results should be a partial match', function (done) {
			result.results.documents[0].directMatches.should.equal(0);
			result.results.documents[0].partialMatches.should.equal(1);
			result.results.documents[1].directMatches.should.equal(0);
			result.results.documents[1].partialMatches.should.equal(1);
			result.results.documents[2].directMatches.should.equal(0);
			result.results.documents[2].partialMatches.should.equal(1);
			done();
		});
	
	});

});

describe('Partial match with minimum word length match 5', function () {

	var thinker 	= Thinker();
	var ranker 		= Thinker.rankers.standard();

	// We will be using ÅÄÖåäö here.
	thinker.setCharacters(/[^a-zA-Z0-9åäöÅÄÖ']/g);
	thinker.setMinWildcardWordLen(5);

	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Search for "emöt"', function () {
	
		var result = thinker.find("emöt");

		it('Should return one expression', function (done) {	
			result.results.expressions.length.should.equal(1);
			done();
		});

		it('Expression interpretation should equal "emöt"', function (done) {
			result.results.expressions[0].interpretation.should.equal("emöt");
			done();
		});

		it('Should return zero results', function (done) {
			result.results.documents.length.should.equal(0);
			done();
		});
	
	});

});

describe('Ranker', function () {

	var thinker = Thinker();
	var ranker 	= Thinker.rankers.standard({
		directHit: 1,
		partialHit: 0.5,
		allExpressionFactor: 3,
		allDirectExpressionFactor: 6,
		fields: {
			1: 4,
			2: 2
		}
	});

	// We will be using ÅÄÖåäö here.
	thinker.setCharacters(/[^a-zA-Z0-9åäöÅÄÖ']/g);

	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Basic search "artikel"', function () {
	
		var result = thinker.find("artikel");

		it('Should return two results', function (done) {
			result.results.documents.length.should.equal(2);
			done();
		});

		describe('Result order', function () {

			it('First result should have id 0', function (done) {
				result.results.documents[0].documentId.should.equal(0);
				done();
			});

			it('Second result should have id 2', function (done) {
				result.results.documents[1].documentId.should.equal(2);
				done();
			});

		});

		describe('Result type', function () {

			it('First result should be direct', function (done) {
				result.results.documents[0].partialMatches.should.equal(0);
				result.results.documents[0].directMatches.should.equal(1);
				done();
			});

			it('Second result should be partial', function (done) {
				result.results.documents[1].directMatches.should.equal(0);
				result.results.documents[1].partialMatches.should.equal(1);
				done();
			});

		});

		describe('Result weight', function () {

			it('First result should have a weight of 4*1*6', function (done) {
				result.results.documents[0].totalWeight.should.equal(24);
				done();
			});

			it('Second result should have a weight of 2*0.5*3', function (done) {
				result.results.documents[1].totalWeight.should.equal(3);
				done();
			});

		});

	});

});

describe('Advanced ranker', function () {

	var thinker = Thinker();
	var ranker 	= Thinker.rankers.standard({
		directHit: 1,
		partialHit: 0.5,
		allExpressionFactor: 3,
		allDirectExpressionFactor: 6,
		fields: {
			1: 4,
			2: 2
		}
	});

	// We will be using ÅÄÖåäö here.
	thinker.setCharacters(/[^a-zA-Z0-9åäöÅÄÖ']/g);

	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Basic search "artikel"', function () {
	
		var result = thinker.find("artikel anders namn");

		it('Should return two results', function (done) {
			result.results.documents.length.should.equal(2);
			done();
		});

		describe('Result order', function () {

			it('First result should have id 0', function (done) {
				result.results.documents[0].documentId.should.equal(0);
				done();
			});

			it('Second result should have id 2', function (done) {
				result.results.documents[1].documentId.should.equal(2);
				done();
			});

		});

		describe('Result type', function () {

			it('First result should be 3 direct matches', function (done) {
				result.results.documents[0].partialMatches.should.equal(0);
				result.results.documents[0].directMatches.should.equal(3);
				done();
			});

			it('Second result should be 2 partial and one direct', function (done) {
				result.results.documents[1].directMatches.should.equal(1);
				result.results.documents[1].partialMatches.should.equal(2);
				done();
			});

		});

		describe('Result weight', function () {

			it('First result should have a weight of ((4*1)+(2*1)+(2*1))*6', function (done) {
				result.results.documents[0].totalWeight.should.equal(48);
				done();
			});

			it('Second result should have a weight of ((2*0.5)+(2*0.5)+(2*1))*3', function (done) {
				result.results.documents[1].totalWeight.should.equal(12);
				done();
			});

		});

	});

});

describe('Suggestion', function () {

	var thinker   = Thinker();
	var ranker 	  = Thinker.rankers.standard();

	// We will be using ÅÄÖåäö here.
	thinker.setCharacters(/[^a-zA-Z0-9åäöÅÄÖ']/g);

	thinker.useSuggestions(true);
	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Search "liaså"', function () {
	
		var result = thinker.find("liaså");

		it('Should return one expression', function (done) {
			result.results.expressions.length.should.equal(1);
			done();
		});

		it('Should return "likaså" as suggestion', function (done) {
			result.results.expressions[0].suggestion.should.equal('likaså');
			done();
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

	// We will be using ÅÄÖåäö here.
	thinker.setCharacters(/[^a-zA-Z0-9åäöÅÄÖ']/g);

	thinker.addWordProcessor(stopwords);
	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Basic search "Bemötande"', function () {
	
		var result = thinker.find("bemötande");

		it('Should return zero expressions', function (done) {
			result.results.expressions.length.should.equal(0);
			done();
		});

		it('Should return zero documents', function (done) {
			result.results.documents.length.should.equal(0);
			done();
		});

	});

});

describe('Word-processor: Multiples', function () {

	var thinker   = Thinker();
	var ranker 	  = Thinker.rankers.standard();
	var multiples = Thinker.processors.multiples({
		"kallle": true
	});

	// We will be using ÅÄÖåäö here.
	thinker.setCharacters(/[^a-zA-Z0-9åäöÅÄÖ']/g);

	thinker.addWordProcessor(multiples);
	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('Search "KaaalLlle"', function () {
	
		var result = thinker.find("KaaalLlle");

		it('Should return one result', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

	});

	describe('Search "kallle" (stopword)', function () {
	
		var result = thinker.find("kallle");

		it('Should return zero result', function (done) {
			result.results.documents.length.should.equal(0);
			done();
		});

	});

	describe('Search "k000aaaallle"', function () {

		var result = thinker.find("k000aaaallle");

		it('Expression interpretation should equal "k000ale"', function (done) {
			result.results.expressions[0].interpretation.should.equal("k000ale");
			done();
		});

	});

});

describe('Field processor: HTML-Stripper', function () {

	var thinker   		= Thinker();
	var ranker 	  		= Thinker.rankers.standard();
	var stripHtml 	= Thinker.processors.stripHtml();

	// We will be using ÅÄÖåäö here.
	thinker.setCharacters(/[^a-zA-Z0-9åäöÅÄÖ']/g);

	thinker.addFieldProcessor(stripHtml);
	thinker.setRanker(ranker);

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleHtml = [
		[0,"&#x74;&#x69;&#x74;&#x6C;&#x65;","<!-- htmlcomment --><p><script>scriptcontent</script><h1>atitle</h1><style> div > #id { stylecontent; } </style><img alt=\"imgdescription\"><a href=\"http://url\">linktext</a><br><hr/><fakeunclosedtag>aword<strong>&Aring;rsringar &lt;innanf&ouml;r&gt; </p>"]
	];
	thinker.feed(exampleHtml);

	describe('Search "title"', function () {
	
		var result = thinker.find("title");

		it('Should return one result', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

	});

	describe('Search "htmlcomment"', function () {
	
		var result = thinker.find("htmlcomment");

		it('Should return zero results', function (done) {
			result.results.documents.length.should.equal(0);
			done();
		});

	});

	describe('Search "scriptcontent"', function () {
	
		var result = thinker.find("scriptcontent");

		it('Should return zero results', function (done) {
			result.results.documents.length.should.equal(0);
			done();
		});

	});


	describe('Search "stylecontent"', function () {
	
		var result = thinker.find("stylecontent");

		it('Should return zero results', function (done) {
			result.results.documents.length.should.equal(0);
			done();
		});

	});

	describe('Search "atitle"', function () {
	
		var result = thinker.find("atitle");

		it('Should return one results', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

	});

	describe('Search "imgdescription"', function () {
	
		var result = thinker.find("imgdescription");

		it('Should return one results', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

	});

	describe('Search "http"', function () {
	
		var result = thinker.find("http");

		it('Should return one results', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

	});

	describe('Search "fakeunclosedtag"', function () {
	
		var result = thinker.find("fakeunclosedtag");

		it('Should return zero results', function (done) {
			result.results.documents.length.should.equal(0);
			done();
		});

	});

	describe('Search "aword"', function () {
	
		var result = thinker.find("aword");

		it('Should return one result', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

	});

	describe('Search "årsringar"', function () {
	
		var result = thinker.find("årsringar");

		it('Should return one result', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

	});


	describe('Search "innanför"', function () {
	
		var result = thinker.find("innanför");

		it('Should return one result', function (done) {
			result.results.documents.length.should.equal(1);
			done();
		});

	});

});