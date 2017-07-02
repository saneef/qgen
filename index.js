'use strict';
/**
 * @module qgen
 */
const path = require('path');

const globby = require('globby');
const QGenError = require('./lib/qgen-error');

const templateRenderer = require('./lib/template-renderer');
const {isFileOrDir, renderPath} = require('./lib/file-helpers');
const promptIfFileExists = require('./lib/prompt-helpers').promptIfFileExists;
const {
	createConfigFilePath,
	loadConfig,
	createTemplateConfig
} = require('./lib/config-helpers');
const constants = require('./constants');

const DEFAULT_DESTINATION = './';

/**
 * Creates new qgen object
 * @name  qgen
 * @param {Object} options - Options such as dest, config file path etc.
 * @return {qgen}
 */
function qgen(options) {
	const defaultOptions = {
		dest: DEFAULT_DESTINATION,
		cwd: process.cwd(),
		directory: 'qgen-templates',
		config: './qgen.json'
	};

	const configfilePath = createConfigFilePath(defaultOptions, options);
	const configfileOptions = loadConfig(configfilePath);
	const config = Object.assign(defaultOptions, configfileOptions, options);

	// This recursive function is to make the inquirer prompt work
	// in sequential. May be, there is a better way to do this.
	const processFilesRecursively = (i, fileObjects, overwriteAll) => {
		if (i < fileObjects.length) {
			const processFile = () => {
				if (templateRenderer(fileObjects[i].src, fileObjects[i].config).save(fileObjects[i].dest)) {
					return processFilesRecursively(i + 1, fileObjects, overwriteAll);
				}
				throw new QGenError(`Error rendering template.`);
			};

			if (overwriteAll) {
				processFile();
			} else {
				promptIfFileExists(fileObjects[i].dest).then(overwrite => {
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
	};

	/**
	 * Lists the available template names
	 *
	 * @return {Array} available template names
	 */
	const templates = () => {
		return globby.sync(['*'], {
			cwd: path.join(config.cwd, config.directory)
		});
	};

	/**
	 * Render the template file and save to the destination path
	 *
	 * @param  {String} templateName
	 * @param  {String} destination
	 */
	const render = (templateName, destination) => {
		const templateRelPath = path.join(config.directory, templateName);
		const file = isFileOrDir(path.join(config.cwd, templateRelPath));
		const templateConfig = createTemplateConfig(config, templateName, DEFAULT_DESTINATION);

		// Override config dest with passed destination
		if (destination) {
			templateConfig.dest = destination;
		}

		if (file === 'directory') {
			const files = globby.sync(['**/*'], {
				cwd: path.join(config.cwd, templateRelPath),
				nodir: true
			});

			const fileObjects = files.map(filePath => {
				const destFilePath = renderPath(filePath, config);

				return {
					src: path.join(templateConfig.cwd, templateConfig.directory, templateName, filePath),
					dest: path.join(templateConfig.cwd, templateConfig.dest, destFilePath),
					config: templateConfig
				};
			});

			processFilesRecursively(0, fileObjects, false);
		} else if (file === 'file') {
			const srcAbsolutePath = path.join(templateConfig.cwd, templateRelPath);
			const destAbsolutePath = path.join(templateConfig.cwd, templateConfig.dest, templateName);

			promptIfFileExists(destAbsolutePath)
				.then(overwrite => {
					if (overwrite === constants.WRITE ||
							overwrite === constants.OVERWRITE ||
							overwrite === constants.OVERWRITE_ALL) {
						templateRenderer(srcAbsolutePath, templateConfig).save(destAbsolutePath);
					}
				});
		} else {
			throw new QGenError(`Template '${templateRelPath}' not found.`, file.message, file);
		}
	};

	if (isFileOrDir(config.directory) !== 'directory') {
		throw new QGenError(`qGen templates directory '${config.directory}' not found.`);
	}

	return Object.freeze({
		templates,
		render
	});
}

module.exports = qgen;
