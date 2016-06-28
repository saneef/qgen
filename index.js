'use strict';
const fs = require('fs');
const path = require('path');
const util = require('util');
const handlebars = require('handlebars');
const mkdirp = require('mkdirp');
const globby = require('globby');
const NestedError = require('nested-error-stacks');
const Promise = require('pinkie-promise');

function QGenError(message, nested) {
	NestedError.call(this, message, nested);
	Object.assign(this, nested, {message});
}

util.inherits(QGenError, NestedError);
QGenError.prototype.name = 'QGenError';

const isFileOrDir = filePath => {
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

const renderFileWithHandlebars = (src, context) => {
	// encoding is pass as 'utf8' to get the return value as string
	const fileContents = fs.readFileSync(src, 'utf8');

	const hbsTemplate = handlebars.compile(fileContents);

	return hbsTemplate(context);
};

const writeToFile = (filePath, content) => {
	if (isFileOrDir(path.dirname(filePath)) !== 'directory') {
		mkdirp.sync(path.dirname(filePath));
	}
	fs.writeFileSync(filePath, content);
	return Promise.resolve();
};

const renderAndWrite = (src, dest, config) => {
	const renderedContent = renderFileWithHandlebars(src, config);
	return writeToFile(dest, renderedContent);
};

module.exports = (templateName, destination, options) => {
	const defaultOptions = {
		dest: destination || './',
		cwd: process.cwd(),
		directory: 'qgen-templates'
	};

	const config = Object.assign(defaultOptions, options);

	const templateRelPath = path.join(config.directory, templateName);

	let returnVal;
	const file = isFileOrDir(path.join(config.cwd, templateRelPath));
	if (file === 'directory') {
		returnVal = globby(['**/*'], {
			cwd: path.join(config.cwd, templateRelPath),
			nodir: true
		})
			.then(files => {
				files.map(filePath => {
					return renderAndWrite(path.join(config.cwd, config.directory, templateName, filePath), path.join(config.cwd, config.dest, filePath), config);
				});
			});
	} else if (file === 'file') {
		returnVal = renderAndWrite(path.join(config.cwd, templateRelPath), path.join(config.cwd, config.dest, templateName), config);
	} else {
		returnVal = Promise.reject(new QGenError(`Template '${templateRelPath}' not found.`, file.message, file));
	}

	return returnVal;
};
