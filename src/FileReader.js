const vscode = require("vscode");

module.exports = class FileReader {
    async getRootFile() {
        const files = await vscode.workspace.findFiles("**/store/**/*.js");
        const rootFile = files.find(file => file.path.endsWith("/src/store/index.js"));
        const rootFileRaw = await this.readFile(rootFile.path);
        return {
            path: rootFile.path,
            content: Buffer.from(rootFileRaw).toString("utf8")
        }
    }
    readFile(filePath) {
        return vscode.workspace.fs.readFile(vscode.Uri.parse(filePath));
    }
};
