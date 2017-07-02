'use strict';
/**
 * @module qgen
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const path = require('path');

const globby = require('globby');
const QGenError = require('../lib/qgen-error');

const templateRenderer = require('../lib/template-renderer');

var _require = require('../lib/file-helpers');

const isFileOrDir = _require.isFileOrDir,
      renderPath = _require.renderPath;

const promptIfFileExists = require('../lib/prompt-helpers').promptIfFileExists;

var _require2 = require('../lib/config-helpers');

const createConfigFilePath = _require2.createConfigFilePath,
      loadConfig = _require2.loadConfig,
      createTemplateConfig = _require2.createTemplateConfig;

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
	const render = (() => {
		var _ref = _asyncToGenerator(function* (template, destination) {
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
						const answer = yield promptIfFileExists(dest);
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

				promptIfFileExists(destAbsolutePath).then(function (overwrite) {
					if (overwrite === constants.WRITE || overwrite === constants.OVERWRITE || overwrite === constants.OVERWRITE_ALL) {
						templateRenderer(srcAbsolutePath, templateConfig).save(destAbsolutePath);
					}
				});
			} else {
				throw new QGenError(`Template '${templateRelPath}' not found.`, file.message, file);
			}
		});

		return function render(_x, _x2) {
			return _ref.apply(this, arguments);
		};
	})();

	if (isFileOrDir(config.directory) !== 'directory') {
		throw new QGenError(`qgen templates directory '${config.directory}' not found.`);
	}

	return Object.freeze({
		templates,
		render
	});
}

module.exports = qgen;
