const vscode = require("vscode");

module.exports = class RootFileReader {
    async getRootFileContent() {
        const files = await vscode.workspace.findFiles("**/store/**/*.js");
        const rootFile = files.find(file => file.path.endsWith("/src/store/index.js"));
        const rootFileRaw = await vscode.workspace.fs.readFile(vscode.Uri.parse(rootFile.path));
        return Buffer.from(rootFileRaw).toString("utf8");
    }
};
