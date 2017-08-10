'use strict';
/**
 * @module qgen
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const path = require('path');

const globby = require('globby');
const QGenError = require('./lib/qgen-error');
const templateRenderer = require('./lib/template-renderer');
const templateFileRenderer = require('./lib/template-file-renderer');

var _require = require('./lib/file-helpers');

const isFileOrDir = _require.isFileOrDir;

const promptIfFileExists = require('./lib/prompt-helpers').promptIfFileExists;

var _require2 = require('./lib/config-helpers');

const createConfigFilePath = _require2.createConfigFilePath,
      loadConfig = _require2.loadConfig,
      createTemplateConfig = _require2.createTemplateConfig;

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
	const render = (() => {
		var _ref = _asyncToGenerator(function* (template, destination) {
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

				fileObjects = files.map(function (filePath) {
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
			let overwriteAll = false;
			for (let i = 0; i < fileObjects.length && !abort; i++) {
				let answer;
				if (!overwriteAll) {
					// eslint-disable-next-line no-await-in-loop
					answer = yield promptIfFileExists(fileObjects[i].dest);

					if (answer === constants.OVERWRITE_ALL) {
						overwriteAll = true;
					} else if (answer === constants.ABORT) {
						abort = true;
					}
				}

				if (answer !== undefined && !abort) {
					templateFileRenderer(fileObjects[i].src, templateConfig).save(fileObjects[i].dest);
				}
			}
		});

		return function render(_x, _x2) {
			return _ref.apply(this, arguments);
		};
	})();

	return Object.freeze({
		templates,
		render
	});
}

module.exports = qgen;