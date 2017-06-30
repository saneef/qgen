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

const renderTemplate = (src, context) => {
	// Encoding is set as 'utf8' to get the return value as string
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

const renderToFile = (src, dest, config) => {
	const renderedContent = renderTemplate(src, config);
	return writeToFile(dest, renderedContent);
};

const generateFilePathFromConfig = (filePath, options) => {
	let renderedFilePath = filePath;
	const filenameRegex = /__([^_\W]+)__/g;

	renderedFilePath = filePath.replace(filenameRegex, (m, p) => {
		return options[p] ? options[p] : `__${p}__`;
	});

	return renderedFilePath;
};

const getTemplateConfig = (config, templateName) => {
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

// This recursive is to make the inquirer prompt work
// in sequential. May be there is a better way to do this.
function processFilesRecursively(i, fileObjects, overwriteAll) {
	let _r = Promise.resolve();
	if (i < fileObjects.length) {
		if (overwriteAll) {
			_r = renderToFile(fileObjects[i].src, fileObjects[i].dest, fileObjects[i].config).then(() => {
				return processFilesRecursively(i + 1, fileObjects, overwriteAll);
			});
		} else {
			_r = promptIfFileExists(fileObjects[i].dest).then(overwrite => {
				if (overwrite === constants.OVERWRITE_ALL) {
					overwriteAll = true;
				}

				if (overwrite === constants.WRITE ||
						overwrite === constants.OVERWRITE ||
						overwriteAll) {
					return renderToFile(fileObjects[i].src, fileObjects[i].dest, fileObjects[i].config).then(() => {
						return processFilesRecursively(i + 1, fileObjects, overwriteAll);
					});
				}
			});
		}
	}
	return _r;
}

module.exports = (templateName, destination, options) => {
	const defaultOptions = {
		dest: DEFAULT_DESTINATION,
		cwd: process.cwd(),
		directory: 'qgen-templates',
		config: './qgen.json'
	};

	let configfileOptions = {};
	let configfilePath = path.join(defaultOptions.cwd, defaultOptions.config);
	if (options.config) {
		configfilePath = options.config;
	}
	// Read the configfile if exists
	if (isFileOrDir(configfilePath) === 'file') {
		configfileOptions = require(configfilePath); // eslint-disable-line import/no-dynamic-require
	}

	const config = Object.assign(defaultOptions, configfileOptions, options);

	if (isFileOrDir(config.directory) !== 'directory') {
		return Promise.reject(new QGenError(`qGen templates directory '${config.directory}' not found.`));
	}

	let returnVal;
	const templateRelPath = path.join(config.directory, templateName);

	const file = isFileOrDir(path.join(config.cwd, templateRelPath));

	// Overwrite current config with template specific config
	const templateConfig = getTemplateConfig(config, templateName);

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
			const destFilePath = generateFilePathFromConfig(filePath, config);

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
				_r = renderToFile(srcAbsolutePath, destAbsolutePath, templateConfig);
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
