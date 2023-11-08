export class AssetFolderHelper {
  // Copied from Blueprints
  public joinAssetToFolder(folder: string | undefined, assetFile: string): string {
    if (!folder) {
      return assetFile
    }

    // Replace every `\\` with `\`, then replace every `\` with `/`
    const folderWithForwardSlashes = folder.replace(/\\\\/g, '\\').replace(/\\/g, '/')
    const assetWithForwardSlashes = assetFile.replace(/\\\\/g, '\\').replace(/\\/g, '/')

    // Remove trailing slash from folder and leading slash from asset
    const folderWithoutTrailingSlashes = folderWithForwardSlashes.replace(/\/+$/, '')
    const assetFileWithoutLeadingSlashes = assetWithForwardSlashes.replace(/^\/+/, '')

    return `${folderWithoutTrailingSlashes}/${assetFileWithoutLeadingSlashes}`
  }
}
