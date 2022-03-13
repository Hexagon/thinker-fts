/*eslint no-unused-vars: ["off"]*/

const should = require("should");

module.exports = function (Thinker) {

	/* START OF EXAMPLE DATA */
	let exampleTexts = [
		{id: 0, fields: [ "Artikel nummer noll","Det här är ettan i det hela, Anders är ett namn. Stavros likaså antikvitets. Bemötandet. kreativitet Kalle olle lars considerable"] },
		{id: 1, fields: [ "Bemötande testtitel med extra ord","Brödtext nummer ett. Ander antikviteten olle lars sven"] },
		{id: 2, fields: [ "Titeln med extra Testning","Brödtext i sanden artikeln artikeln artikeln artikeln två. Bemött namn Andersson antikvitet nyhet, nyheter, nyheten, nyhetens, nya olle"] }
	];

	/* END OF EXAMPLE DATA */
	describe("Simple usage", function () {
		let thinker = Thinker();

		thinker.ranker = Thinker.rankers.standard();

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
		thinker.feed(exampleTextsCopy);

		describe("Search for \"artikel\"", function () {	
			let result = thinker.find("artikel i");

			// The second expressin is ignored as default minWordLength is 2
			it("Should return one expression", function () {	
				result.expressions.length.should.equal(1);
			});

			it("Expression processed should equal \"artikel\"", function () {
				result.expressions[0].interpretation.processed.should.equal("artikel");
			});

			it("Should return two results", function () {
				result.documents.length.should.equal(2);
			});

			it("First result should have id 0", function () {
				result.documents[0].id.should.equal(0);
			});

			it("First result should be an direct match", function () {
				result.documents[0].expressions[0].should.equal(3);
			});

			it("Second result should have id 2", function () {
				result.documents[1].id.should.equal(2);
			});

			it("Second result should be an partial match", function () {
				result.documents[1].expressions[0].should.equal(1);
			});
		});
	});

	describe("Simple usage: Local characters", function () {
		let thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});

		thinker.ranker = Thinker.rankers.standard();

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
		thinker.feed(exampleTextsCopy);

		describe("opts.characters", function () {	
			let result = thinker.find("ånglok");

			// The second expressin is ignored as default minWordLength is 2
			it("Should return one expression", function () {	
				result.expressions.length.should.equal(1);
			});

			it("Expression processed should equal \"ånglok\"", function () {
				result.expressions[0].interpretation.processed.should.equal("ånglok");
			});

		});
	});

	describe("Simple usage: Exact mode", function () {
		let thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});

		thinker.ranker = Thinker.rankers.standard();

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
		thinker.feed(exampleTextsCopy);

		describe("opts.characters", function () {	
			let result = thinker.find("ånglok");

			// The second expressin is ignored as default minWordLength is 2
			it("Should return one expression", function () {	
				result.expressions.length.should.equal(1);
			});

			it("Expression processed should equal \"ånglok\"", function () {
				result.expressions[0].interpretation.processed.should.equal("ånglok");
			});

		});
	});

	describe("Simple usage: Modifiers", function () {
		let thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});

		thinker.ranker = Thinker.rankers.standard();

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
		thinker.feed(exampleTextsCopy);

		describe("olle +lars -sven", function () {	
			let result = thinker.find("olle +lars -sven");

			// The second expressin is ignored as default minWordLength is 2
			it("Should return three expressions", function () {	
				result.expressions.length.should.equal(3);
			});

			it("Expressions two should have + modifier", function () {	
				result.expressions[1].modifier.should.equal("+");
			});
            
			it("Expressions three should have - modifier", function () {	
				result.expressions[2].modifier.should.equal("-");
			});

			it("Expression processed two should equal \"lars\"", function () {
				result.expressions[1].interpretation.processed.should.equal("lars");
			});
			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});

			it("Should be document id 0", function () {
				result.documents[0].id.should.equal(0);
			});
		});
	});

	describe("Partial match", function () {
		let thinker = Thinker({
			characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g
		});

		thinker.ranker = Thinker.rankers.standard();

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

		thinker.feed(exampleTextsCopy);

		describe("Search for \"emöt\"", function () {	
			let result = thinker.find("emöt");

			it("Should return one expression", function () {	
				result.expressions.length.should.equal(1);
			});

			it("Expression processed should equal \"emöt\"", function () {
				result.expressions[0].interpretation.processed.should.equal("emöt");
			});

			it("Should return three results (bemötandet, bemötande, bemött)", function () {
				result.documents.length.should.equal(3);
			});

			it("All results should be a partial match", function () {
				result.documents[0].expressions[0].should.equal(1);
				result.documents[1].expressions[0].should.equal(1);
				result.documents[2].expressions[0].should.equal(1);
			});
		});
	});

	describe("Partial match with minimum word length match 5", function () {
		let thinker = Thinker({
				characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g,
				minWildcardWordLen: 5 } ),
			ranker = Thinker.rankers.standard();

		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		thinker.feed(JSON.parse(JSON.stringify(exampleTexts)));

		describe("Search for \"emöt\"", function () {
			let result = thinker.find("emöt");

			it("Should return one expression", function () {	
				result.expressions.length.should.equal(1);
			});

			it("Expression processed should equal \"emöt\"", function () {
				result.expressions[0].interpretation.processed.should.equal("emöt");
			});

			it("Should return zero results", function () {
				result.documents.length.should.equal(0);
			});
		});
	});

	describe("Ranker", function () {
		let thinker = Thinker( {
				characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g
			}),
			ranker = Thinker.rankers.standard({
				exactHit: 1,
				processedHit: 0.75,
				partialHit: 0.5,
				fields: {
					0: { weight: 4},
					1: { weight: 2}
				}
			});

		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

		thinker.feed(exampleTextsCopy);

		describe("Basic search \"artikel\"", function () {	
			let result = thinker.find("artikel");

			it("Should return two results", function () {
				result.documents.length.should.equal(2);
			});

			describe("Result order", function () {
				it("First result should have id 0", function () {
					result.documents[0].id.should.equal(0);

				});

				it("Second result should have id 2", function () {
					result.documents[1].id.should.equal(2);

				});
			});

			describe("Result type", function () {
				it("First result should be direct", function () {
					result.documents[0].expressions[0].should.equal(3);

				});

				it("Second result should be partial", function () {
					result.documents[1].expressions[0].should.equal(1);
				});
			});

			describe("Result weight", function () {
				it("First result should have a weight of 4*1", function () {
					result.documents[0].weight.should.equal(4);
				});

				it("Second result should have a weight of 2*0.5", function () {
					result.documents[1].weight.should.equal(1);
				});
			});
		});
	});


	describe("Ranker: Boost percentage", function () {
		let thinker = Thinker({ characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g }),
			ranker = Thinker.rankers.standard({
				exactHit: 1,
				processedHit: 0.75,
				partialHit: 0.5,
				fields: {
					0: { weight: 4, boostPercentage: true},
					1: { weight: 2}
				}
			});

		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

		thinker.feed(exampleTextsCopy);

		describe("Basic search \"artikel\"", function () {	

			let result = thinker.find("artikel");

			it("Should return two results", function () {
				result.documents.length.should.equal(2);
			});

			describe("Result weight", function () {
				it("First result should have a weight of 4*1*1.9333", function () {
					result.documents[0].weight.toFixed(4).should.equal("7.7333");
				});

				it("Second result should have a weight of 2*0.5", function () {
					result.documents[1].weight.should.equal(1);
				});
			});
		});
	});

	describe("Advanced ranker", function () {
		let thinker = Thinker({
			characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g
		});
		let ranker = Thinker.rankers.standard({
			exactHit: 1,
			processedHit: 0.75,
			partialHit: 0.5,
			fields: {
				0: {weight: 4 },
				1: {weight: 2 }
			}
		});

		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

		thinker.feed(exampleTextsCopy);

		describe("Basic search \"artikel\"", function () {	
			let result = thinker.find("artikel anders namn");

			it("Should return two results", function () {
				result.documents.length.should.equal(2);
			});

			describe("Result order", function () {
				it("First result should have id 0", function () {
					result.documents[0].id.should.equal(0);

				});

				it("Second result should have id 2", function () {
					result.documents[1].id.should.equal(2);

				});
			});

			describe("Result type", function () {
				it("First result should be 3 direct matches", function () {
					result.documents[0].expressions[0].should.equal(3);
					result.documents[0].expressions[1].should.equal(3);
					result.documents[0].expressions[2].should.equal(3);
				});

				it("Second result should be 2 partial and one direct", function () {
					result.documents[1].expressions[0].should.equal(1);
					result.documents[1].expressions[1].should.equal(1);
					result.documents[1].expressions[2].should.equal(3);
				});
			});

			describe("Result weight", function () {
				it("First result should have a weight of (((4*1)+(2*1)+(2*1)))", function () {
					result.documents[0].weight.should.equal((((4*1)+(2*1)+(2*1))));

				});

				it("Second result should have a weight of (((2*0.5)+(2*0.5)+(2*1)))", function () {
					result.documents[1].weight.should.equal((((2*0.5)+(2*0.5)+(2*1))));
				});
			});
		});
	});

	describe("Suggestion", function () {
		let thinker = Thinker({
			suggestionMinWordCount: 1,
			enableSuggestions: true,
			characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g
		});

		let ranker = Thinker.rankers.standard();

		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

		thinker.feed(exampleTextsCopy);

		describe("Search \"liaså\"", function () {	
			let result = thinker.find("liaså");
            
			it("Should return one expression", function () {
				result.expressions.length.should.equal(1);
			});

			it("Should return \"likaså\" as suggestion", function () {
				result.expressions[0].suggestion.should.equal("likaså");
			});
		});
	});

	describe("Word-processor: Stopwords", function () {
		let thinker   = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});
		let ranker 	  = Thinker.rankers.standard();
		let stopwords = Thinker.processors.stopwords({
			"artikel": true,
			"bemötande": true
		});

		thinker.addWordProcessor(stopwords);
		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

		thinker.feed(exampleTextsCopy);

		describe("Basic search \"Bemötande\"", function () {	
			let result = thinker.find("bemötande");

			it("Should return zero expressions", function () {
				result.expressions.length.should.equal(0);
			});

			it("Should return zero documents", function () {
				result.documents.length.should.equal(0);
			});
		});
	});

	describe("Word-processor: Multiples", function () {
		let thinker   = Thinker();
		let ranker 	  = Thinker.rankers.standard();
		let multiples = Thinker.processors.multiples({
			"kallle": true
		});

		thinker.addWordProcessor(multiples);
		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));
		thinker.feed(exampleTextsCopy);

		describe("Search \"KaaalLlle\"", function () {
			let result = thinker.find("KaaalLlle");

			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"kallle\" (stopword)", function () {
			let result = thinker.find("kallle");

			it("Should return zero result", function () {
				result.documents.length.should.equal(0);
			});
		});

		describe("Search \"k000aaaallle\"", function () {
			let result = thinker.find("k000aaaallle");

			it("Expression processed should equal \"k000ale\"", function () {
				result.expressions[0].interpretation.processed.should.equal("k000ale");
			});
		});
	});

	describe("Word processor: Swedish stemmer", function () {
		let stemmerStopwords = {
			"anders": true,
			"stavros": true
		};

		let thinker 	= Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});
		let ranker 		= Thinker.rankers.standard();
		let stemmer 	= Thinker.processors.stemmers.swedish(stemmerStopwords);
		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

		thinker.addWordProcessor(stemmer);
		thinker.ranker = ranker;

		thinker.feed(exampleTextsCopy);

		describe("Search for stopword \"anders\"", function () {	
			let result = thinker.find("anders");

			it("Should return one expression", function () {	
				result.expressions.length.should.equal(1);
			});

			it("Expression processed be unchanged(\"anders\")", function () {
				result.expressions[0].interpretation.processed.should.equal("anders");
			});

			it("Should return two results", function () {
				result.documents.length.should.equal(2);
			});

			it("First result should be a direct match (anders)", function () {
				result.documents[0].expressions[0].should.equal(3);
			});

			it("Second result should be a partial match (andersson)", function () {
				result.documents[1].expressions[0].should.equal(1);
			});
		});

		describe("Search for \"bemötandet\" in exact mode", function () {	
			let result = thinker.find("\"bemötandet\"");

			it("Should return one expression", function () {	
				result.expressions.length.should.equal(1);
			});

			it("Expression processed be unchanged(\"bemötandet\")", function () {
				result.expressions[0].interpretation.preprocessed.should.equal("bemötandet");
			});

			it("Expression should be in exact mode", function () {
				result.expressions[0].exactMode.should.equal(true);
			});

			it("Should return one resultt", function () {
				result.documents.length.should.equal(1);
			});

			it("First result should be a direct match (anders)", function () {
				result.documents[0].expressions[0].should.equal(3);
			});

			it("First result should have document id 0", function () {
				result.documents[0].id.should.equal(0);
			});
            

		});


		describe("Search for \"Bemötas\"", function () {		
                
			let result = thinker.find("Bemötas");		
            
			it("Should return one expression", function () {			
				result.expressions.length.should.equal(1);		
			});		
            
			it("Expression processed should equal \"bemöt\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("bemöt");		
			});		
            
			it("Should return three results (bemötandet, bemötande, bemött)", function () {		
				result.documents.length.should.equal(3);		
			});		
            
			it("All results should be a processed match", function () {		
				result.documents[0].expressions[0].should.equal(2);		
				result.documents[1].expressions[0].should.equal(2);		
				result.documents[2].expressions[0].should.equal(2);		
			});		
                
		});

		describe("Search for \"lyssningarna\"", function () {		
                
			let result = thinker.find("lyssningarna");		
            
			it("Expression processed should equal \"lyssn\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("lyssn");		
			});		
                
		});

		describe("Search for \"lyssna\"", function () {		
                
			let result = thinker.find("lyssning");		
            
			it("Expression processed should equal \"lyssn\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("lyssn");		
			});		
                
		});

		describe("Search for \"lyssning\"", function () {		
                
			let result = thinker.find("lyssning");		
            
			it("Expression processed should equal \"lyssn\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("lyssn");		
			});		
                
		});

		describe("Search for \"lyssnarens\"", function () {		
                
			let result = thinker.find("lyssnarens");		
            
			it("Expression processed should equal \"lyssn\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("lyssn");		
			});		
                
		});

		describe("Search for \"lyssningens\"", function () {		
                
			let result = thinker.find("lyssningens");		
            
			it("Expression processed should equal \"lyssn\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("lyssn");		
			});		
                
		});

		describe("Search for \"lyssningen\"", function () {		
                
			let result = thinker.find("lyssningen");		
            
			it("Expression processed should equal \"lyssn\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("lyssn");		
			});		

		});

		describe("Search for \"lyssnandet\"", function () {		
                
			let result = thinker.find("lyssnandet");		
            
			it("Expression processed should equal \"lyssn\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("lyssn");		
			});		
                
		});

		describe("Search for \"lyssnare\"", function () {		
                
			let result = thinker.find("lyssnare");		
            
			it("Expression processed should equal \"lyssn\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("lyssn");		
			});		
                
		});

		describe("Search for \"lyssna\"", function () {		
                
			let result = thinker.find("lyssna");		
            
			it("Expression processed should equal \"lyssn\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("lyssn");		
			});		
                
		});

		describe("Search for \"nyheternas\"", function () {
                
			let result = thinker.find("nyheternas");		
            
			it("Should return one expression", function () {			
				result.expressions.length.should.equal(1);		
			});		
            
			it("Expression processed should equal \"ny\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("ny");		
			});		
            
			it("Should return 1 document", function () {		
				result.documents.length.should.equal(1);		
			});		
            
			it("All four (nyhet, nyheter, nyheten, nyhetens)results should be a processed match on the first result", function () {		
				result.documents[0].expressions[0].should.equal(2);
			});		
                
		});		


		describe("Search for \"nya\"", function () {		
                
			let result = thinker.find("nya");		
            
			it("Should return one expression", function () {			
				result.expressions.length.should.equal(1);		
			});		
            
			it("Expression processed should equal \"ny\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("ny");		
			});		
            
			it("Should return one document", function () {		
				result.documents.length.should.equal(1);		
			});		
            
			it("The result should be a direct match on the first result", function () {		
				result.documents[0].expressions[0].should.equal(3);	
			});		
                
		});		
            
		describe("Search for \"radioar\"", function () {		
                
			let result = thinker.find("radioar");		
            
			it("Expression processed should equal \"radio\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("radio");		
			});		
                
		});		
            
		describe("Search for \"sprit\"", function () {		
                
			let result = thinker.find("sprit");		
            
			it("Expression processed should equal \"sprit\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("sprit");		
			});		
                
		});		
            
		describe("Search for \"produktutveckling\"", function () {		
                
			let result = thinker.find("produktutveckling");		
            
			it("Expression processed should equal \"produktutveckl\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("produktutveckl");		
			});		
                
		});		
            
		describe("Search for \"produktutvecklare\"", function () {		
                
			let result = thinker.find("produktutvecklare");		
            
			it("Expression processed should equal \"produktutveckl\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("produktutveckl");		
			});		
                
		});		
            
		describe("Search for \"produktutvecklarens\"", function () {		
                
			let result = thinker.find("produktutvecklarens");		
            
			it("Expression processed should equal \"produktutveckl\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("produktutveckl");		
			});		
                
		});		
            
		describe("Search for \"skrotverktyget\"", function () {		
                
			let result = thinker.find("skrotverktyget");		
            
			it("Expression processed should equal \"skrotverktyg\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("skrotverktyg");		
			});		
                
		});		
            
            
		describe("Search for \"skrotverktygets\"", function () {		
                
			let result = thinker.find("skrotverktygets");		
            
            
			it("Expression processed should equal \"skrotverktyg\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("skrotverktyg");		
			});		
                
		});		

		describe("Search for \"sand\"", function () {		
                
			let result = thinker.find("sand");		
            
			it("Expression processed should equal \"sand\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("sand");		
			});		
                
		});		
            
		describe("Search for \"sandarens\"", function () {		
                
			let result = thinker.find("sandarens");		
            
			it("Expression processed should equal \"sand\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("sand");		
			});		
                
		});		
        
		describe("Search for \"faktura\"", function () {		
                
			let result = thinker.find("faktura");		
            
			it("Expression processed should equal \"faktur\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("faktur");		
			});		
                
		});	

		describe("Search for \"fakturan\"", function () {		

			let result = thinker.find("fakturan");		

			it("Expression processed should equal \"faktur\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("faktur");		
			});

		});	

		describe("Search for \"fakturans\"", function () {		
                
			let result = thinker.find("fakturans");		
            
			it("Expression processed should equal \"faktur\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("faktur");		
			});		
                
		});	

		describe("Search for \"fakturor\"", function () {		
                
			let result = thinker.find("fakturor");		
            
			it("Expression processed should equal \"faktur\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("faktur");		
			});		
                
		});	

		describe("Search for \"fakturorna\"", function () {		
                
			let result = thinker.find("fakturorna");		
            
			it("Expression processed should equal \"faktur\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("faktur");		
			});		
                
		});	

		describe("Search for \"fakturornas\"", function () {		
                
			let result = thinker.find("fakturornas");		
            
			it("Expression processed should equal \"faktur\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("faktur");		
			});		
                
		});	

		describe("Search for \"fakturors\"", function () {		
                
			let result = thinker.find("fakturors");		
            
			it("Expression processed should equal \"faktur\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("faktur");		
			});		
                
		});	

		describe("Search for \"kampanj\"", function () {		
                
			let result = thinker.find("kampanj");		
            
			it("Expression processed should equal \"kampanj\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("kampanj");		
			});		
                
		});	

		describe("Search for \"kampanjer\"", function () {		
                
			let result = thinker.find("kampanjer");		
            
			it("Expression processed should equal \"kampanj\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("kampanj");		
			});		
                
		});	

		describe("Search for \"kampanjen\"", function () {		
                
			let result = thinker.find("kampanjen");		
            
			it("Expression processed should equal \"kampanj\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("kampanj");		
			});		
                
		});	

		describe("Search for \"kampanjens\"", function () {		
                
			let result = thinker.find("kampanjens");		
            
			it("Expression processed should equal \"kampanj\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("kampanj");		
			});		
                
		});	

		describe("Search for \"kampanjernas\"", function () {		
                
			let result = thinker.find("kampanjernas");		
            
			it("Expression processed should equal \"kampanj\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("kampanj");		
			});		
                
		});


		describe("Search for \"kampanjerna\"", function () {		
                
			let result = thinker.find("kampanjerna");		
            
			it("Expression processed should equal \"kampanj\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("kampanj");		
			});		
                
		});


		describe("Search for \"skrotverktyg\"", function () {		
                
			let result = thinker.find("skrotverktyg");		
            
			it("Expression processed should equal \"skrotverktyg\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("skrotverktyg");		
			});		
                
		});		
            
		describe("Search for \"inbyggda\"", function () {		
                
			let result = thinker.find("inbyggda");		
            
			it("Expression processed should equal \"inbygg\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("inbygg");		
			});		
                
		});		
            
		describe("Search for \"inbyggd\"", function () {		
                
			let result = thinker.find("inbyggd");		
            
			it("Expression processed should equal \"inbygg\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("inbygg");		
			});		
                
		});		

		describe("Search for \"inbyggda\"", function () {		

			let result = thinker.find("inbyggda");		

			it("Expression processed should equal \"inbygg\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("inbygg");		
			});		

		});

		describe("Search for \"hastighet\"", function () {		

			let result = thinker.find("hastighet");		

			it("Expression processed should equal \"hast\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("hast");		
			});		

		});

		describe("Search for \"hastighetens\"", function () {		

			let result = thinker.find("hastighetens");		

			it("Expression processed should equal \"hast\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("hast");		
			});		

		});

		describe("Search for \"hastigheter\"", function () {		

			let result = thinker.find("hastigheter");		

			it("Expression processed should equal \"hast\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("hast");		
			});		

		});

		describe("Search for \"hastigheternas\"", function () {		

			let result = thinker.find("hastigheternas");		

			it("Expression processed should equal \"hast\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("hast");		
			});		

		});


		describe("Search for \"hastigheterna\"", function () {		

			let result = thinker.find("hastigheterna");		

			it("Expression processed should equal \"hast\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("hast");		
			});		

		});


		describe("Search for \"bredband\"", function () {		

			let result = thinker.find("bredband");		

			it("Expression processed should equal \"bredb\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("bredb");		
			});

		});

		describe("Search for \"bredbandet\"", function () {		

			let result = thinker.find("bredbandet");		

			it("Expression processed should equal \"bredb\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("bredb");		
			});		

		});

		describe("Search for \"bredbandens\"", function () {		

			let result = thinker.find("bredbandens");		

			it("Expression processed should equal \"bredb\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("bredb");		
			});		

		});

		describe("Search for \"bredbandets\"", function () {		

			let result = thinker.find("bredbandets");		

			it("Expression processed should equal \"bredb\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("bredb");		
			});		

		});

		describe("Search for \"sökmotorn\"", function () {		

			let result = thinker.find("sökmotorn");		

			it("Expression processed should equal \"sökmot\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("sökmot");		
			});		
		});

		describe("Search for \"sökmotor\"", function () {

			let result = thinker.find("sökmotor");		

			it("Expression processed should equal \"sökmot\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("sökmot");		
			});		

		});

		describe("Search for \"sökmotorer\"", function () {

			let result = thinker.find("sökmotorer");		

			it("Expression processed should equal \"sökmot\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("sökmot");		
			});		

		});

		describe("Search for \"antikviteten\"", function () {		

			let result = thinker.find("antikviteten");		

			it("Should return one expression", function () {			
				result.expressions.length.should.equal(1);		
			});		

			it("Expression processed should equal \"antikv\"", function () {		
				result.expressions[0].interpretation.processed.should.equal("antikv");		
			});		

			it("Should return one result (antikviteten, antivitet, antikvitets)", function () {		
				result.documents.length.should.equal(3);		
			});		

			it("All results should be a direct match", function () {		
				result.documents[0].expressions[0].should.equal(3);
			});

		});
	});


	describe("Word processor: English stemmer", function () {

		let thinker 	= Thinker();
		let ranker 		= Thinker.rankers.standard();
		let stemmer 	= Thinker.processors.stemmers.english({
			"considerable": true
		});

		let exampleTextsCopy = JSON.parse(JSON.stringify(exampleTexts));

		thinker.addWordProcessor(stemmer);
		thinker.ranker = ranker;

		thinker.feed(exampleTextsCopy);

		describe("Search for \"considerable\"", function () {	
			let result = thinker.find("considerable");

			it("Should be interpreted as \"considerable\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("considerable");
			});

			it("Should give one result\"", function () {	
				result.documents.length.should.equal(1);
			});

		});

		describe("Search for \"considering\"", function () {	
			let result = thinker.find("considering");

			it("Should be interpreted as \"consid\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("consid");
			});

			it("Should give one PARTIAL result\"", function () {	
				result.documents.length.should.equal(1);
				result.documents[0].expressions[0].should.equal(1);
			});

		});

		describe("Search for \"consider\"", function () {	
			let result = thinker.find("consider");

			it("Should be interpreted as \"consid\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("consid");
			});

			it("Should give one PARTIAL result\"", function () {	
				result.documents.length.should.equal(1);
				result.documents[0].expressions[0].should.equal(1);
			});

		});

		describe("Search for \"triplicate\"", function () {	
			let result = thinker.find("triplicate");

			it("Should be interpreted as \"triplic\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("triplic");
			});

		});

		describe("Search for \"dependent\"", function () {	
			let result = thinker.find("dependent");

			it("Should be interpreted as \"depend\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("depend");
			});

		});

		describe("Search for \"probate\"", function () {	
			let result = thinker.find("probate");

			it("Should be interpreted as \"probat\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("probat");
			});

		});

		describe("Search for \"controllable\"", function () {	
			let result = thinker.find("controllable");

			it("Should be interpreted as \"control\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("control");
			});

		});

		describe("Search for \"rolling\"", function () {	
			let result = thinker.find("rolling");

			it("Should be interpreted as \"roll\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("roll");
			});

		});
        
	});

	describe("Word processor: English soundex", function () {

		let thinker 	= Thinker();
		let ranker 		= Thinker.rankers.standard();
		let soundex 	= Thinker.processors.soundex();


		thinker.addWordProcessor(soundex);
		thinker.ranker = ranker;

		thinker.feed([
			{ id: 0, fields: ["This is a tile","This is a textual"] },
			{ id: 1, fields: ["This is a tilly","This is a sexual"] }
		]);

		describe("Search for \"tile\"", function () {	
			let result = thinker.find("tile");

			it("Should be interpreted as \"T400\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("T400");
			});

			it("Should give two results", function () {	
				result.documents.length.should.equal(2);
			});

		});

		describe("Search for \"textual\"", function () {	
			let result = thinker.find("textual");

			it("Should give one results", function () {	
				result.documents.length.should.equal(1);
			});

		});
        
	});

	describe("concatenateWords option", function () {

		let thinker 	= Thinker({
			concatenateWords: 3
		});
		let ranker 		= Thinker.rankers.standard();

		thinker.ranker = ranker;

		thinker.feed([
			{ id: 0, fields: ["This is a tile","This is a textual"] },
			{ id: 1, fields: ["This is a tilly","This is a sexual"] }
		]);

		describe("Search for \"isatextual\"", function () {	
			let result = thinker.find("isatextual");

			it("Should be interpreted as \"isatextual\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("isatextual");
			});

			it("Should give one result", function () {	
				result.documents.length.should.equal(1);
			});

		});

		describe("Search for \"thisisatextual\"", function () {	
			let result = thinker.find("thisisatextual");

			it("Should give zero result", function () {	
				result.documents.length.should.equal(0);
			});

		});

		describe("Search for \"thisisa\"", function () {	
			let result = thinker.find("thisisa");

			it("Should give two result", function () {	
				result.documents.length.should.equal(2);
			});

		});

		describe("Search for \"thisis\"", function () {	
			let result = thinker.find("thisis");

			it("Should give zero result", function () {	
				result.documents.length.should.equal(2);
			});

		});

		describe("Search for \"isa\"", function () {	
			let result = thinker.find("isa");

			it("Should give zero result", function () {	
				result.documents.length.should.equal(2);
			});

		});

		describe("Search for \"atextual\"", function () {	
			let result = thinker.find("atextual");

			it("Should give zero result", function () {	
				result.documents.length.should.equal(1);
			});

		});

		describe("Search for \"isa\"", function () {	
			let result = thinker.find("isa");

			it("Should give two result", function () {	
				result.documents.length.should.equal(2);
			});

		});

	});


	describe("Field processor: HTML-Stripper", function () {
		let thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});
		let ranker = Thinker.rankers.standard();
		let stripHtml = Thinker.processors.stripHtml();

		thinker.addFieldProcessor(stripHtml);
		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleHtml = [
			{ id: 0, fields: [ "&#x74;&#x69;&#x74;&#x6C;&#x65;","<!-- htmlcomment --><p><script>scriptcontent</script><h1>atitle</h1><style> div > #id { stylecontent; } </style><img alt=\"imgdescription\"><a href=\"http://url\">linktext</a><br><hr/><fakeunclosedtag>aword<strong>&Aring;rsringar &lt;innanf&ouml;r&gt; </p>"] }
		];

		thinker.feed(exampleHtml);

		describe("Search \"title\"", function () {
			let result = thinker.find("title");

			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"htmlcomment\"", function () {	
			let result = thinker.find("htmlcomment");

			it("Should return zero results", function () {
				result.documents.length.should.equal(0);
			});
		});

		describe("Search \"scriptcontent\"", function () {	
			let result = thinker.find("scriptcontent");

			it("Should return zero results", function () {
				result.documents.length.should.equal(0);
			});
		});

		describe("Search \"stylecontent\"", function () {	
			let result = thinker.find("stylecontent");

			it("Should return zero results", function () {
				result.documents.length.should.equal(0);
			});
		});

		describe("Search \"atitle\"", function () {	
			let result = thinker.find("atitle");

			it("Should return one results", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"imgdescription\"", function () {	
			let result = thinker.find("imgdescription");

			it("Should return one results", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"http\"", function () {	
			let result = thinker.find("http");

			it("Should return one results", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"fakeunclosedtag\"", function () {	
			let result = thinker.find("fakeunclosedtag");

			it("Should return zero results", function () {
				result.documents.length.should.equal(0);
			});
		});

		describe("Search \"aword\"", function () {	
			let result = thinker.find("aword");

			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"årsringar\"", function () {	
			let result = thinker.find("årsringar");

			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"innanför\"", function () {	
			let result = thinker.find("innanför");

			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});
		});
	});

	describe("Filters", function () {
		let thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});
		let ranker = Thinker.rankers.standard();
		let stripHtml = Thinker.processors.stripHtml();

		thinker.addFieldProcessor(stripHtml);
		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleHtml = [
			{ id: 0, metadata: { testfilterbool: true, testfilterstring: "adfa", testfilterarr: [1,4,5] }, fields: ["Detta är en text som innehåller apa"] },
			{ id: 1, metadata: { testfilterbool: false, testfilterstring: "asdf", testfilterarr: [2,5] }, fields: [ "Detta är en text som innehåller kamel"] },
			{ id: 2, metadata: { testfilterbool: false, testfilterstring: "asdf", testfilterarr: [] }, fields: [ "Detta är en text som innehåller kanel"] },
			{ id: 3, metadata: { testfilterbool: false, testfilterstring: "asd", testfilterarr: [5] }, fields: [ "Detta är en text som innehåller kanel"] },
		];

		thinker.feed(exampleHtml);

		describe("Search \"apa\"", function () {
			let result = thinker.find( { expression: "apa", filter: () => true });

			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"text\"", function () {
			let result = thinker.find( { expression: "text", filter: () => true} );

			it("Should return three result", function () {
				result.documents.length.should.equal(4);
			});
		});

		describe("Search \"text\" with filter \"testfilterbool: true\"", function () {
			let result = thinker.find( { expression: "text", filter:  (filterData) => filterData.testfilterbool} );

			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"text\" with filter \"testfilterbool: false\"", function () {
			let result = thinker.find( { expression: "text", filter:  (filterData) => !filterData.testfilterbool} );

			it("Should return three result", function () {
				result.documents.length.should.equal(3);
			});
		});

		describe("Search \"text\" with filter \"testfilterstring: asdf\"", function () {
			let result = thinker.find( { expression: "text",  filter: (filterData) => filterData.testfilterstring === "asdf" } );
			it("Should return two result", function () {
				result.documents.length.should.equal(2);
			});
		});

		describe("Search \"text\" with filter \"testfilterstring: adfa\"", function () {
			let result = thinker.find( { expression: "text",  filter: (filterData) => filterData.testfilterstring === "adfa" } );
			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search \"text\" with filter \"testfilterstring: fafa\"", function () {
			let result = thinker.find( { expression: "text",  filter: (filterData) => filterData.testfilterstring === "fafa" } );
			it("Should return zero result", function () {
				result.documents.length.should.equal(0);
			});
		});

		describe("Search \"text\" with filter \"testfilterarr has 5\"", function () {
			let result = thinker.find( { expression: "text",  filter: (filterData) => ~filterData.testfilterarr.indexOf(5) } );
			it("Should return three result", function () {
				result.documents.length.should.equal(3);
			});
		});

		describe("Search \"text\" with filter \"testfilterarr has 5 && not testfilterbool\"", function () {
			let result = thinker.find( { expression: "text",  filter: (filterData) => ~filterData.testfilterarr.indexOf(5) && !filterData.testfilterbool } );
			it("Should return two result", function () {
				result.documents.length.should.equal(2);
			});
		});

		describe("Search exact \"\"text\"\" with filter \"testfilterbool\"", function () {
			let result = thinker.find( { expression: "\"text\"",  filter: (filterData) => filterData.testfilterbool } );
			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});
		});

		describe("Search exact \"\"text\"\" with filter \"!testfilterbool\"", function () {
			let result = thinker.find( { expression: "\"text\"",  filter: (filterData) => !filterData.testfilterbool } );
			it("Should return one result", function () {
				result.documents.length.should.equal(3);
			});
		});

		describe("Ranker: Sort by metadata parameter", function () {

			let thinker 	= Thinker();

			thinker.feed([
				{ id: 0, metadata: {a:2}, fields: ["This is a tile","This is a textual"] },
				{ id: 1, metadata: {a:1}, fields: ["This is a tilly","This is a sexual"] },
				{ id: 2, metadata: {a:3}, fields: ["This is a tilly","This is a usual"] },
				{ id: 3, metadata: {a:0}, fields: ["This is a tilly","This is a muse"] }
			]);

			describe("Search for \"tile\"", function () {	

				let result = thinker.find({
					expression: "this",
					sortBy: "a",
					direction: true
				});

				it("Should be interpreted as \"this\"", function () {	
					result.expressions[0].interpretation.processed.should.equal("this");
				});

				it("Should give four results", function () {	
					result.documents.length.should.equal(4);
				});

				it("First result should have id 2", function () {	
					result.documents[0].id.should.equal(2);
				});

				it("Second result should have id 0", function () {	
					result.documents[1].id.should.equal(0);
				});

				it("Third result should have id 1", function () {	
					result.documents[2].id.should.equal(1);
				});

				it("Fourth result should have id 3", function () {	
					result.documents[3].id.should.equal(3);
				});
			});
            
		});
	});

	/*describe("Persistance", function () {
		describe("Store and load index", function () {

			let thinker 	= Thinker(),
				thinker2 	= Thinker(),

				result;

			thinker.feed([
				{ id: 0, metadata: {a:2}, fields: ["This is a tile","This is a textual"] },
				{ id: 1, metadata: {a:1}, fields: ["This is a tilly","This is a sexual"] },
				{ id: 2, metadata: {a:3}, fields: ["This is a tilly","This is a usual"] },
				{ id: 3, metadata: {a:0}, fields: ["This is a tilly","This is a muse"] }
			]);

			it("should save without error", function (done) {
				thinker.index.toDisk("temp.idx", function (err) {
					done(err);
				});
			});
			it("should load without error", function (done) {
				thinker2.index.fromDisk("temp.idx", function (err) {

					if (err) return done(err);

					result = thinker2.find({
						expression: "this",
						sortBy: "a",
						direction: true
					});

					done();
				});
			});

			it("Should be interpreted as \"this\"", function () {	
				result.expressions[0].interpretation.processed.should.equal("this");
			});

			it("Should give four results", function () {	
				result.documents.length.should.equal(4);
			});

			it("First result should have id 2", function () {	
				result.documents[0].id.should.equal(2);
			});

			it("Second result should have id 0", function () {	
				result.documents[1].id.should.equal(0);
			});

			it("Third result should have id 1", function () {	
				result.documents[2].id.should.equal(1);
			});

			it("Fourth result should have id 3", function () {	
				result.documents[3].id.should.equal(3);
			});
            
		});
	});*/


	describe("Tags", function () {

		let thinker = Thinker({characters: /([a-zA-Z0-9åäöÅÄÖ]*)/g});
		let ranker = Thinker.rankers.standard( );
		let stripHtml = Thinker.processors.stripHtml();

		thinker.addFieldProcessor(stripHtml);
		thinker.ranker = ranker;

		// We need to make a copy of exampletexts, as feed consumes the object
		let exampleHtml = [
			{ id: 0, metadata: { tags: ["apa","text"], testfilterbool: true, testfilterstring: "adfa", testfilterarr: [1,4,5] }, fields: ["Detta är en text som innehåller apa"] },
			{ id: 1, metadata: { tags: ["kamel","text"], testfilterbool: false, testfilterstring: "asdf", testfilterarr: [2,5] }, fields: [ "Detta är en text som innehåller kamel"] },
			{ id: 2, metadata: { tags: ["kanel","text"], testfilterbool: false, testfilterstring: "asdf", testfilterarr: [] }, fields: [ "Detta är en text som innehåller kanel"] },
			{ id: 3, metadata: { tags: ["kanel","text"], testfilterbool: false, testfilterstring: "asd", testfilterarr: [5] }, fields: [ "Detta är en text som innehåller kanel"] },
		];

		thinker.feed(exampleHtml);

		describe("Search \"apa\", filter on testfilterbool === false, reduce on tags.indexOf(\"kanel\") === -1", function () {
			let result = thinker.find( { 
				expression: "text",
				collect: "tags",
				filter: (metadata) => !metadata.testfilterbool,
				reduce: (metadata) => metadata.tags.indexOf("kanel") === -1
			} );

			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});

		});

		describe("Search \"text\", filter on testfilterbool === true, reduce on tags.indexOf(\"kanel\") > -1", function () {
			let result = thinker.find( { 
				expression: "text",
				collect: "tags",
				filter: (metadata) => metadata.testfilterbool,
				reduce: (metadata) => metadata.tags.indexOf("kanel") > -1
			} );

			it("Should return zero result", function () {
				result.documents.length.should.equal(0);
			});

			it("Should have totalHits == 1", function () {
				result.totalHits.should.equal(1);
			});

		});

		describe("Search \"text\", filter on testfilterarr.indexOf(5), reduce on tags.indexOf(\"text\") > -1", function () {
			let result = thinker.find( { 
				expression: "text",
				collect: "tags",
				filter: (metadata) => metadata.testfilterarr.indexOf(5),
				reduce: (metadata) => metadata.tags.indexOf("text") > -1
			} );

			it("Should return three result", function () {
				result.documents.length.should.equal(3);
			});

		});

		describe("Search \"text\", filter on testfilterarr.indexOf(5), reduce on tags.indexOf(\"text\") > -1, limit to one result", function () {
            
			let result = thinker.find( { 
				expression: "text",
				collect: "tags",
				filter: (metadata) => metadata.testfilterarr.indexOf(5),
				reduce: (metadata) => metadata.tags.indexOf("text") > -1,
				limit: 1
			} );

			it("Should return one result", function () {
				result.documents.length.should.equal(1);
			});

			it("Should have totalHits == 3", function () {
				result.totalHits.should.equal(3);
			});

		});

	});

};