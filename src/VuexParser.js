const { parse } = require("@babel/parser");
const path = require("path");
const FileReader = require("./FileReader");

module.exports = class VuexParser {
    constructor() {
        this.fileReader = new FileReader();
        this.storeTree = {};
    }
    async run() {
        const { path: rootFilePath, content: rootFileContent } = await this.fileReader.getRootFile();
        const tree = this.createRootTree(rootFileContent);
        await this.fillTree(tree, rootFilePath)
        this.storeTree = tree;
        console.log(this.storeTree);
    }
    createRootTree(rootFileContent) {
        const ast = this.getASTFromFileContent(rootFileContent);
        const storeNode = this.getCurrentStoreNode(ast, true);
        const modulePaths = this.parseModulePaths(storeNode, ast);
        return {
            path: ".",
            children: modulePaths.map(submodulePath => ({ path: submodulePath, children: [] }))
        };
    }
    async fillTree(node, rootFilePath) {
        for (const child of node.children) {
            const modulePath = path.join(rootFilePath, "..", `${child.path}.js`).replace(/\\/g, "/");
            const fileContent = await this.fileReader.readFile(modulePath);
            const ast = this.getASTFromFileContent(fileContent);
            const storeNode = this.getCurrentStoreNode(ast);
            const submodulePaths = this.parseModulePaths(storeNode, ast);
            child.children = submodulePaths.map(submodulePath => ({ path: `${submodulePath}`, children: [] }));
            child.children.forEach(subchild => {
                this.fillTree(subchild);
            });
        }
    }
    parseModulePaths(storeNode, ast) {
        const moduleNode = this.getPropertyNodeFromStoreNode(storeNode, "modules");
        const modules = this.getPropertyFromPropertyNode(moduleNode, "modules", ast);
        const importsDeclarations = ast.body.filter(x => x.type === "ImportDeclaration");
        const modulePaths = modules.map(moduleName => importsDeclarations.find(x => x.specifiers[0].local.name === moduleName).source.value);
        return modulePaths;
    }
    getASTFromFileContent(fileContent) {
        return parse(fileContent, { sourceType: "module" }).program;
    }
    getCurrentStoreNode(ast, isRootFile = false) {
        if (isRootFile) {
            return this.getRootStoreNode(ast);
        }
        return this.getModuleNode(ast);
    }
    getModuleNode(ast) {
        return {
            declarationType: "ExportDefaultDeclaration",
            storeDeclaration: ast.body.find(x => x.type === "ExportDefaultDeclaration")
        };
    }
    getRootStoreNode(ast) {
        const variableDeclarations = ast.body.filter(x => x.type === "VariableDeclaration");
        const storeVariableDeclaration = variableDeclarations.find(x => x.declarations[0].id.name === "store");
        if (storeVariableDeclaration) {
            return { declarationType: "VariableDeclaration", storeDeclaration: storeVariableDeclaration };
        }
        const exportNamedDeclarations = ast.body.filter(x => x.type === "ExportNamedDeclaration");
        const storeExportNamedDeclaration = exportNamedDeclarations.find(x => x.declaration.declarations[0].id.name === "store");
        return { declarationType: "ExportNamedDeclaration", storeDeclaration: storeExportNamedDeclaration };
    }
    getPropertyNodeFromStoreNode(storeNode, propertyName) {
        if (storeNode.declarationType === "VariableDeclaration") {
            return storeNode.storeDeclaration.declarations[0].init.arguments[0].properties.find(x => x.key.name === propertyName);
        } else if (storeNode.declarationType === "ExportNamedDeclaration") {
            return storeNode.storeDeclaration.declaration.declarations[0].init.arguments[0].properties.find(x => x.key.name === propertyName);
        }
        // ExportDefaultDeclaration
        return storeNode.storeDeclaration.declaration.properties.find(x => x.key.name === propertyName);
    }
    getPropertyFromPropertyNode(propertyNode, propertyName, ast) {
        if (!propertyNode) {
            return [];
        }
        if (propertyNode.value.properties) {
            return propertyNode.value.properties.map(x => x.key.name);
        }
        const variableDeclarations = ast.body.filter(x => x.type === "VariableDeclaration");
        const modulesVariableDeclaration = variableDeclarations.find(x => x.declarations[0].id.name === propertyName);
        return modulesVariableDeclaration.declarations[0].init.properties.map(x => x.key.name);
    }
};
