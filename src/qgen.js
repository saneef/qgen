/* eslint-disable no-await-in-loop */
'use strict';
/**
 * @module qgen
 */
import path from 'path';

import globby from 'globby';

import QGenError from './lib/qgen-error';
import templateRenderer from './lib/template-renderer';
import templateFileRenderer from './lib/template-file-renderer';
import {isFileOrDir} from './lib/file-helpers';
import {promptIfFileExists} from './lib/prompt-helpers';
import {
	createConfigFilePath,
	loadConfig,
	createTemplateConfig
} from './lib/config-helpers';
import constants from './constants';

const DEFAULT_DESTINATION = './';

/**
 * Creates new qgen object
 * @param {Object} options - Options such as dest, config file path etc.
 * @returns {qgen} qgen object
 */
function qgen(options) {
	const defaultOptions = {
		dest: DEFAULT_DESTINATION,
		cwd: process.cwd(),
		directory: 'qgen-templates',
		config: './qgen.json',
		helpers: undefined,
		force: false
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
			cwd: path.join(config.cwd, config.directory),
			expandDirectories: false,
			onlyFiles: false
		});
	};

	/**
	 * Render the template file and save to the destination path
	 * @param  {String} template The name of the template
	 * @param  {String} destination Destination path
	 */
	const render = async (template, destination) => {
		const templatePath = path.join(config.directory, template);
		const templateType = isFileOrDir(path.join(config.cwd, templatePath));
		const templateConfig = createTemplateConfig(config, template, DEFAULT_DESTINATION);
		const filepathRenderer = templateRenderer({
			helpers: config.helpers,
			cwd: config.cwd
		});

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
					dest: path.join(templateConfig.cwd, templateConfig.dest, filepathRenderer.render(filePath, config))
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
		let overwriteAll = config.force;
		for (let i = 0; i < fileObjects.length && !abort; i++) {
			if (!overwriteAll) {
				const answer = await promptIfFileExists(fileObjects[i].dest);

				if (answer.overwrite === constants.OVERWRITE_ALL) {
					overwriteAll = true;
				} else if (answer.overwrite === constants.ABORT) {
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
