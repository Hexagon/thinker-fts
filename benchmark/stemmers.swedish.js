var 
	Benchmark = require("benchmark"),
	Thinker = require("../"),
	suite = new Benchmark.Suite,
	swedishStemmer = Thinker.processors.stemmers.swedish();

suite.add("Swedish stemmer", function() {
  var result = swedishStemmer("friserandets");
})
.on("cycle", function(event) {
  console.log(String(event.target));
})
.run();
