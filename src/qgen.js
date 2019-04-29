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
import {prettyPrintFilePath, prettyPrintContents} from './lib/log-helpers';
import constants from './constants';

const DEFAULT_DESTINATION = './';

const renderFiles = (files, config, preview) => {
	files.forEach(f => {
		const renderObj = templateFileRenderer(f.src, config);
		if (preview) {
			prettyPrintFilePath(f.dest);
			prettyPrintContents(renderObj.getContents());
		} else {
			renderObj.save(f.dest);
			prettyPrintFilePath(f.dest, 'Generated: ');
		}
	});
};

const enquireToOverwrite = (fileObjects, overwriteAll) => {
	const enquireFileAtIndex = async (index, fileObjects, overwriteAll) => {
		if (!fileObjects[index]) {
			return Promise.resolve([]);
		}

		let fileObj = fileObjects[index];
		let overwriteRest;

		if (!overwriteAll) {
			const answer = await promptIfFileExists(fileObjects[index].dest);
			if (answer.overwrite === constants.ABORT) {
				return Promise.resolve([{abort: true}]);
			}

			if (answer.overwrite === constants.SKIP) {
				fileObj = null;
			}

			overwriteRest = answer.overwrite === constants.OVERWRITE_ALL;
		}

		return [fileObj, ...(await enquireFileAtIndex(index + 1, fileObjects, overwriteAll || overwriteRest))].filter(Boolean);
	};

	return enquireFileAtIndex(0, fileObjects, overwriteAll);
};

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
		force: false,
		preview: false
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

		const filesForRender = config.preview ? fileObjects : await enquireToOverwrite(fileObjects, config.force);

		if (!filesForRender.some(f => f.abort)) {
			renderFiles(filesForRender, templateConfig, config.preview);
		}
	};

	return Object.freeze({
		templates,
		render
	});
}

module.exports = qgen;
