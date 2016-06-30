'use strict';
const util = require('util');
const NestedError = require('nested-error-stacks');

function QGenError(message, nested) {
	NestedError.call(this, message, nested);
	Object.assign(this, nested, {message});
}

util.inherits(QGenError, NestedError);
QGenError.prototype.name = 'QGenError';

module.export = QGenError;
