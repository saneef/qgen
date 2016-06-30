'use strict';
const inquirer = require('inquirer');
const Promise = require('pinkie-promise');

const {WRITE, OVERWRITE, OVERWRITE_ALL, ABORT} = require('../constants');

const {isFileOrDir} = require('./file-helpers');

function promptForOverwrite(file) {
	return inquirer.prompt([
		{
			type: 'expand',
			message: `Do you want to overwrite the file ${file}: `,
			name: 'overwrite',
			choices: [
				{
					key: 'y',
					name: 'Overwrite',
					value: OVERWRITE
				},
				{
					key: 'a',
					name: 'Overwrite this one and all next',
					value: OVERWRITE_ALL
				},
				new inquirer.Separator(),
				{
					key: 'x',
					name: 'Abort',
					value: ABORT
				}
			]
		}
	]).then(answers => answers.overwrite);
}

function promptIfFileExists(file) {
	let r;
	if (isFileOrDir(file) === 'file') {
		r = promptForOverwrite(file);
	} else {
		r = Promise.resolve(WRITE);
	}
	return r;
}

module.exports = {
	promptForOverwrite,
	promptIfFileExists
};
