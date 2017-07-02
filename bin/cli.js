#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const minimist = require('minimist');
const redent = require('redent');
const trimNewlines = require('trim-newlines');

const qgen = require('../');

/**
 * Displays prewritten help message to stdout
 *
 * @return {undefined}
 */
const showHelp = () => {
	const helpText = `
		${chalk.bold('Usage')}
			$ qgen <template name> [dest] [arguments] [options]

		${chalk.bold('Options')}
		--directory=<dir>	Templates directory # Default: ./gqen-templates
		--config=<path>	Path to the JSON config file # Default: ./qgen.json

		${chalk.bold('Examples')}
			$ qgen post ${chalk.dim('# generates the post template in the current folder')}
			$ qgen post ./pages ${chalk.dim('# generates the post template inside ./pages')}
			$ qgen post ./pages --page-title "Hello World" ${chalk.dim('# generates the post template in inside ./pages with data field pageTitle="Hello World" to the template rendering engine')}
	`;

	const help = redent(trimNewlines(helpText).replace(/\t+\n*$/, ''), 2);

	console.log(help);
};

/**
 * Displays list of available templates to stdout
 *
 * @param  {Object} options - options for qgen
 * @return {undefined}
 */
const listTemplates = options => {
	const templates = qgen(options).templates();
	if (Array.isArray(templates) && templates.length > 0) {
		console.log(redent(`	${chalk.bold('Available Templates')}`, 2));
		templates.forEach(template => {
			console.log(redent(`${template}`, 4));
		});
	}
};

const argv = minimist(process.argv.slice(2));

// Display help and available templates help flag is set or no arguments passed
if (argv.help || argv._.length === 0) {
	showHelp();
	listTemplates(argv);
} else {
	try {
		qgen(argv).render(argv._[0], argv._[1]);
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
}
