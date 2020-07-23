const { parse } = require("@babel/parser");
const path = require("path");
const FileReader = require("./FileReader");
const VuexCompletion = require("./VuexCompletion");

module.exports = class VuexParser {
    constructor() {
        this.fileReader = new FileReader();
        this.vuexCompletion = new VuexCompletion();
        this.storeTree = {};
    }
    async run() {
        const { path: rootFilePath, content: rootFileContent } = await this.fileReader.getRootFile();
        const tree = this.createRootTree(rootFileContent, path.join(rootFilePath, ".."));
        await this.fillTree(tree);
        this.storeTree = tree;
        const flattenedTree = this.flattenTree(this.storeTree, []);
        const namespacePrefixes = flattenedTree.map(x => x.namespacePrefix);
        const sanitizedNamespacePrefixes = namespacePrefixes
            .filter(x => !!x)
            .map(x => x.endsWith("/") ? x.slice(0, -1) : x );
        this.vuexCompletion.registerCompletionItems(sanitizedNamespacePrefixes);
    }
    flattenTree(node, acc) {
        const { children, ...nodeWithoutChildren } = node;
        return [
            ...acc,
            nodeWithoutChildren,
            ...node.children.reduce((acc, val) => acc.concat(this.flattenTree(val, [])), [])
        ]
    }
    createRootTree(rootFileContent, rootFilePath) {
        const ast = this.getASTFromFileContent(rootFileContent);
        const storeNode = this.getCurrentStoreNode(ast, true);
        const { modulePaths, moduleNames } = this.parseModulePaths(storeNode, ast);
        return {
            path: rootFilePath,
            namespaced: false,
            namespacePrefix: "",
            children: modulePaths.map((submodulePath, submodulePathIndex) => ({ 
                namespacePrefix: "",
                moduleName: moduleNames[submodulePathIndex],
                path: path.join(rootFilePath, submodulePath),
                children: []
            }))
        };
    }
    async fillTree(node) {
        for (const child of node.children) {
            const modulePath = path.join(`${child.path}.js`).replace(/\\/g, "/");
            const fileContent = await this.fileReader.readFile(modulePath);
            const ast = this.getASTFromFileContent(fileContent);
            const storeNode = this.getCurrentStoreNode(ast);

            // Namespaced
            const namespacedNode = this.getPropertyNodeFromStoreNode(storeNode, "namespaced");
            if (namespacedNode && namespacedNode.value.value) {
                child.namespaced = true;
            } else {
                child.namespaced = false;
            }

            if (child.namespaced) {
                child.namespacePrefix = `${child.namespacePrefix}${child.moduleName}/`;
            }

            ["state", "getters", "mutations", "actions"].forEach(propertyType => {
                child[propertyType] = this.listPropertyNamesFromStoreNode(storeNode, propertyType, ast);
            });

            // Sub-modules
            const { modulePaths: submodulePaths, moduleNames: submoduleNames } = this.parseModulePaths(storeNode, ast);
            child.children = submodulePaths.map((submodulePath, submodulePathIndex) => ({
                namespacePrefix: child.namespacePrefix,
                moduleName: submoduleNames[submodulePathIndex],
                path: path.join(child.path, "..", submodulePath),
                children: []
            }));
            if (child.children.length > 0) {
                await this.fillTree(child);
            }
        }
    }
    parseModulePaths(storeNode, ast) {
        const moduleNames = this.listPropertyNamesFromStoreNode(storeNode, "modules", ast);
        const importsDeclarations = ast.body.filter(x => x.type === "ImportDeclaration");
        const modulePaths = moduleNames.map(moduleName => importsDeclarations.find(x => x.specifiers[0].local.name === moduleName).source.value);
        return { modulePaths, moduleNames };
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
    listPropertyNamesFromStoreNode(storeNode, propertyName, ast) {
        const propertyNode = this.getPropertyNodeFromStoreNode(storeNode, propertyName);
        return this.listPropertyNamesFromPropertyNode(propertyNode, propertyName, ast);
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
    listPropertyNamesFromPropertyNode(propertyNode, propertyName, ast) {
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
