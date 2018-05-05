'use strict';

const util = require('util');
const NestedError = require('nested-error-stacks');

function QGenError(message, nested) {
	// eslint-disable-next-line prefer-reflect
	NestedError.call(this, message, nested);
	Object.assign(this, nested, { message });
}

util.inherits(QGenError, NestedError);
QGenError.prototype.name = 'QGenError';

module.exports = QGenError;