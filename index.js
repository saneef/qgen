'use strict';
/**
 * @module qgen
 */
const path = require('path');

const globby = require('globby');
const Promise = require('pinkie-promise');
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

	/**
	 * Lists the available templates
	 *
	 * @return {Promise} Resolves to Array of templates if successful, else rejects with QGenError
	 */
	const templates = () => {
		if (isFileOrDir(config.directory) !== 'directory') {
			return Promise.reject(new QGenError(`qGen templates directory '${config.directory}' not found.`));
		}

		const templates = globby.sync(['*'], {
			cwd: path.join(config.cwd, config.directory)
		});

		return Promise.resolve(templates);
	};

	/**
	 * Render the template file and save to the destination path
	 *
	 * @param  {String} templateName
	 * @param  {String} destination
	 * @return {Promise} Resolves to undefined if success, else reject with QgenError
	 */
	const render = (templateName, destination) => {
		if (isFileOrDir(config.directory) !== 'directory') {
			return Promise.reject(new QGenError(`qGen templates directory '${config.directory}' not found.`));
		}

		let returnVal;

		const templateRelPath = path.join(config.directory, templateName);
		const file = isFileOrDir(path.join(config.cwd, templateRelPath));

		// Overwrite current config with template specific config
		const templateConfig = createTemplateConfig(config, templateName, DEFAULT_DESTINATION);

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
				const destFilePath = renderPath(filePath, config);

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
