const cherow = require("cherow");
const RootFileReader = require("./RootFileReader");

module.exports = class VuexParser {
    constructor() {
        this.storeTree = {};
    }
    async run() {
        const rootFileContent = await new RootFileReader().getRootFileContent();
        this.parseFile(rootFileContent);
    }
    parseFile(fileContent) {
        const parsedFileContent = cherow.parseModule(fileContent);
        const storeNode = this.getStoreNode(parsedFileContent);
        
        const state = this.getPropertyFromStoreNode(storeNode, "state", parsedFileContent);
        this.storeTree.state = state;
        const getters = this.getPropertyFromStoreNode(storeNode, "getters", parsedFileContent);
        this.storeTree.getters = getters;
        const mutations = this.getPropertyFromStoreNode(storeNode, "mutations", parsedFileContent);
        this.storeTree.mutations = mutations;
        const actions = this.getPropertyFromStoreNode(storeNode, "actions", parsedFileContent);
        this.storeTree.actions = actions;
        const modules = this.getPropertyFromStoreNode(storeNode, "modules", parsedFileContent);
        this.storeTree.modules = modules;

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
