#!/usr/bin/env node
'use strict';

const chalk = require('chalk');
const minimist = require('minimist');
const redent = require('redent');
const trimNewlines = require('trim-newlines');

const qgen = require('../');
const constants = require('../constants');

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

const listTemplates = options => {
	qgen(options)
		.templates()
		.then(templates => {
			if (templates.length > 0) {
				console.log(redent(`	${chalk.bold('Available Templates')}`, 2));
				templates.forEach(template => {
					console.log(redent(`${template}`, 4));
				});
			}
		})
		.catch(err => {
			console.error(err.message);
			process.exit(2);
		});
};

const argv = minimist(process.argv.slice(2));

if (argv.help || argv._.length === 0) {
	showHelp();
	listTemplates(argv);
} else {
	qgen(argv)
		.render(argv._[0], argv._[1])
		.catch(err => {
			if (err.message === constants.ABORT) {
				process.exit(0);
			} else {
				console.error(err.message);
				process.exit(1);
			}
		});
}
