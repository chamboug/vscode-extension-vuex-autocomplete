const vscode = require('vscode');
const VuexCompletion = require('./src/VuexCompletion');
const VuexParser = require('./src/VuexParser');

const vuexParser = new VuexParser();

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    vuexParser.run();
    vscode.workspace.onDidSaveTextDocument(() => {
        vuexParser.run();
    });
}
exports.activate = activate;

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
