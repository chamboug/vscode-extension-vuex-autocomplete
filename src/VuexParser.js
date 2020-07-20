const cherow = require("cherow");
const path = require("path");
const FileReader = require("./FileReader");

module.exports = class VuexParser {
    constructor() {
        this.fileReader = new FileReader();
        this.storeTree = {};
    }
    async run() {
        const { path: rootFilePath, content } = await this.fileReader.getRootFile();
        const modulePaths = this.parseModules(content, true);
        const tree = {
            path: ".",
            children: modulePaths.map(submodulePath => ({ path: submodulePath, children: [] }))
        };

        const iterate = async (node) => {
            for (const child of node.children) {
                const modulePath = path.join(rootFilePath, "..", `${child.path}.js`).replace(/\\/g, "/");
                const fileContent = await this.fileReader.readFile(modulePath);
                const submodulePaths = this.parseModules(fileContent);
                child.children = submodulePaths.map(submodulePath => ({ path: `${submodulePath}`, children: [] }));
                child.children.forEach(subchild => {
                    iterate(subchild);
                });
            }
        };
        
        iterate(tree).then(() => {
            console.log(tree);
        });
    }
    parseModules(fileContent, isRootFile = false) {
        const parsedFileContent = cherow.parseModule(fileContent);
        let storeNode;
        if (isRootFile) {
            storeNode = this.getStoreNode(parsedFileContent);
        } else {
            storeNode = this.getModuleNode(parsedFileContent);
        }
        const modules = this.getPropertyFromStoreNode(storeNode, "modules", parsedFileContent);

        const importsDeclarations = parsedFileContent.body.filter(x => x.type === "ImportDeclaration");
        const modulePaths = modules.map(moduleName => importsDeclarations.find(x => x.specifiers[0].local.name === moduleName).source.value);
        return modulePaths;
    }
    getModuleNode(parsedFileContent) {
        return {
            declarationType: "ExportDefaultDeclaration",
            storeDeclaration: parsedFileContent.body.find(x => x.type === "ExportDefaultDeclaration")
        };
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
        } else if (storeNode.declarationType === "ExportNamedDeclaration") {
            propertyNode = storeNode.storeDeclaration.declaration.declarations[0].init.arguments[0].properties.find(x => x.key.name === propertyName);
        } else { // ExportDefaultDeclaration
            propertyNode = storeNode.storeDeclaration.declaration.properties.find(x => x.key.name === propertyName);
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
