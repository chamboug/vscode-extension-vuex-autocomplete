const vscode = require("vscode");
const path = require("path");
const cherow = require("cherow");

module.exports = class VuexParser {
    async run() {
        const files = await vscode.workspace.findFiles("**/store/**/*.js");
        const rootFile = files.find(file => file.path.endsWith("/src/store/index.js"));
        const rootFileRaw = await vscode.workspace.fs.readFile(vscode.Uri.parse(rootFile.path));
        const rootFileContent = Buffer.from(rootFileRaw).toString("utf8");
        console.log(rootFileContent);

        const parsedRootFileContent = cherow.parseModule(rootFileContent);

        const variableDeclarations = parsedRootFileContent.body.filter(x => x.type === "VariableDeclaration");
        const storeVariableDeclaration = variableDeclarations.find(x => x.declarations[0].id.name === "store");
        if (storeVariableDeclaration) {
            // const store = new Vuex.Store({ ... });
            // export { store };
            const moduleProperties = storeVariableDeclaration.declarations[0].init.arguments[0].properties.find(x => x.key.name === "modules");
            if (moduleProperties.value.properties) {
                const moduleNames = moduleProperties.value.properties.map(x => x.key.name);
                console.log(moduleNames);
            } else {
                const modulesVariableDeclaration = variableDeclarations.find(x => x.declarations[0].id.name === "modules");
                const moduleNames = modulesVariableDeclaration.declarations[0].init.properties.map(x => x.key.name);
                console.log(moduleNames);
            }
        } else {
            // export const store = new Vuex.Store({ ... });
            const exportNamedDeclarations = parsedRootFileContent.body.filter(x => x.type === "ExportNamedDeclaration");
            const storeExportNamedDeclaration = exportNamedDeclarations.find(x => x.declaration.declarations[0].id.name === "store");
            const moduleProperties = storeExportNamedDeclaration.declaration.declarations[0].init.arguments[0].properties.find(x => x.key.name === "modules");
            if (moduleProperties.value.properties) {
                const moduleNames = moduleProperties.value.properties.map(x => x.key.name);
                console.log(moduleNames);
            } else {
                const modulesVariableDeclaration = variableDeclarations.find(x => x.declarations[0].id.name === "modules");
                const moduleNames = modulesVariableDeclaration.declarations[0].init.properties.map(x => x.key.name);
                console.log(moduleNames);
            }
        }

    }
};
