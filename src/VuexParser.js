const cherow = require("cherow");
const FileReader = require("./FileReader");

module.exports = class VuexParser {
    constructor() {
        this.storeTree = {};
    }
    async run() {
        const rootFileContent = await new FileReader().getRootFileContent();
        this.parseFile(rootFileContent);
    }
    parseFile(fileContent) {
        const parsedFileContent = cherow.parseModule(fileContent);console.log(parsedFileContent)
        const storeNode = this.getStoreNode(parsedFileContent);
        
        this.storeTree = ["state", "getters", "mutations", "actions", "modules"].reduce((acc, val) => {
            return { ...acc, [val]: this.getPropertyFromStoreNode(storeNode, val, parsedFileContent) };
        }, {});
        this.storeTree.namespaced = false;

        const importsDeclarations = parsedFileContent.body.filter(x => x.type === "ImportDeclaration");
        const modulePaths = this.storeTree.modules.map(moduleName => importsDeclarations.find(x => x.specifiers[0].local.name === moduleName).source.value);
        console.log(modulePaths);

        console.log(this.storeTree);
    }
    getStoreNode(parsedFileContent) {
        const variableDeclarations = parsedFileContent.body.filter(x => x.type === "VariableDeclaration");
        const storeVariableDeclaration = variableDeclarations.find(x => x.declarations[0].id.name === "store");
        if (storeVariableDeclaration) {
            return { declarationType: "VariableDeclaration", storeDeclaration: storeVariableDeclaration };
        }
        const exportNamedDeclarations = parsedFileContent.body.filter(x => x.type === "ExportNamedDeclaration");
        const storeExportNamedDeclaration = exportNamedDeclarations.find(x => x.declaration.declarations[0].id.name === "store");
        return { declarationType: "ExportNamedDeclaration", storeDeclaration: storeExportNamedDeclaration };
    }
    getPropertyFromStoreNode(storeNode, propertyName, parsedFileContent) {
        let propertyNode;
        if (storeNode.declarationType === "VariableDeclaration") {
            propertyNode = storeNode.storeDeclaration.declarations[0].init.arguments[0].properties.find(x => x.key.name === propertyName);
        } else { // ExportNamedDeclaration
            propertyNode = storeNode.storeDeclaration.declaration.declarations[0].init.arguments[0].properties.find(x => x.key.name === propertyName);
        }

        if (!propertyNode) {
            return [];
        }

        if (propertyNode.value.properties) {
            return propertyNode.value.properties.map(x => x.key.name);
        }
        const variableDeclarations = parsedFileContent.body.filter(x => x.type === "VariableDeclaration");
        const modulesVariableDeclaration = variableDeclarations.find(x => x.declarations[0].id.name === propertyName);
        return modulesVariableDeclaration.declarations[0].init.properties.map(x => x.key.name);
    }
};
