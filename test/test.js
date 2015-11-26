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
	[0,"Artikel nummer noll","Det här är ettan i det hela, Anders är ett namn. Jonas likaså antikvitets. Bemötandet. effektivitet Kalle olle lars considerable"],
	[1,"Bemötande testtitel med extra ord","Brödtext nummer ett. Ander antikviteten olle lars sven"],
	[2,"Titeln med extra Testning","Brödtext i sanden artikeln artikeln artikeln artikeln två. Bemött namn Andersson antikvitet nyhet, nyheter, nyheten, nyhetens, nya olle"],
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
			result.expressions.length.should.equal(1);
		});

		it('Expression interpretation should equal "artikel"', function () {
			result.expressions[0].interpretation.should.equal("artikel");
		});

		it('Should return two results', function () {
			result.documents.length.should.equal(2);
		});

		it('First result should have id 0', function () {
			result.documents[0].id.should.equal(0);
		});

		it('First result should be an direct match', function () {
			result.documents[0].expressions[0].should.equal(2);
		});

		it('Second result should have id 2', function () {
			result.documents[1].id.should.equal(2);
		});

		it('Second result should be an partial match', function () {
			result.documents[1].expressions[0].should.equal(1);
		});
	});
});


describe('Simple usage: Local characters', function () {
	var thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});

	thinker.ranker = Thinker.rankers.standard();

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('opts.characters', function () {	
		var result = thinker.find("ånglok");

		// The second expressin is ignored as default minWordLength is 2
		it('Should return one expression', function () {	
			result.expressions.length.should.equal(1);
		});

		it('Expression interpretation should equal "ånglok"', function () {
			result.expressions[0].interpretation.should.equal("ånglok");
		});

	});
});

describe('Simple usage: Exact mode', function () {
	var thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});

	thinker.ranker = Thinker.rankers.standard();

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('opts.characters', function () {	
		var result = thinker.find("ånglok");

		// The second expressin is ignored as default minWordLength is 2
		it('Should return one expression', function () {	
			result.expressions.length.should.equal(1);
		});

		it('Expression interpretation should equal "ånglok"', function () {
			result.expressions[0].interpretation.should.equal("ånglok");
		});

	});
});

describe('Simple usage: Modifiers', function () {
	var thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});

	thinker.ranker = Thinker.rankers.standard();

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
	thinker.feed(exampleTextsCopy);

	describe('olle +lars -sven', function () {	
		var result = thinker.find("olle +lars -sven");

		// The second expressin is ignored as default minWordLength is 2
		it('Should return three expressions', function () {	
			result.expressions.length.should.equal(3);
		});

		it('Expressions two should have + modifier', function () {	
			result.expressions[1].modifier.should.equal("+");
		});
		
		it('Expressions three should have - modifier', function () {	
			result.expressions[2].modifier.should.equal("-");
		});

		it('Expression interpretation two should equal "lars"', function () {
			result.expressions[1].interpretation.should.equal("lars");
		});

		it('Should return one result', function () {
			result.documents.length.should.equal(1);
		});

		it('Should be document id 0', function () {
			result.documents[0].id.should.equal(0);
		});
	});
});

describe('Partial match', function () {
	var thinker = Thinker({
		characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g
	});

	thinker.ranker = Thinker.rankers.standard();

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy);

	describe('Search for "emöt"', function () {	
		var result = thinker.find("emöt");

		it('Should return one expression', function () {	
			result.expressions.length.should.equal(1);
		});

		it('Expression interpretation should equal "emöt"', function () {
			result.expressions[0].interpretation.should.equal("emöt");
		});

		it('Should return three results (bemötandet, bemötande, bemött)', function () {
			result.documents.length.should.equal(3);
		});

		it('All results should be a partial match', function () {
			result.documents[0].expressions[0].should.equal(1);
			result.documents[1].expressions[0].should.equal(1);
			result.documents[2].expressions[0].should.equal(1);
		});
	});
});

describe('Partial match with minimum word length match 5', function () {
	var thinker = Thinker({
		characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g,
		minWildcardWordLen: 5 } ),
		ranker = Thinker.rankers.standard();

	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	thinker.feed(JSON.parse(JSON.stringify(exampleTexts)));

	describe('Search for "emöt"', function () {
		var result = thinker.find('emöt');

		it('Should return one expression', function () {	
			result.expressions.length.should.equal(1);
		});

		it('Expression interpretation should equal "emöt"', function () {
			result.expressions[0].interpretation.should.equal("emöt");
		});

		it('Should return zero results', function () {
			result.documents.length.should.equal(0);
		});
	});
});

describe('Ranker', function () {
	var thinker = Thinker( {
			characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g
		}),
		ranker = Thinker.rankers.standard({
			directHit: 1,
			partialHit: 0.5,
			eachPartialExpressionFactor: 1.5,
			eachDirectExpressionFactor: 2,
			fields: {
				1: { weight: 4},
				2: { weight: 2}
			}
		});

	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy);

	describe('Basic search "artikel"', function () {	
		var result = thinker.find("artikel");

		it('Should return two results', function () {
			result.documents.length.should.equal(2);
		});

		describe('Result order', function () {
			it('First result should have id 0', function () {
				result.documents[0].id.should.equal(0);

			});

			it('Second result should have id 2', function () {
				result.documents[1].id.should.equal(2);

			});
		});

		describe('Result type', function () {
			it('First result should be direct', function () {
				result.documents[0].expressions[0].should.equal(2);

			});

			it('Second result should be partial', function () {
				result.documents[1].expressions[0].should.equal(1);
			});
		});

		describe('Result weight', function () {
			it('First result should have a weight of 4*1*2', function () {
				result.documents[0].weight.should.equal(8);
			});

			it('Second result should have a weight of 2*0.5*1.5', function () {
				result.documents[1].weight.should.equal(1.5);
			});
		});
	});
});


describe('Ranker: Boost percentage', function () {
	var thinker = Thinker({ characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g }),
		ranker = Thinker.rankers.standard({
			directHit: 1,
			partialHit: 0.5,
			eachPartialExpressionFactor: 1.5,
			eachDirectExpressionFactor: 2,
			fields: {
				1: { weight: 4, boostPercentage: true},
				2: { weight: 2}
			}
		});

	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy);

	describe('Basic search "artikel"', function () {	
		var result = thinker.find("artikel");

		it('Should return two results', function () {
			result.documents.length.should.equal(2);
		});

		describe('Result weight', function () {
			it('First result should have a weight of 4*1*2*1.3333', function () {
				result.documents[0].weight.toFixed(4).should.equal('15.4667');
			});

			it('Second result should have a weight of 2*0.5*1.5', function () {
				result.documents[1].weight.should.equal(1.5);
			});
		});
	});
});

describe('Advanced ranker', function () {
	var thinker = Thinker({
		characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g
	});
	var ranker = Thinker.rankers.standard({
		directHit: 1,
		partialHit: 0.5,			
		eachPartialExpressionFactor: 1.5,
		eachDirectExpressionFactor: 2,
		fields: {
			1: {weight: 4 },
			2: {weight: 2 }
		}
	});

	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy);

	describe('Basic search "artikel"', function () {	
		var result = thinker.find("artikel anders namn");

		it('Should return two results', function () {
			result.documents.length.should.equal(2);
		});

		describe('Result order', function () {
			it('First result should have id 0', function () {
				result.documents[0].id.should.equal(0);

			});

			it('Second result should have id 2', function () {
				result.documents[1].id.should.equal(2);

			});
		});

		describe('Result type', function () {
			it('First result should be 3 direct matches', function () {
				result.documents[0].expressions[0].should.equal(2);
				result.documents[0].expressions[1].should.equal(2);
				result.documents[0].expressions[2].should.equal(2);
			});

			it('Second result should be 2 partial and one direct', function () {
				result.documents[1].expressions[0].should.equal(1);
				result.documents[1].expressions[1].should.equal(1);
				result.documents[1].expressions[2].should.equal(2);
			});
		});

		describe('Result weight', function () {
			it('First result should have a weight of (((4*1)+(2*1)+(2*1)))*2*2*2', function () {
				result.documents[0].weight.should.equal(64);

			});

			it('Second result should have a weight of (((2*0.5)+(2*0.5)+(2*1)))*2*1.5*1.5', function () {
				result.documents[1].weight.should.equal(18);
			});
		});
	});
});

describe('Suggestion', function () {
	var thinker = Thinker({
		suggestionMinWordCount: 1,
		enableSuggestions: true,
		characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g
	});

	var ranker = Thinker.rankers.standard();

	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy);

	describe('Search "liaså"', function () {	
		var result = thinker.find("liaså");
		
		it('Should return one expression', function () {
			result.expressions.length.should.equal(1);
		});

		it('Should return "likaså" as suggestion', function () {
			result.expressions[0].suggestion.should.equal('likaså');
		});
	});
});

describe('Word-processor: Stopwords', function () {
	var thinker   = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});
	var ranker 	  = Thinker.rankers.standard();
	var stopwords = Thinker.processors.stopwords({
		"artikel": true,
		"bemötande": true
	});

	thinker.addWordProcessor(stopwords);
	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.feed(exampleTextsCopy);

	describe('Basic search "Bemötande"', function () {	
		var result = thinker.find("bemötande");

		it('Should return zero expressions', function () {
			result.expressions.length.should.equal(0);
		});

		it('Should return zero documents', function () {
			result.documents.length.should.equal(0);
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
	thinker.feed(exampleTextsCopy);

	describe('Search "KaaalLlle"', function () {
		var result = thinker.find("KaaalLlle");

		it('Should return one result', function () {
			result.documents.length.should.equal(1);
		});
	});

	describe('Search "kallle" (stopword)', function () {
		var result = thinker.find("kallle");

		it('Should return zero result', function () {
			result.documents.length.should.equal(0);
		});
	});

	describe('Search "k000aaaallle"', function () {
		var result = thinker.find("k000aaaallle");

		it('Expression interpretation should equal "k000ale"', function () {
			result.expressions[0].interpretation.should.equal("k000ale");
		});
	});
});


describe('Word processor: Swedish stemmer', function () {
	var stemmerStopwords = {
		"anders": true,
		"jonas": true
	};

	var thinker 	= Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});
	var ranker 		= Thinker.rankers.standard();
	var stemmer 	= Thinker.processors.stemmers.swedish(stemmerStopwords);
	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.addWordProcessor(stemmer);
	thinker.ranker = ranker;

	thinker.feed(exampleTextsCopy);

	describe('Search for stopword "anders"', function () {	
		var result = thinker.find("anders");

		it('Should return one expression', function () {	
			result.expressions.length.should.equal(1);
		});

		it('Expression interpretation be unchanged("anders")', function () {
			result.expressions[0].interpretation.should.equal("anders");
		});

		it('Should return two results', function () {
			result.documents.length.should.equal(2);
		});

		it('First result should be a direct match (anders)', function () {
			result.documents[0].expressions[0].should.equal(2);
		});

		it('Second result should be a partial match (andersson)', function () {
			result.documents[1].expressions[0].should.equal(1);
		});
	});

	describe('Search for "bemötandet" in exact mode', function () {	
		var result = thinker.find("\"bemötandet\"");

		it('Should return one expression', function () {	
			result.expressions.length.should.equal(1);
		});

		it('Expression interpretation be unchanged("bemötandet")', function () {
			result.expressions[0].interpretation.should.equal("bemötandet");
		});

		it('Expression should be in exact mode', function () {
			result.expressions[0].exactMode.should.equal(true);
		});

		it('Should return one resultt', function () {
			result.documents.length.should.equal(1);
		});

		it('First result should be a direct match (anders)', function () {
			result.documents[0].expressions[0].should.equal(2);
		});

		it('First result should have document id 0', function () {
			result.documents[0].id.should.equal(0);
		});
		

	});


	describe('Search for "Bemötas"', function () {		
			
		var result = thinker.find("Bemötas");		
		
		it('Should return one expression', function () {			
			result.expressions.length.should.equal(1);		
		});		
		
		it('Expression interpretation should equal "bemöt"', function () {		
			result.expressions[0].interpretation.should.equal("bemöt");		
		});		
		
		it('Should return three results (bemötandet, bemötande, bemött)', function () {		
			result.documents.length.should.equal(3);		
		});		
		
		it('All results should be a direct match', function () {		
			result.documents[0].expressions[0].should.equal(2);		
			result.documents[1].expressions[0].should.equal(2);		
			result.documents[2].expressions[0].should.equal(2);		
		});		
			
 	});
 		 
	describe('Search for "nyheternas"', function () {
			
		var result = thinker.find("nyheternas");		
		
		it('Should return one expression', function () {			
			result.expressions.length.should.equal(1);		
		});		
		
		it('Expression interpretation should equal "ny"', function () {		
			result.expressions[0].interpretation.should.equal("ny");		
		});		
		
		it('Should return 1 document', function () {		
			result.documents.length.should.equal(1);		
		});		
		
		it('All four (nyhet, nyheter, nyheten, nyhetens)results should be a direct match on the first result', function () {		
			result.documents[0].expressions[0].should.equal(2);
		});		
			
	});		

	describe('Search for "nya"', function () {		
			
		var result = thinker.find("nya");		
		
		it('Should return one expression', function () {			
			result.expressions.length.should.equal(1);		
		});		
		
		it('Expression interpretation should equal "ny"', function () {		
			result.expressions[0].interpretation.should.equal("ny");		
		});		
		
		it('Should return one document', function () {		
			result.documents.length.should.equal(1);		
		});		
		
		it('The result should be a direct match on the first result', function () {		
			result.documents[0].expressions[0].should.equal(2);	
		});		
			
	});		
		
	describe('Search for "radioar"', function () {		
			
		var result = thinker.find("radioar");		
		
		it('Expression interpretation should equal "radio"', function () {		
			result.expressions[0].interpretation.should.equal("radio");		
		});		
			
	});		
		
	describe('Search for "sprit"', function () {		
			
		var result = thinker.find("sprit");		
		
		it('Expression interpretation should equal "sprit"', function () {		
			result.expressions[0].interpretation.should.equal("sprit");		
		});		
			
	});		
		
	describe('Search for "produktutveckling"', function () {		
			
		var result = thinker.find("produktutveckling");		
		
		it('Expression interpretation should equal "produktutveckl"', function () {		
			result.expressions[0].interpretation.should.equal("produktutveckl");		
		});		
			
	});		
		
	describe('Search for "produktutvecklare"', function () {		
			
		var result = thinker.find("produktutvecklare");		
		
		it('Expression interpretation should equal "produktutveckl"', function () {		
			result.expressions[0].interpretation.should.equal("produktutveckl");		
		});		
			
	});		
		
	describe('Search for "produktutvecklarens"', function () {		
			
		var result = thinker.find("produktutvecklarens");		
		
		it('Expression interpretation should equal "produktutveckl"', function () {		
			result.expressions[0].interpretation.should.equal("produktutveckl");		
		});		
			
	});		
		
	describe('Search for "skrotverktyget"', function () {		
			
		var result = thinker.find("skrotverktyget");		
		
		it('Expression interpretation should equal "skrotverktyg"', function () {		
			result.expressions[0].interpretation.should.equal("skrotverktyg");		
		});		
			
	});		
		
		
	describe('Search for "skrotverktygets"', function () {		
			
		var result = thinker.find("skrotverktygets");		
		
		
		it('Expression interpretation should equal "skrotverktyg"', function () {		
			result.expressions[0].interpretation.should.equal("skrotverktyg");		
		});		
			
	});		
		
	describe('Search for "sandning"', function () {		
			
		var result = thinker.find("sandning");		
		
		it('Expression interpretation should equal "sand"', function () {		
			result.expressions[0].interpretation.should.equal("sand");		
		});		
			
	});		
		
	describe('Search for "sand"', function () {		
			
		var result = thinker.find("sand");		
		
		it('Expression interpretation should equal "sand"', function () {		
			result.expressions[0].interpretation.should.equal("sand");		
		});		
			
	});		
		
	describe('Search for "sandarens"', function () {		
			
		var result = thinker.find("sandarens");		
		
		it('Expression interpretation should equal "sand"', function () {		
			result.expressions[0].interpretation.should.equal("sand");		
		});		
			
	});		
		
		
	describe('Search for "skrotverktyg"', function () {		
			
		var result = thinker.find("skrotverktyg");		
		
		it('Expression interpretation should equal "skrotverktyg"', function () {		
			result.expressions[0].interpretation.should.equal("skrotverktyg");		
		});		
			
	});		
		
	describe('Search for "inbyggda"', function () {		
			
		var result = thinker.find("inbyggda");		
		
		it('Expression interpretation should equal "inbygg"', function () {		
			result.expressions[0].interpretation.should.equal("inbygg");		
		});		
			
	});		
		
	describe('Search for "inbyggd"', function () {		
			
		var result = thinker.find("inbyggd");		
		
		it('Expression interpretation should equal "inbygg"', function () {		
			result.expressions[0].interpretation.should.equal("inbygg");		
		});		
			
	});		
		
	describe('Search for "antikviteten"', function () {		
			
		var result = thinker.find("antikviteten");		
		
		it('Should return one expression', function () {			
			result.expressions.length.should.equal(1);		
		});		
		
		it('Expression interpretation should equal "antikv"', function () {		
			result.expressions[0].interpretation.should.equal("antikv");		
		});		
		
		it('Should return one result (antikviteten, antivitet, antikvitets)', function () {		
			result.documents.length.should.equal(3);		
		});		
		
		it('All results should be a direct match', function () {		
			result.documents[0].expressions[0].should.equal(2);
		});
	});
});


describe('Word processor: English stemmer', function () {

	var thinker 	= Thinker();
	var ranker 		= Thinker.rankers.standard();
	var stemmer 	= Thinker.processors.stemmers.english({
		"considerable": true
	});

	var exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

	thinker.addWordProcessor(stemmer);
	thinker.ranker = ranker;

	thinker.feed(exampleTextsCopy);

	describe('Search for "considerable"', function () {	
		var result = thinker.find("considerable");

		it('Should be interpreted as "considerable"', function () {	
			result.expressions[0].interpretation.should.equal("considerable");
		});

		it('Should give one result"', function () {	
			result.documents.length.should.equal(1);
		});

	});

	describe('Search for "considering"', function () {	
		var result = thinker.find("considering");

		it('Should be interpreted as "consid"', function () {	
			result.expressions[0].interpretation.should.equal("consid");
		});

		it('Should give one PARTIAL result"', function () {	
			result.documents.length.should.equal(1);
			result.documents[0].expressions[0].should.equal(1);
		});

	});

	describe('Search for "consider"', function () {	
		var result = thinker.find("consider");

		it('Should be interpreted as "consid"', function () {	
			result.expressions[0].interpretation.should.equal("consid");
		});

		it('Should give one PARTIAL result"', function () {	
			result.documents.length.should.equal(1);
			result.documents[0].expressions[0].should.equal(1);
		});

	});

	describe('Search for "triplicate"', function () {	
		var result = thinker.find("triplicate");

		it('Should be interpreted as "triplic"', function () {	
			result.expressions[0].interpretation.should.equal("triplic");
		});

	});

	describe('Search for "dependent"', function () {	
		var result = thinker.find("dependent");

		it('Should be interpreted as "depend"', function () {	
			result.expressions[0].interpretation.should.equal("depend");
		});

	});

	describe('Search for "probate"', function () {	
		var result = thinker.find("probate");

		it('Should be interpreted as "probat"', function () {	
			result.expressions[0].interpretation.should.equal("probat");
		});

	});

	describe('Search for "controllable"', function () {	
		var result = thinker.find("controllable");

		it('Should be interpreted as "control"', function () {	
			result.expressions[0].interpretation.should.equal("control");
		});

	});

	describe('Search for "rolling"', function () {	
		var result = thinker.find("rolling");

		it('Should be interpreted as "roll"', function () {	
			result.expressions[0].interpretation.should.equal("roll");
		});

	});
	
});

describe('Word processor: English soundex', function () {

	var thinker 	= Thinker();
	var ranker 		= Thinker.rankers.standard();
	var soundex 	= Thinker.processors.soundex();


	thinker.addWordProcessor(soundex);
	thinker.ranker = ranker;

	thinker.feed([
		[0,"This is a tile","This is a textual"],
		[1,"This is a tilly","This is a sexual"],
		
	]);

	describe('Search for "tile"', function () {	
		var result = thinker.find("tile");

		it('Should be interpreted as "T400"', function () {	
			result.expressions[0].interpretation.should.equal("T400");
		});

		it('Should give two results', function () {	
			result.documents.length.should.equal(2);
		});

	});

	describe('Search for "textual"', function () {	
		var result = thinker.find("textual");

		it('Should give one results', function () {	
			result.documents.length.should.equal(1);
		});

	});
	
});


describe('Field processor: HTML-Stripper', function () {
	var thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});
	var ranker = Thinker.rankers.standard();
	var stripHtml = Thinker.processors.stripHtml();

	thinker.addFieldProcessor(stripHtml);
	thinker.ranker = ranker;

	// We need to make a copy of exampletexts, as feed consumes the object
	var exampleHtml = [
		[0,"&#x74;&#x69;&#x74;&#x6C;&#x65;","<!-- htmlcomment --><p><script>scriptcontent</script><h1>atitle</h1><style> div > #id { stylecontent; } </style><img alt=\"imgdescription\"><a href=\"http://url\">linktext</a><br><hr/><fakeunclosedtag>aword<strong>&Aring;rsringar &lt;innanf&ouml;r&gt; </p>"]
	];

	thinker.feed(exampleHtml);

	describe('Search "title"', function () {
		var result = thinker.find("title");

		it('Should return one result', function () {
			result.documents.length.should.equal(1);
		});
	});

	describe('Search "htmlcomment"', function () {	
		var result = thinker.find("htmlcomment");

		it('Should return zero results', function () {
			result.documents.length.should.equal(0);
		});
	});

	describe('Search "scriptcontent"', function () {	
		var result = thinker.find("scriptcontent");

		it('Should return zero results', function () {
			result.documents.length.should.equal(0);
		});
	});

	describe('Search "stylecontent"', function () {	
		var result = thinker.find("stylecontent");

		it('Should return zero results', function () {
			result.documents.length.should.equal(0);
		});
	});

	describe('Search "atitle"', function () {	
		var result = thinker.find("atitle");

		it('Should return one results', function () {
			result.documents.length.should.equal(1);
		});
	});

	describe('Search "imgdescription"', function () {	
		var result = thinker.find("imgdescription");

		it('Should return one results', function () {
			result.documents.length.should.equal(1);
		});
	});

	describe('Search "http"', function () {	
		var result = thinker.find("http");

		it('Should return one results', function () {
			result.documents.length.should.equal(1);
		});
	});

	describe('Search "fakeunclosedtag"', function () {	
		var result = thinker.find("fakeunclosedtag");

		it('Should return zero results', function () {
			result.documents.length.should.equal(0);
		});
	});

	describe('Search "aword"', function () {	
		var result = thinker.find("aword");

		it('Should return one result', function () {
			result.documents.length.should.equal(1);
		});
	});

	describe('Search "årsringar"', function () {	
		var result = thinker.find("årsringar");

		it('Should return one result', function () {
			result.documents.length.should.equal(1);
		});
	});

	describe('Search "innanför"', function () {	
		var result = thinker.find("innanför");

		it('Should return one result', function () {
			result.documents.length.should.equal(1);
		});
	});
});