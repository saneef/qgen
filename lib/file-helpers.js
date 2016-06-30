'use strict';
const fs = require('fs');

function isFileOrDir(filePath) {
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
}

module.exports = {
	isFileOrDir
};
