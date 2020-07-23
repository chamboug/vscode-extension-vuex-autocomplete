const vscode = require("vscode");

class VuexCompletion {
    constructor() {
        this.disposable = null;
    }

    registerCompletionItems(completionItems) {
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
    
                    return completionItems.map(item => new vscode.CompletionItem(item, vscode.CompletionItemKind.Text));
                }
            },
            "."
        );
    }
};

const vuexCompletion = new VuexCompletion();

module.exports = vuexCompletion;
