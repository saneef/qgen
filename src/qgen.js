'use strict';
/**
 * @module qgen
 */
const path = require('path');

const globby = require('globby');
const QGenError = require('../lib/qgen-error');

const templateRenderer = require('../lib/template-renderer');
const {isFileOrDir, renderPath} = require('../lib/file-helpers');
const promptIfFileExists = require('../lib/prompt-helpers').promptIfFileExists;
const {
	createConfigFilePath,
	loadConfig,
	createTemplateConfig
} = require('../lib/config-helpers');
const constants = require('../constants');

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
		const templateRelPath = path.join(config.directory, template);
		const file = isFileOrDir(path.join(config.cwd, templateRelPath));
		const templateConfig = createTemplateConfig(config, template, DEFAULT_DESTINATION);

		// Override config dest with passed destination
		if (destination) {
			templateConfig.dest = destination;
		}

		if (file === 'directory') {
			const files = globby.sync(['**/*'], {
				cwd: path.join(config.cwd, templateRelPath),
				nodir: true
			});

			let abort = false;
			let overwriteAll = false;
			for (let i = 0; i < files.length && !abort; i++) {
				const src = path.join(templateConfig.cwd, templateConfig.directory, template, files[i]);
				const dest = path.join(templateConfig.cwd, templateConfig.dest, renderPath(files[i], config));
				if (!overwriteAll) {
					// eslint-disable-next-line no-await-in-loop
					const answer = await promptIfFileExists(dest);
					if (answer === constants.OVERWRITE_ALL) {
						overwriteAll = true;
					} else if (answer === constants.ABORT) {
						abort = true;
					}
				}

				if (!abort) {
					templateRenderer(src, templateConfig).save(dest);
				}
			}
		} else if (file === 'file') {
			const srcAbsolutePath = path.join(templateConfig.cwd, templateRelPath);
			const destAbsolutePath = path.join(templateConfig.cwd, templateConfig.dest, template);

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
		throw new QGenError(`qgen templates directory '${config.directory}' not found.`);
	}

	return Object.freeze({
		templates,
		render
	});
}

module.exports = qgen;
