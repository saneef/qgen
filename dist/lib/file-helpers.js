'use strict';

const fs = require('fs');
const path = require('path');
const isRelative = require('is-relative');

/**
 * Check if a path points to a file or a directory
 * @param  {String} filePath - Path to a file or directory
 * @return {String} 'directory' if paths points a directory, 'file' if path points to a file
 */
function isFileOrDir(filePath) {
	let fsStat;
	try {
		fsStat = fs.statSync(filePath);
	} catch (error) {
		return error;
	}

	let r = 'file';
	if (fsStat.isDirectory()) {
		r = 'directory';
	}

	return r;
}

function getRelativePath(filePath, root = process.cwd()) {
	if (isRelative(filePath)) {
		return filePath;
	}

	return `.${path.sep}${path.relative(root, filePath)}`;
}

module.exports = {
	isFileOrDir,
	getRelativePath
};