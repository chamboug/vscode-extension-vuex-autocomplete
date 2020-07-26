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
                provideCompletionItems: (document, position) => {
                    try {
                        const linePrefix = document.lineAt(position).text.substr(0, position.character);
                        const triggerFunctions = ["mapState", "mapGetters", "mapMutations", "mapActions"];
                        if (triggerFunctions.some(f => linePrefix.endsWith(`...${f}("`))) {
                            return storeTree.listNamespaces().map(item => new vscode.CompletionItem(item, vscode.CompletionItemKind.Text));
                        } else {
                            const scriptLineIndex = document.getText().split("\n").findIndex(l => /<script>/.test(l));
                            const componentNode = this.getComponentNode(document);
                            const matchingMapFunctionNode = this.getMatchingFunctionNode(scriptLineIndex, componentNode, position);

                            const matchingMapFunctionName = esquery(matchingMapFunctionNode, "Identifier")[0].name;
                            const [namespace, ...attributes] = esquery(matchingMapFunctionNode, "StringLiteral");
                            const matchingAttributes = storeTree.getNodeByNamespacePrefix(namespace.value)[matchingMapFunctionName.toLowerCase().slice(3)];
                            return matchingAttributes.map(item => new vscode.CompletionItem(item, vscode.CompletionItemKind.Text));
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
    getComponentNode(document) {
        const scriptContent = document.getText().split("<script>")[1].split("</script>")[0];
        const ast = parse(scriptContent, { sourceType: "module" });
        return esquery(ast, "ExportDefaultDeclaration")[0];
    }
    getMatchingFunctionNode(scriptLineIndex, componentNode, position) {
        const componentSections = { computed: ["mapState", "mapGetters"], methods: ["mapMutations", "mapActions"]};
        for (const key of Object.keys(componentSections)) {
            const computedPropertiesNode = esquery(componentNode, `ObjectProperty[key.name="${key}"]`)[0];
            const query = functionName => `SpreadElement[loc.start.line<=${position.line - scriptLineIndex + 1}][loc.end.line>=${position.line - scriptLineIndex + 1}][argument.callee.name="${functionName}"]`;
            const matchingMapFunctionNodes = componentSections[key].map(f => esquery(computedPropertiesNode, query(f))).find(x => x.length > 0);
            if (matchingMapFunctionNodes) {
                return matchingMapFunctionNodes[0];
            }
        }
        return null;
    }
};

const codeCompletion = new CodeCompletion();

module.exports = codeCompletion;
