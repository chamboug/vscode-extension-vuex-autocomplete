const vscode = require("vscode");
const path = require("path");

module.exports = class VuexParser {
    async run() {
        const files = await vscode.workspace.findFiles("**/store/**/*.js");
        const rootFile = files.find(file => file.path.endsWith("/src/store/index.js"));
        const rootFileRaw = await vscode.workspace.fs.readFile(vscode.Uri.parse(rootFile.path))
        const rootFileContent = Buffer.from(rootFileRaw).toString("utf8");
        console.log(this.listRelevantFileImports(rootFile.path, rootFileContent).length);
    }
    listRelevantFileImports(currentFilePath, fileContent) {
        return this.listFileImports(fileContent).filter(fileImport => this.isFileImportRelevant(currentFilePath, fileImport));
    }
    listFileImports(fileContent) {
        const fileImports = [];
        const importRegex =  /import .* from ("|')(?<fileImport>.*)("|')/gm;
        let regexResult = null;
        while ((regexResult = importRegex.exec(fileContent)) !== null) {
            fileImports.push(regexResult.groups.fileImport);
        }
        return fileImports;
    }
    isFileImportRelevant(currentFilePath, fileImport) {
        if (!/(\.\.?)\//.test(fileImport)) {
            return false;
        }
        const fileFullPath = path.join(currentFilePath, "..", `${fileImport}.js`).toString().replace(/\\/g, "/");
        return fileFullPath.indexOf("/src/store") !== -1;
    }
};
