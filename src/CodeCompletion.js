const vscode = require("vscode");

class CodeCompletion {
    constructor() {
        this.disposable = null;
    }

    registerCompletionItems(storeTree) {
        if (this.disposable) {
            this.disposable.dispose();
        }
        this.disposable = vscode.languages.registerCompletionItemProvider(
            "vue",
            {
                provideCompletionItems(document, position) {
                    const linePrefix = document.lineAt(position).text.substr(0, position.character);
                    const triggerFunctions = ["mapState", "mapGetters", "mapMutations", "mapActions"];
                    if (triggerFunctions.every(f => !linePrefix.endsWith(`...${f}("`))) {
                        return undefined;
                    }
    
                    return storeTree.listNamespaces().map(item => new vscode.CompletionItem(item, vscode.CompletionItemKind.Text));
                }
            },
            "."
        );
    }
};

const codeCompletion = new CodeCompletion();

module.exports = codeCompletion;
