const cherow = require("cherow");
const path = require("path");
const FileReader = require("./FileReader");

module.exports = class VuexParser {
    constructor() {
        this.storeTree = {};
    }
    async run() {
        const { path, content } = await new FileReader().getRootFile();
        const modulePaths = this.parseModules(content);

        const listPaths = data => {
            data.map(modulePath => ({ path: path.join(filePath, modulePath) })).reduce((acc, val) => {
                const submodulePaths = await this.parseModules(val.path);
            }, []);
        };
        const paths = listPaths(modulePaths);
        console.log(paths);
    }
    parseModules(fileContent) {
        const parsedFileContent = cherow.parseModule(fileContent);
        const storeNode = this.getStoreNode(parsedFileContent);
        const modules = this.getPropertyFromStoreNode(storeNode, "modules", parsedFileContent);

        const importsDeclarations = parsedFileContent.body.filter(x => x.type === "ImportDeclaration");
        const modulePaths = modules.map(moduleName => importsDeclarations.find(x => x.specifiers[0].local.name === moduleName).source.value);
        return modulePaths;
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
