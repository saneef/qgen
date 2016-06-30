'use strict';
const fs = require('fs');
const path = require('path');

const handlebars = require('handlebars');
const mkdirp = require('mkdirp');
const globby = require('globby');
const Promise = require('pinkie-promise');

const QGenError = require('./lib/qgen-error');
const {isFileOrDir} = require('./lib/file-helpers');
const {promptIfFileExists} = require('./lib/prompt-helpers');
const {WRITE, OVERWRITE, OVERWRITE_ALL, ABORT} = require('./constants');

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

const processTemplate = (src, dest, config) => {
	const renderedContent = renderFileWithHandlebars(src, config);
	return writeToFile(dest, renderedContent);
};

const generateFilePath = (filePath, options) => {
	let renderedFilePath = filePath;
	const filenameRegex = /__([^_\W]+)__/g;

	renderedFilePath = filePath.replace(filenameRegex, (m, p) => {
		return options[p] ? options[p] : `__${p}__`;
	});

	return renderedFilePath;
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
				let overwriteAllFiles = false;
				const filesCount = files.length;

				const fileObjects = files.map(filePath => {
					const destFilePath = generateFilePath(filePath, config);
					return {
						src: path.join(config.cwd, config.directory, templateName, filePath),
						dest: path.join(config.cwd, config.dest, destFilePath)
					};
				});

				// This recursive is to make the inquirer prompt work
				// in sequential. May be there is a better way to do this.
				function recursivelyProcessFile(i) {
					let _r = Promise.resolve();
					if (i < filesCount) {
						if (overwriteAllFiles) {
							_r = processTemplate(fileObjects[i].src, fileObjects[i].dest, config).then(() => {
								return recursivelyProcessFile(i + 1);
							});
						} else {
							_r = promptIfFileExists(fileObjects[i].dest).then(overwrite => {
								if (overwrite === 'OVERWRITE_ALL') {
									overwriteAllFiles = true;
								}

								if (overwrite === 'WRITE' ||
										overwrite === 'OVERWRITE' ||
										overwriteAllFiles) {
									return processTemplate(fileObjects[i].src, fileObjects[i].dest, config).then(() => {
										return recursivelyProcessFile(i + 1);
									});
								}
							});
						}
					}
					return _r;
				}

				return recursivelyProcessFile(0);
			});
	} else if (file === 'file') {
		const srcAbsolutePath = path.join(config.cwd, templateRelPath);
		const destAbsolutePath = path.join(config.cwd, config.dest, templateName);

		returnVal = promptIfFileExists(destAbsolutePath).then(overwrite => {
			let _r;
			if (overwrite === WRITE ||
					overwrite === OVERWRITE ||
					overwrite === OVERWRITE_ALL) {
				_r = processTemplate(srcAbsolutePath, destAbsolutePath, config);
			} else {
				_r = Promise.reject(new QGenError(ABORT));
			}
			return _r;
		});

		return returnVal;
	} else {
		returnVal = Promise.reject(new QGenError(`Template '${templateRelPath}' not found.`, file.message, file));
	}

	return returnVal;
};
