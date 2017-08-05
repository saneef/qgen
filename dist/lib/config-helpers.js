'use strict';

const path = require('path');
const isRelative = require('is-relative');

const isFileOrDir = require('./file-helpers').isFileOrDir;

/**
 * Creates path to the config file
 * @param  {Object} defaultOptions
 * @param  {Object} options - The user set options
 * @return {string} The path to config file.
 */
const createConfigFilePath = (defaultOptions, options) => {
	if (options.config) {
		if (isRelative(options.config)) {
			return path.join(defaultOptions.cwd, options.config);
		}
		return options.config;
	}
	return path.join(defaultOptions.cwd, defaultOptions.config);
};

/**
 * Loads options from the config file
 * @param  {String} path - Path to the config file
 * @return {Object} Options loaded from the config file
 */
const loadConfig = path => {
	let config = {};

	if (isFileOrDir(path) === 'file') {
		// eslint-disable-next-line import/no-dynamic-require
		config = require(path);
	}

	return config;
};

/**
 * Creates template specific config from config passed
 *
 * @param  {Object} config - Global config
 * @param  {String} name - Name of the template
 * @param  {String} defaultDest - Default destination directory for the generated files
 * @return {Object} Config with template specifc configs
 */
const createTemplateConfig = (config, name, defaultDest) => {
	let templateConfig = config;

	// Process the additional config specific
	// to the given template
	if (config.templates && config.templates[name]) {
		const overrides = {
			templates: undefined
		};

		if (config.templates && config.templates[name] && config.templates[name].dest) {
			overrides.dest = config.templates[name].dest;
		}

		if (config.dest !== defaultDest) {
			overrides.dest = config.dest;
		}

		templateConfig = Object.assign({}, config.templates[name], config, overrides);
	}

	return templateConfig;
};

module.exports = {
	createConfigFilePath,
	loadConfig,
	createTemplateConfig
};