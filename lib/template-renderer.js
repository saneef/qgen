'use strict';
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const mkdirp = require('mkdirp');
const isFileOrDir = require('./file-helpers').isFileOrDir;

const templateRenderer = (src, config) => {
	let renderedContent;
	const handlebars = Handlebars;

	if (config.helpers) {
		let helperFilePath = config.helpers;

		if (!path.isAbsolute(helperFilePath)) {
			helperFilePath = path.join(config.cwd, helperFilePath);
		}

		handlebars.registerHelper(require(helperFilePath));
	}

	const render = () => {
		// Encoding is set as 'utf8' to get the return value as string
		const templateFile = fs.readFileSync(src, 'utf8');
		const compiledTemplate = handlebars.compile(templateFile);
		renderedContent = compiledTemplate(config);
		return renderedContent;
	};

	const save = dest => {
		const content = renderedContent || render();
		const destDir = path.dirname(dest);
		let hasDestDirExists = true;
		let savedPath;

		if (isFileOrDir(destDir) !== 'directory') {
			hasDestDirExists = mkdirp.sync(destDir) !== null;
		}

		if (hasDestDirExists) {
			try {
				fs.writeFileSync(dest, content);

				savedPath = dest;
			} catch (err) {
				throw (err);
			}
		}

		return savedPath;
	};

	return Object.freeze({
		render,
		save
	});
};

module.exports = templateRenderer;
