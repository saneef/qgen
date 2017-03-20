#!/usr/bin/env node
'use strict';

const meow = require('meow');
const chalk = require('chalk');

const qgen = require('../');

const constants = require('../constants');

const cli = meow(`
	${chalk.bold('Usage')}
		$ qgen <template name> [dest] [arguments] [options]

	${chalk.bold('Options')}
	--directory=<dir>	Templates directory # Default: ./gqen-templates
	--config=<path>	Path to the JSON config file # Default: ./qgen.json

	${chalk.bold('Examples')}
		$ qgen post ${chalk.dim('# generates the post template in the current folder')}
		$ qgen post ./pages ${chalk.dim('# generates the post template inside ./pages')}
		$ qgen post ./pages --page-title "Hello World" ${chalk.dim('# generates the post template in inside ./pages with data field pageTitle="Hello World" to the template rendering engine')}
`);

if (cli.input.length === 0) {
	cli.showHelp();
} else {
	qgen(cli.input[0], cli.input[1], cli.flags)
		.catch(err => {
			if (err.message === constants.ABORT) {
				process.exit(0);
			} else {
				console.error(err.message);
				process.exit(1);
			}
		});
}
