'use strict';
const fs = require('fs');

const e = module.exports = {};

e.isFileOrDir = filePath => {
	let fsStat;
	try {
		fsStat = fs.statSync(filePath);
	} catch (err) {
		return err;
	}

	let r = 'file';
	if (fsStat.isDirectory()) {
		r = 'directory';
	}

	return r;
};
