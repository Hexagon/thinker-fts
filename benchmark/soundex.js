var 
	Benchmark = require("benchmark"),
	Thinker = require("../"),
	suite = new Benchmark.Suite,
	soundex = Thinker.processors.soundex();

suite.add("Soundex", function() {
  var result = soundex("convolution");
})
.on("cycle", function(event) {
  console.log(String(event.target));
})
.run();
