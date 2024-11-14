import * as assert from 'assert';
import * as vscode from 'vscode';
import * as mocha from 'mocha';

mocha.suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	mocha.test('Sample test 2', async () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

});
