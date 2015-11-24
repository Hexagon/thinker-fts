// Helper function for measuring execution time
var time = (function () {
	var times = {};

	return function (id) {
		var diff;

		if (!times[id]) {
			times[id] = process.hrtime();
			return;
		}

		diff = process.hrtime(times[id]);
		times[id] = null;

		return (diff[0] * 1e9 + diff[1]) / 1E6;
	};
}());

// Helper function for option defaults
function defaults (defaults, source) {
	var obj = {},
		key;

	if (!source) {
		return defaults;
	}

	for (key in defaults) {
		obj[key] = (source[key] !== undefined) ? source[key] : defaults[key];
	}

	for (key in source) {
		if (defaults[key] === undefined ) {
			var err = new Error('Unknown key \'' + key + '\' in options ');
			throw (err);
		}
	}

	return obj;
}

module.exports = {
	time: time,
	defaults: defaults
};