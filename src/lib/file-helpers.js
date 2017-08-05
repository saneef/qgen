'use strict';

const fs = require('fs');

/**
 * Check if a path points to a file or a directory
 * @param  {String} filePath - Path to a file or directory
 * @return {String} 'directory' if paths points a directory, 'file' if path points to a file
 */
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
