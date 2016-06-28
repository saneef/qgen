#!/usr/bin/env node
'use strict';

const meow = require('meow');
const chalk = require('chalk');

const qgen = require('../');

const cli = meow(`
	${chalk.bold('Usage')}
		$ qgen <template name> [dest] [arguments]

	${chalk.bold('Examples')}
		$ qgen blog-post ${chalk.dim('# generates the blog-post template in the current folder')}
		$ qgen blog-post ./pages ${chalk.dim('# generates the blog-post template inside ./pages')}
		$ qgen blog-post ./pages --page-title "Hello World" ${chalk.dim('# generates the blog-post template in inside ./pages with data field pageTitle="Hello World" to the template rendering engine')}
`);

// cli.flags
if (cli.input.length === 0) {
	cli.showHelp();
} else {
	qgen(cli.input[0], cli.input[1], cli.flags)
		.catch(error => {
			console.error(error.message);
			process.exit(1);
		});
}
