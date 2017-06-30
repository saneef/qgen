'use strict';
const path = require('path');

const globby = require('globby');
const Promise = require('pinkie-promise');

const QGenError = require('./lib/qgen-error');
const templateRenderer = require('./lib/template-renderer');
const isFileOrDir = require('./lib/file-helpers').isFileOrDir;
const promptIfFileExists = require('./lib/prompt-helpers').promptIfFileExists;
const constants = require('./constants');

const DEFAULT_DESTINATION = './';

function qgen(options) {
	const defaultOptions = {
		dest: DEFAULT_DESTINATION,
		cwd: process.cwd(),
		directory: 'qgen-templates',
		config: './qgen.json'
	};

	let configfilePath = path.join(defaultOptions.cwd, defaultOptions.config);
	if (options.config) {
		configfilePath = options.config;
	}

	let configfileOptions = {};
	// Read the configfile if exists
	if (isFileOrDir(configfilePath) === 'file') {
		configfileOptions = require(configfilePath); // eslint-disable-line import/no-dynamic-require
	}

	const config = Object.assign(defaultOptions, configfileOptions, options);

	const generateDestFilePath = (filePath, options) => {
		let renderedFilePath = filePath;
		const filenameRegex = /__([^_\W]+)__/g;

		renderedFilePath = filePath.replace(filenameRegex, (m, p) => {
			return options[p] ? options[p] : `__${p}__`;
		});

		return renderedFilePath;
	};

	const generateTemplateConfig = (config, templateName) => {
		let templateConfig = config;

		// Process the additional config specific
		// to the given template
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

	// This recursive function is to make the inquirer prompt work
	// in sequential. May be, there is a better way to do this.
	const processFilesRecursively = (i, fileObjects, overwriteAll) => {
		let _r = Promise.resolve();

		if (i < fileObjects.length) {
			const processFile = () => {
				if (templateRenderer(fileObjects[i].src, fileObjects[i].config).save(fileObjects[i].dest)) {
					return processFilesRecursively(i + 1, fileObjects, overwriteAll);
				}
				return Promise.reject(new QGenError(`Error rendering template.`));
			};

			if (overwriteAll) {
				_r = processFile();
			} else {
				_r = promptIfFileExists(fileObjects[i].dest).then(overwrite => {
					if (overwrite === constants.OVERWRITE_ALL) {
						overwriteAll = true;
					}

					if (overwrite === constants.WRITE ||
							overwrite === constants.OVERWRITE ||
							overwriteAll) {
						return processFile();
					}
				});
			}
		}
		return _r;
	};

	const templates = () => {
		if (isFileOrDir(config.directory) !== 'directory') {
			return Promise.reject(new QGenError(`qGen templates directory '${config.directory}' not found.`));
		}

		const templates = globby.sync(['*'], {
			cwd: path.join(config.cwd, config.directory)
		});

		return Promise.resolve(templates);
	};

	const render = (templateName, destination) => {
		if (isFileOrDir(config.directory) !== 'directory') {
			return Promise.reject(new QGenError(`qGen templates directory '${config.directory}' not found.`));
		}

		let returnVal;

		const templateRelPath = path.join(config.directory, templateName);
		const file = isFileOrDir(path.join(config.cwd, templateRelPath));

		// Overwrite current config with template specific config
		const templateConfig = generateTemplateConfig(config, templateName);

		// Override dest with dest from CLI
		if (destination) {
			templateConfig.dest = destination;
		}

		if (file === 'directory') {
			const files = globby.sync(['**/*'], {
				cwd: path.join(config.cwd, templateRelPath),
				nodir: true
			});

			const fileObjects = files.map(filePath => {
				const destFilePath = generateDestFilePath(filePath, config);

				return {
					src: path.join(templateConfig.cwd, templateConfig.directory, templateName, filePath),
					dest: path.join(templateConfig.cwd, templateConfig.dest, destFilePath),
					config: templateConfig
				};
			});

			returnVal = processFilesRecursively(0, fileObjects, false);
		} else if (file === 'file') {
			const srcAbsolutePath = path.join(templateConfig.cwd, templateRelPath);
			const destAbsolutePath = path.join(templateConfig.cwd, templateConfig.dest, templateName);

			returnVal = promptIfFileExists(destAbsolutePath).then(overwrite => {
				let _r;
				if (overwrite === constants.WRITE ||
						overwrite === constants.OVERWRITE ||
						overwrite === constants.OVERWRITE_ALL) {
					templateRenderer(srcAbsolutePath, templateConfig).save(destAbsolutePath);
					_r = Promise.resolve();
				} else {
					_r = Promise.reject(new QGenError(constants.ABORT));
				}
				return _r;
			});
		} else {
			returnVal = Promise.reject(new QGenError(`Template '${templateRelPath}' not found.`, file.message, file));
		}

		return returnVal;
	};

	return Object.freeze({
		templates,
		render
	});
}

module.exports = qgen;
