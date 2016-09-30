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

test('should executes,', t => {
	return t.notThrows(execa(binPath, [], {cwd: fixturesBasePath}));
});

test('should show help message when executed without any arguments,', t => {
	return execa(binPath, [], {cwd: fixturesBasePath}).then(result => {
		return t.regex(result.stdout, /Usage/g);
	});
});

test('should throw error', t => {
	return t.throws(execa(binPath, ['non_existent_template'], {cwd: fixturesBasePath}));
});

test('should generate from a single file', () => {
	return readyBuildFromSrc('single-file').then(() => {
		return execa(binPath, ['blog.md', '--title=A fresh title', '--slug=a-fresh-title'], {
			cwd: path.join(fixturesBasePath, './single-file/build')
		}).then(() => {
			return folderEquals(path.join(fixturesBasePath, 'single-file/build'),
				path.join(fixturesBasePath, 'single-file/expected'));
		});
	});
});

test('should generate from a single file with settings from configfile', () => {
	return readyBuildFromSrc('single-file-with-configfile').then(() => {
		return execa(binPath, ['blog.md'], {
			cwd: path.join(fixturesBasePath, './single-file-with-configfile/build')
		}).then(() => {
			return folderEquals(path.join(fixturesBasePath, 'single-file-with-configfile/build'),
				path.join(fixturesBasePath, 'single-file-with-configfile/expected'));
		});
	});
});

test('should generate destination from CLI, overriding destination from configfile', () => {
	return readyBuildFromSrc('single-file-with-configfile-dest-override').then(() => {
		return execa(binPath, ['blog.md', 'today', '--title=A fresh title', '--slug=a-fresh-title'], {
			cwd: path.join(fixturesBasePath, './single-file-with-configfile-dest-override/build')
		}).then(() => {
			return folderEquals(path.join(fixturesBasePath, 'single-file-with-configfile-dest-override/build'),
				path.join(fixturesBasePath, 'single-file-with-configfile-dest-override/expected'));
		});
	});
});

test('should generate destination from CLI, overriding global destination from configfile', () => {
	return readyBuildFromSrc('single-file-with-configfile-global-dest-override').then(() => {
		return execa(binPath, ['blog.md', 'today', '--title=A fresh title', '--slug=a-fresh-title'], {
			cwd: path.join(fixturesBasePath, './single-file-with-configfile-global-dest-override/build')
		}).then(() => {
			return folderEquals(path.join(fixturesBasePath, 'single-file-with-configfile-global-dest-override/build'),
				path.join(fixturesBasePath, 'single-file-with-configfile-global-dest-override/expected'));
		});
	});
});

test('should generate from a folder', () => {
	return readyBuildFromSrc('folder-of-files').then(() => {
		return execa(binPath, ['react-component', './Dummy', '--title=Dummy', '--className=dummy'], {
			cwd: path.join(fixturesBasePath, './folder-of-files/build')
		}).then(() => {
			return folderEquals(path.join(fixturesBasePath, 'folder-of-files/build'),
				path.join(fixturesBasePath, 'folder-of-files/expected'));
		});
	});
});
