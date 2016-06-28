'use strict';
const path = require('path');
const execa = require('execa');
const test = require('ava');
const copy = require('cpy');
const del = require('del');
const folderEquals = require('assert-dir-equal');

const binPath = path.join(__dirname, '../bin/cli.js');
const fixturesBasePath = path.join(__dirname, './fixtures/');

// execa('ls', [], {cwd: '../bin/'}).then(r => console.log(r));

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
	const testBase = path.join(fixturesBasePath, 'single-file/src');
	const src = './**/*';
	const dest = '../build';

	// Deletes the previous build folder
	del.sync(path.join(testBase, dest));

	return copy([src], dest, {parents: true, cwd: testBase, nodir: true}).then(() => {
		return execa(binPath, ['blog.md', '--title=A fresh title', '--slug=a-fresh-title'], {
			cwd: path.join(fixturesBasePath, './single-file/build')
		}).then(() => {
			return folderEquals(path.join(fixturesBasePath, 'single-file/build'),
				path.join(fixturesBasePath, 'single-file/expected'));
		});
	});
});

test('should generate from a single file with custom settings', () => {
	const testBase = path.join(fixturesBasePath, 'single-file-custom-settings/src');
	const src = './**/*';
	const dest = '../build';

	// Deletes the previous build folder
	del.sync(path.join(testBase, dest));

	return copy([src], dest, {parents: true, cwd: testBase, nodir: true}).then(() => {
		return execa(binPath, ['blog.md', '--directory=my-templates', '--title=A fresh title', '--slug=a-fresh-title'], {
			cwd: path.join(fixturesBasePath, './single-file-custom-settings/build')
		}).then(() => {
			return folderEquals(path.join(fixturesBasePath, 'single-file-custom-settings/build'),
				path.join(fixturesBasePath, 'single-file-custom-settings/expected'));
		});
	});
});

test('should generate from a single file with a destination', () => {
	const testBase = path.join(fixturesBasePath, 'single-file-with-dest/src');
	const src = './**/*';
	const dest = '../build';

	// Deletes the previous build folder
	del.sync(path.join(testBase, dest));

	return copy([src], dest, {parents: true, cwd: testBase, nodir: true}).then(() => {
		return execa(binPath, ['blog.md', 'today', '--title=A fresh title', '--slug=a-fresh-title'], {
			cwd: path.join(fixturesBasePath, './single-file-with-dest/build')
		}).then(() => {
			return folderEquals(path.join(fixturesBasePath, 'single-file-with-dest/build'),
				path.join(fixturesBasePath, 'single-file-with-dest/expected'));
		});
	});
});

test('should generate from a folder', () => {
	const testBase = path.join(fixturesBasePath, 'folder-of-files/src');
	const src = './**/*';
	const dest = '../build';

	// Deletes the previous build folder
	del.sync(path.join(testBase, dest));

	return copy([src], dest, {parents: true, cwd: testBase, nodir: true}).then(() => {
		return execa(binPath, ['react-component', './Dummy', '--title=Dummy', '--className=dummy'], {
			cwd: path.join(fixturesBasePath, './folder-of-files/build')
		}).then(() => {
			return folderEquals(path.join(fixturesBasePath, 'folder-of-files/build'),
				path.join(fixturesBasePath, 'folder-of-files/expected'));
		});
	});
});
