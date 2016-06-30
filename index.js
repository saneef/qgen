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
				let overWriteAll = false;
				return Promise.race(files.map(filePath => {
					const destFilePath = generateFilePath(filePath, config);
					const srcAbsolutePath = path.join(config.cwd, config.directory, templateName, filePath);
					const destAbsolutePath = path.join(config.cwd, config.dest, destFilePath);

					let _r;

					if (overWriteAll) {
						_r = processTemplate(srcAbsolutePath, destAbsolutePath, config);
					} else {
						_r = promptIfFileExists(destAbsolutePath).then(overwrite => {
							if (overwrite === OVERWRITE_ALL) {
								overWriteAll = true;
							}

							let _r1;
							if (overwrite === WRITE ||
									overwrite === OVERWRITE ||
									overWriteAll) {
								_r1 = processTemplate(srcAbsolutePath, destAbsolutePath, config);
							} else {
								_r1 = Promise.reject(new QGenError(ABORT));
							}
							return _r1;
						});
					}

					return _r;
				}));
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
