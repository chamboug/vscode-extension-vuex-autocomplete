const vscode = require('vscode');
const VuexParser = require('./src/VuexParser');
const codeCompletionInstance = require("./src/CodeCompletion");

const vuexParser = new VuexParser();

const activate = () => {
    updateCompletion();
    vscode.workspace.onDidSaveTextDocument(event => {
        if (!/.*\/src\/store\/.*/.test(event.uri.path)) {
            return;
        }
        updateCompletion();
    });
};

const updateCompletion = () => {
    vuexParser.generateStoreTree().then(storeTree => {
        codeCompletionInstance.registerCompletionItems(storeTree);
    });
};

const deactivate = () => {};

exports.activate = activate;

module.exports = {
	activate,
	deactivate
}
