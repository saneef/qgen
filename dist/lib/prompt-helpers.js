'use strict';

const inquirer = require('inquirer');
const Promise = require('pinkie-promise');

const constants = require('../constants');

const isFileOrDir = require('./file-helpers').isFileOrDir;

function promptForOverwrite(file) {
	return inquirer.prompt([{
		type: 'expand',
		message: `Do you want to overwrite the file ${file}: `,
		name: 'overwrite',
		choices: [{
			key: 'y',
			name: 'Overwrite',
			value: constants.OVERWRITE
		}, {
			key: 'a',
			name: 'Overwrite this one and all next',
			value: constants.OVERWRITE_ALL
		}, new inquirer.Separator(), {
			key: 'x',
			name: 'Abort',
			value: constants.ABORT
		}]
	}]).then(answers => answers.overwrite);
}

function promptIfFileExists(file) {
	let r;
	if (isFileOrDir(file) === 'file') {
		r = promptForOverwrite(file);
	} else {
		r = Promise.resolve(constants.WRITE);
	}
	return r;
}

module.exports = {
	promptForOverwrite,
	promptIfFileExists
};