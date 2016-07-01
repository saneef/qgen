'use strict';
const fs = require('fs');
const path = require('path');

const handlebars = require('handlebars');
const mkdirp = require('mkdirp');
const globby = require('globby');
const Promise = require('pinkie-promise');

const QGenError = require('./lib/qgen-error');
const isFileOrDir = require('./lib/file-helpers').isFileOrDir;
const promptIfFileExists = require('./lib/prompt-helpers').promptIfFileExists;
const constants = require('./constants');

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

const processTemplate = (name, src, dest, config) => {
	let localConfig = Object.assign({}, config);

	if (config.templates && config.templates[name]) {
		localConfig = Object.assign({}, config.templates[name], config, {templates: undefined});
	}

	const renderedContent = renderFileWithHandlebars(src, localConfig);
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
		directory: 'qgen-templates',
		config: './qgen.json'
	};

	let fileOptions = {};
	let configfilePath = path.join(defaultOptions.cwd, defaultOptions.config);
	if (options.config) {
		configfilePath = options.config;
	}
	// Read the configfile if exists
	if (isFileOrDir(configfilePath) === 'file') {
		fileOptions = require(configfilePath);
	}

	const config = Object.assign(defaultOptions, fileOptions, options);

	if (isFileOrDir(config.directory) !== 'directory') {
		return Promise.reject(new QGenError(`qGen templates directory '${config.directory}' not found.`));
	}

	let returnVal;
	const templateRelPath = path.join(config.directory, templateName);

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
						templateName,
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
							_r = processTemplate(fileObjects[i].templateName, fileObjects[i].src, fileObjects[i].dest, config).then(() => {
								return recursivelyProcessFile(i + 1);
							});
						} else {
							_r = promptIfFileExists(fileObjects[i].dest).then(overwrite => {
								if (overwrite === constants.OVERWRITE_ALL) {
									overwriteAllFiles = true;
								}

								if (overwrite === constants.WRITE ||
										overwrite === constants.OVERWRITE ||
										overwriteAllFiles) {
									return processTemplate(fileObjects[i].templateName, fileObjects[i].src, fileObjects[i].dest, config).then(() => {
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
			if (overwrite === constants.WRITE ||
					overwrite === constants.OVERWRITE ||
					overwrite === constants.OVERWRITE_ALL) {
				_r = processTemplate(templateName, srcAbsolutePath, destAbsolutePath, config);
			} else {
				_r = Promise.reject(new QGenError(constants.ABORT));
			}
			return _r;
		});

		return returnVal;
	} else {
		returnVal = Promise.reject(new QGenError(`Template '${templateRelPath}' not found.`, file.message, file));
	}

	return returnVal;
};
