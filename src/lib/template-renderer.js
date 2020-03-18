const path = require('path');
const Handlebars = require('handlebars');

const templateRenderer = function (spec = {}) {
	let {
		helpers,
		cwd
	} = spec;

	const handlebars = Handlebars;

	if (helpers) {
		if (!path.isAbsolute(helpers)) {
			helpers = path.join(cwd, helpers);
		}

		handlebars.registerHelper(require(helpers));
	}

	const render = (string, context) => {
		const compiledTemplate = handlebars.compile(string);
		return compiledTemplate(context);
	};

	return Object.freeze({
		render
	});
};

module.exports = templateRenderer;
