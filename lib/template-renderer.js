'use strict';
const fs = require('fs');
const path = require('path');

const handlebars = require('handlebars');
const mkdirp = require('mkdirp');

const isFileOrDir = require('./file-helpers').isFileOrDir;

const templateRenderer = (src, config) => {
	let renderedContent;

	const render = () => {
		// Encoding is set as 'utf8' to get the return value as string
		const fileContents = fs.readFileSync(src, 'utf8');

		const hbsTemplate = handlebars.compile(fileContents);

		renderedContent = hbsTemplate(config);

		return renderedContent;
	};

	const save = dest => {
		const content = renderedContent || render();
		const destDir = path.dirname(dest);

		let isDestDirReady = true;
		let savedFile;

		if (isFileOrDir(destDir) !== 'directory') {
			isDestDirReady = mkdirp.sync(destDir) !== null;
		}

		if (isDestDirReady) {
			try {
				fs.writeFileSync(dest, content);

				savedFile = dest;
			} catch (err) {
				throw (err);
			}
		}

		return savedFile;
	};

	return Object.freeze({
		render,
		save
	});
};

module.exports = templateRenderer;
