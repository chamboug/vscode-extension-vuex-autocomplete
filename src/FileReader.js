const vscode = require("vscode");

module.exports = class FileReader {
    async getRootFile() {
        const files = await vscode.workspace.findFiles("**/store/**/*.js");
        const rootFile = files.find(file => file.path.endsWith("/src/store/index.js"));
        return {
            path: rootFile.path,
            content: await this.readFile(rootFile.path)
        }
    }
    async readFile(filePath) {
        const rawFileContent = await vscode.workspace.fs.readFile(vscode.Uri.parse(filePath));
        return Buffer.from(rawFileContent).toString("utf8");
    }
};
