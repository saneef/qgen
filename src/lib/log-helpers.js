'use strict';

const chalk = require('chalk');
const redent = require('redent');
const {getRelativePath} = require('./file-helpers');

/**
 * Logs a file path into the console
 * @param  {String} path - Path to the file
 * @param  {String} prefix - Prefix text
 * @return {undefined}
 */
const prettyPrintFilePath = (path, prefix = '') => {
	const relativePath = getRelativePath(path);

	console.log(`${prefix}${chalk.blue.bold(relativePath)}`);
	console.log(redent('	', 0));
};

/**
 * Logs contents into the console
 * @param  {String} contents - Contents of the file
 * @return {undefined}
 */
const prettyPrintContents = contents => {
	console.log(redent(contents, 2));
	console.log(redent('	', 0));
};

module.exports = {
	prettyPrintFilePath,
	prettyPrintContents
};
