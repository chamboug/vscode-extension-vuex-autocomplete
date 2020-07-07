const vscode = require("vscode");

module.exports = class VuexParser {
    run() {
        vscode.languages.registerCompletionItemProvider(
            "vue",
            {
                provideCompletionItems(document, position) {
                    const linePrefix = document.lineAt(position).text.substr(0, position.character);
                    if (!linePrefix.endsWith('...mapState("')) {
                        return undefined;
                    }
    
                    return [
                        new vscode.CompletionItem('app/module1', vscode.CompletionItemKind.Text),
                        new vscode.CompletionItem('app/module2', vscode.CompletionItemKind.Text),
                    ];
                }
            },
            "."
        );
    }
};
