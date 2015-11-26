var 
	Benchmark = require('benchmark'),
	Thinker = require('../'),
	suite = new Benchmark.Suite,
	englishStemmer = Thinker.processors.stemmers.english();

suite.add('English stemmer', function() {
  var result = englishStemmer('convolution');
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.run();
