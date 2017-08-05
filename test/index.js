'use strict';
const path = require('path');
const execa = require('execa');
const test = require('ava');
const copy = require('cpy');
const del = require('del');
const folderEquals = require('assert-dir-equal');

const binPath = path.join(__dirname, '../bin/cli.js');
const fixturesBasePath = path.join(__dirname, './fixtures/');

const readyBuildFromSrc = name => {
	const testBase = path.join(fixturesBasePath, name, 'src');
	const src = './**/*';
	const dest = '../build';

	// Deletes the previous build folder
	del.sync(path.join(testBase, dest));

	return copy([src], dest, {parents: true, cwd: testBase, nodir: true});
};

test('should throws error when template directory is missing,', t => {
	return t.throws(execa(binPath, [], {cwd: fixturesBasePath}));
});

test('should throw error when non-existent template is specified', t => {
	return t.throws(execa(binPath, ['non_existent_template'], {cwd: fixturesBasePath}));
});

test('should show help message when executed without any arguments,', async t => {
	await readyBuildFromSrc('single-file');
	const result = await execa(binPath, ['--help'], {
		cwd: path.join(fixturesBasePath, './single-file/build')
	});
	t.regex(result.stdout, /Usage/g);
});

test('should list available templates', async t => {
	await readyBuildFromSrc('single-file');
	const result = await execa(binPath, ['--help'], {
		cwd: path.join(fixturesBasePath, './single-file/build')
	});
	t.regex(result.stdout, /Available Templates/g);
	t.regex(result.stdout, /blog\.md/g);
});

test('should generate from a single file', async () => {
	await readyBuildFromSrc('single-file');
	await execa(binPath, ['blog.md', '--title=A fresh title', '--slug=a-fresh-title'], {
		cwd: path.join(fixturesBasePath, './single-file/build')
	});
	await folderEquals(path.join(fixturesBasePath, 'single-file/build'), path.join(fixturesBasePath, 'single-file/expected'));
});

test('should generate from a single file with settings from configfile', async () => {
	await readyBuildFromSrc('single-file-with-configfile');
	await execa(binPath, ['blog.md'], {
		cwd: path.join(fixturesBasePath, './single-file-with-configfile/build')
	});
	await folderEquals(path.join(fixturesBasePath, 'single-file-with-configfile/build'), path.join(fixturesBasePath, 'single-file-with-configfile/expected'));
});

test('should generate destination from CLI, overriding destination from configfile', async () => {
	await readyBuildFromSrc('single-file-with-configfile-dest-override');
	await execa(binPath, ['blog.md', 'today', '--title=A fresh title', '--slug=a-fresh-title'], {
		cwd: path.join(fixturesBasePath, './single-file-with-configfile-dest-override/build')
	});
	await folderEquals(path.join(fixturesBasePath, 'single-file-with-configfile-dest-override/build'), path.join(fixturesBasePath, 'single-file-with-configfile-dest-override/expected'));
});

test('should generate destination from CLI, overriding global destination from configfile', async () => {
	await readyBuildFromSrc('single-file-with-configfile-global-dest-override');
	await execa(binPath, ['blog.md', 'today', '--title=A fresh title', '--slug=a-fresh-title'], {
		cwd: path.join(fixturesBasePath, './single-file-with-configfile-global-dest-override/build')
	});
	await folderEquals(path.join(fixturesBasePath, 'single-file-with-configfile-global-dest-override/build'), path.join(fixturesBasePath, 'single-file-with-configfile-global-dest-override/expected'));
});

test('should generate with Handlebars helper functions', async () => {
	await readyBuildFromSrc('render-with-helper');
	await execa(binPath, ['blog', '--title=A fresh title', '--slug=a-fresh-title', '--helpers=./qgen-helpers.js'], {
		cwd: path.join(fixturesBasePath, './render-with-helper/build')
	});
	await folderEquals(path.join(fixturesBasePath, 'render-with-helper/build'), path.join(fixturesBasePath, 'render-with-helper/expected'));
});

test('should generate from a folder', async () => {
	await readyBuildFromSrc('folder-of-files');
	await execa(binPath, ['react-component', './Dummy', '--title=Dummy', '--className=dummy'], {
		cwd: path.join(fixturesBasePath, './folder-of-files/build')
	});
	await folderEquals(path.join(fixturesBasePath, 'folder-of-files/build'), path.join(fixturesBasePath, 'folder-of-files/expected'));
});
