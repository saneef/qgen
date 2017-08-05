'use strict';

let promptForOverwrite = (() => {
	var _ref = _asyncToGenerator(function* (file) {
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
	});

	return function promptForOverwrite(_x) {
		return _ref.apply(this, arguments);
	};
})();

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

var _fileHelpers = require('./file-helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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