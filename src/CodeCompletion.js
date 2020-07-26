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
                            const matchingMapFunction = ["mapState", "mapGetters"].map(f => esquery(computedPropertiesNode, `SpreadElement[loc.start.line<=${position.line - scriptLineIndex + 1}][loc.end.line>=${position.line - scriptLineIndex + 1}][argument.callee.name="${f}"]`)).find(x => x.length > 0);
                            if (matchingMapFunction) {
                                const matchingMapFunctionName = esquery(matchingMapFunction[0], "Identifier")[0].name;
                                const [namespace, ...attributes] = esquery(matchingMapFunction[0], "StringLiteral");
                                const matchingAttributes = storeTree.getNodeByNamespacePrefix(namespace.value)[matchingMapFunctionName.toLowerCase().slice(3)];
                                return matchingAttributes.map(item => new vscode.CompletionItem(item, vscode.CompletionItemKind.Text));
                            } else {
                                const methodsPropertiesNode = esquery(componentNode, "ObjectProperty[key.name=\"methods\"]")[0];
                                const matchingMapFunction = ["mapMutations", "mapActions"].map(f => esquery(methodsPropertiesNode, `SpreadElement[loc.start.line<=${position.line - scriptLineIndex + 1}][loc.end.line>=${position.line - scriptLineIndex + 1}][argument.callee.name="${f}"]`)).find(x => x.length > 0);
                                if (matchingMapFunction) {
                                    const matchingMapFunctionName = esquery(matchingMapFunction[0], "Identifier")[0].name;
                                    const [namespace, ...attributes] = esquery(matchingMapFunction[0], "StringLiteral");
                                    const matchingAttributes = storeTree.getNodeByNamespacePrefix(namespace.value)[matchingMapFunctionName.toLowerCase().slice(3)];
                                    return matchingAttributes.map(item => new vscode.CompletionItem(item, vscode.CompletionItemKind.Text));
                                }
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
