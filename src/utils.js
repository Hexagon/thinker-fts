// Helper function for measuring execution time
let time = (function () {
	let times = {};

	return function (id) {
		let diff;

		if (!times[id]) {
			times[id] = performance.now();
			return;
		}

		diff = performance.now() - times[id];
		times[id] = undefined;

		return diff;
	};
}());

// Helper function for option defaults
function defaults (defaults, source) {
	let obj,
		key;

	if (source) {

		obj = {};

		for (key in defaults) {
			if (Object.prototype.hasOwnProperty.call(defaults, key)) {
				obj[key] = (source[key] !== void 0) ? source[key] : defaults[key];
			}
		}

		for (key in source) {
			if (Object.prototype.hasOwnProperty.call(source, key)) {
				if (defaults[key] === void 0 ) {
					let err = new Error("Unknown key '" + key + "' in options ");
					throw (err);
				}
			}
		}

	} else {

		obj = defaults;

	}

	return obj;

}

export { time, defaults };