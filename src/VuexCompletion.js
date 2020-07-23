const vscode = require("vscode");

module.exports = class VuexCompletion {
    registerCompletionItems(completionItems) {
        vscode.languages.registerCompletionItemProvider(
            "vue",
            {
                provideCompletionItems(document, position) {
                    const linePrefix = document.lineAt(position).text.substr(0, position.character);
                    const triggerFunctions = ["mapState", "mapGetters", "mapMutations", "mapActions"];
                    if (triggerFunctions.every(f => !linePrefix.endsWith(`...${f}("`))) {
                        return undefined;
                    }
    
                    return completionItems.map(item => new vscode.CompletionItem(item, vscode.CompletionItemKind.Text));
                }
            },
            "."
        );
    }
};
