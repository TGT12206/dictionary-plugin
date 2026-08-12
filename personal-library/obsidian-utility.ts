export function belongsToFolder(folderPath: string, filePath: string) {
    return filePath.slice(folderPath.length) === folderPath
}
export function renameFolderInPath(oldFolderPath: string, newFolderPath: string, filePath: string) {
    return newFolderPath + filePath.slice(oldFolderPath.length + 1);
}