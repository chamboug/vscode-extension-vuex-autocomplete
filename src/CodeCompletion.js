const vscode = require("vscode");
const { parse } = require("@babel/parser");
const esquery = require('esquery');

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
                    try {
                        const linePrefix = document.lineAt(position).text.substr(0, position.character);
                        const triggerFunctions = ["mapState", "mapGetters", "mapMutations", "mapActions"];
                        if (triggerFunctions.some(f => linePrefix.endsWith(`...${f}("`))) {
                            return storeTree.listNamespaces().map(item => new vscode.CompletionItem(item, vscode.CompletionItemKind.Text));
                        } else {
                            const scriptLineIndex = document.getText().split("\n").findIndex(l => /<script>/.test(l));
                            const scriptContent = document.getText().split("<script>")[1].split("</script>")[0];
                            const ast = parse(scriptContent, { sourceType: "module" });
                            const componentNode = esquery(ast, "ExportDefaultDeclaration")[0];
                            const computedPropertiesNode = esquery(componentNode, "ObjectProperty[key.name=\"computed\"]")[0];
                            const mapStateNodes = esquery(computedPropertiesNode, `SpreadElement[loc.start.line<=${position.line - scriptLineIndex + 1}][loc.end.line>=${position.line - scriptLineIndex + 1}][argument.callee.name="mapState"]`);
                            if (mapStateNodes.length > 0) {
                                const [namespace, ...attributes] = esquery(mapStateNodes[0], "StringLiteral");
                                const state = storeTree.getNodeByNamespacePrefix(namespace.value).state;
                                return state.map(item => new vscode.CompletionItem(item, vscode.CompletionItemKind.Text));
                            }
                        }
                    } catch (e) {
                        console.log(e)
                    }

                    return undefined;
                }
            },
            "."
        );
    }
};

const codeCompletion = new CodeCompletion();

module.exports = codeCompletion;
