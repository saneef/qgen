'use strict';

const chalk = require('chalk');
const redent = require('redent');

/**
 * Logs a file into the console
 * @param  {String} path - Path to the file
 * @param  {String} contents - Contents of the file
 * @return {undefined}
 */
const prettyPrintFile = (path, contents) => {
  console.log(redent(`	${chalk.blue.bold(path)}`, 0));
  console.log(redent('	', 0));
  console.log(redent(contents, 2));
  console.log(redent('	', 0));
};

module.exports = {
  prettyPrintFile
};