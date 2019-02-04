'use strict';
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const templateRenderer = require('./template-renderer');
const {isFileOrDir} = require('./file-helpers');

const templateFileRenderer = (src, config) => {
	let renderedContent;
	const renderer = templateRenderer({
		helpers: config.helpers,
		cwd: config.cwd
	});

	const render = () => {
		// Encoding is set as 'utf8' to get the return value as string
		const templateFile = fs.readFileSync(src, 'utf8');
		renderedContent = renderer.render(templateFile, config);
		return renderedContent;
	};

	const save = dest => {
		let content = renderedContent || render();
		const destDir = path.dirname(dest);
		let hasDestDirExists = true;
		let savedPath;

		if (isFileOrDir(destDir) !== 'directory') {
			hasDestDirExists = mkdirp.sync(destDir) !== null;
		}

		if (hasDestDirExists) {
			try {
				const srcBasename = src.replace(config.directory + '/', '');
				if (config.postHooks && Object.prototype.hasOwnProperty.call(config.postHooks, srcBasename)) {
					let hookPath = config.postHooks[srcBasename];
					if (!path.isAbsolute(hookPath)) {
						hookPath = path.join(config.cwd, hookPath);
					}
					const hook = require(hookPath);
					const currentContent = fs.readFileSync(dest, 'utf8');
					content = hook(currentContent, content, config);
				}

				fs.writeFileSync(dest, content);

				savedPath = dest;
			} catch (error) {
				throw (error);
			}
		}

		return savedPath;
	};

	return Object.freeze({
		render,
		save
	});
};

module.exports = templateFileRenderer;
