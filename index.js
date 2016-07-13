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

const DEFAULT_DESTINATION = './';

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

const generateTemplateConfig = (config, templateName) => {
	let templateConfig = config;

	if (config.templates && config.templates[templateName]) {
		const overrides = {
			templates: undefined
		};

		if (config.templates &&
				config.templates[templateName] &&
				config.templates[templateName].dest) {
			overrides.dest = config.templates[templateName].dest;
		}

		if (config.dest !== DEFAULT_DESTINATION) {
			overrides.dest = config.dest;
		}

		templateConfig = Object.assign({}, config.templates[templateName], config, overrides);
	}

	return templateConfig;
};

module.exports = (templateName, destination, options) => {
	const defaultOptions = {
		dest: destination || DEFAULT_DESTINATION,
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
					const templateConfig = generateTemplateConfig(config, templateName);

					return {
						src: path.join(templateConfig.cwd, templateConfig.directory, templateName, filePath),
						dest: path.join(templateConfig.cwd, templateConfig.dest, destFilePath),
						config: templateConfig
					};
				});

				// This recursive is to make the inquirer prompt work
				// in sequential. May be there is a better way to do this.
				function recursivelyProcessFile(i) {
					let _r = Promise.resolve();
					if (i < filesCount) {
						if (overwriteAllFiles) {
							_r = processTemplate(fileObjects[i].src, fileObjects[i].dest, fileObjects[i].config).then(() => {
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
									return processTemplate(fileObjects[i].src, fileObjects[i].dest, fileObjects[i].config).then(() => {
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
		const templateConfig = generateTemplateConfig(config, templateName);
		const srcAbsolutePath = path.join(templateConfig.cwd, templateRelPath);
		const destAbsolutePath = path.join(templateConfig.cwd, templateConfig.dest, templateName);

		returnVal = promptIfFileExists(destAbsolutePath).then(overwrite => {
			let _r;
			if (overwrite === constants.WRITE ||
					overwrite === constants.OVERWRITE ||
					overwrite === constants.OVERWRITE_ALL) {
				_r = processTemplate(srcAbsolutePath, destAbsolutePath, templateConfig);
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
