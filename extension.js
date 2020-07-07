const vscode = require('vscode');
const VuexCompletion = require('./src/VuexCompletion');
const VuexParser = require('./src/VuexParser');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    new VuexParser().run();
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
