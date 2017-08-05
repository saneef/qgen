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

/**
 * @param  {String} pathTemplate - Template for the path of a file. eg: __SOME__.md, where __SOME__ will be replaced by the value of 'SOME' from the context
 * @param  {Object} context - Data to render the path template
 * @return {String} rendered path
 */
const renderPath = (pathTemplate, context) => {
	let renderedFilePath = pathTemplate;
	const filenameRegex = /__([^_\W]+)__/g;

	renderedFilePath = pathTemplate.replace(filenameRegex, (m, p) => {
		return context[p] ? context[p] : `__${p}__`;
	});

	return renderedFilePath;
};

module.exports = {
	isFileOrDir,
	renderPath
};