const cherow = require("cherow");
const RootFileReader = require("./RootFileReader");

module.exports = class VuexParser {
    async run() {
        const rootFileContent = await new RootFileReader().getRootFileContent();
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
