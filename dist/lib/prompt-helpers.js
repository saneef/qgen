'use strict';

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

var _fileHelpers = require('./file-helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function promptForOverwrite(file) {
	const answers = _inquirer2.default.prompt([{
		type: 'expand',
		message: `Do you want to overwrite the file ${file}: `,
		name: 'overwrite',
		choices: [{
			key: 'y',
			name: 'Overwrite',
			value: _constants2.default.OVERWRITE
		}, {
			key: 'a',
			name: 'Overwrite this one and all next',
			value: _constants2.default.OVERWRITE_ALL
		}, new _inquirer2.default.Separator(), {
			key: 'x',
			name: 'Abort',
			value: _constants2.default.ABORT
		}]
	}]);

	return answers.overwrite;
}

function promptIfFileExists(file) {
	let r;
	if ((0, _fileHelpers.isFileOrDir)(file) === 'file') {
		r = promptForOverwrite(file);
	} else {
		r = Promise.resolve(_constants2.default.WRITE);
	}
	return r;
}

module.exports = {
	promptForOverwrite,
	promptIfFileExists
};