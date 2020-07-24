module.exports = class StoreTree {
    constructor(tree) {
        this.tree = tree;
    }
    flat() {
        return this.flattenTree(this.tree, []);
    }
    flattenTree(node, acc) {
        const { children, ...nodeWithoutChildren } = node;
        return [
            ...acc,
            nodeWithoutChildren,
            ...node.children.reduce((acc, val) => acc.concat(this.flattenTree(val, [])), [])
        ]
    }
    listNamespaces() {
        const namespacePrefixes = this.flat().map(x => x.namespacePrefix);
        return namespacePrefixes.filter(x => !!x).map(x => x.endsWith("/") ? x.slice(0, -1) : x );
    }
};
