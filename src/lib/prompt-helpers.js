'use strict';
import inquirer from 'inquirer';

import constants from '../constants';
import {isFileOrDir} from './file-helpers';

export function promptForOverwrite(file) {
	const answers = inquirer.prompt([{
		type: 'expand',
		message: `Do you want to overwrite the file ${file}: `,
		name: 'overwrite',
		choices: [
			{
				key: 'y',
				name: 'Overwrite',
				value: constants.OVERWRITE
			},
			{
				key: 'a',
				name: 'Overwrite this one and all next',
				value: constants.OVERWRITE_ALL
			},
			{
				key: 's',
				name: 'Skip',
				value: constants.SKIP
			},
			new inquirer.Separator(),
			{
				key: 'x',
				name: 'Abort',
				value: constants.ABORT
			}
		]
	}]);

	return answers;
}

export function promptIfFileExists(file) {
	let r;
	if (isFileOrDir(file) === 'file') {
		r = promptForOverwrite(file);
	} else {
		r = Promise.resolve({
			overwrite: constants.WRITE
		});
	}

	return r;
}
