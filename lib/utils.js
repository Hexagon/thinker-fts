"use strict";

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
		times[id] = undefined;

		return (diff[0] * 1e9 + diff[1]) / 1E6;
	};
}());

// Helper function for option defaults
function defaults (defaults, source) {
	var obj,
		key;

	if (source) {

		obj = {};

		for (key in defaults) {
			obj[key] = (source[key] !== void 0) ? source[key] : defaults[key];
		}

		for (key in source) {
			if (defaults[key] === void 0 ) {
				var err = new Error("Unknown key '" + key + "' in options ");
				throw (err);
			}
		}

	} else {

		obj = defaults;

	}

	return obj;

}

module.exports = {
	time: time,
	defaults: defaults
};