'use strict';
/**
 * @module qgen
 */
const path = require('path');

const globby = require('globby');
const QGenError = require('./lib/qgen-error');

const templateFileRenderer = require('./lib/template-file-renderer');
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
		config: './qgen.json',
		helpers: undefined
	};

	const configfilePath = createConfigFilePath(defaultOptions, options);
	const configfileOptions = loadConfig(configfilePath);
	const config = Object.assign(defaultOptions, configfileOptions, options);

	/** Throw error if qgen template directory is missing */
	if (isFileOrDir(config.directory) !== 'directory') {
		throw new QGenError(`qgen templates directory '${config.directory}' not found.`);
	}

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
	 * @param  {String} template
	 * @param  {String} destination
	 */
	const render = async (template, destination) => {
		const templatePath = path.join(config.directory, template);
		const templateType = isFileOrDir(path.join(config.cwd, templatePath));
		const templateConfig = createTemplateConfig(config, template, DEFAULT_DESTINATION);

		// Override config dest with passed destination
		if (destination) {
			templateConfig.dest = destination;
		}

		let fileObjects;

		if (templateType === 'directory') {
			const files = globby.sync(['**/*'], {
				cwd: path.join(config.cwd, templatePath),
				nodir: true
			});

			fileObjects = files.map(filePath => {
				return {
					src: path.join(templatePath, filePath),
					dest: path.join(templateConfig.cwd, templateConfig.dest, renderPath(filePath, config))
				};
			});
		} else if (templateType === 'file') {
			fileObjects = [{
				src: templatePath,
				dest: path.join(templateConfig.cwd, templateConfig.dest, template)
			}];
		} else {
			throw new QGenError(`Template '${templatePath}' not found.`);
		}

		let abort = false;
		let overwriteAll = false;
		for (let i = 0; i < fileObjects.length && !abort; i++) {
			if (!overwriteAll) {
				// eslint-disable-next-line no-await-in-loop
				const answer = await promptIfFileExists(fileObjects[i].dest);

				if (answer === constants.OVERWRITE_ALL) {
					overwriteAll = true;
				} else if (answer === constants.ABORT) {
					abort = true;
				}
			}

			if (!abort) {
				templateFileRenderer(fileObjects[i].src, templateConfig).save(fileObjects[i].dest);
			}
		}
	};

	return Object.freeze({
		templates,
		render
	});
}

module.exports = qgen;
