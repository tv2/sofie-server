export class Tv2CasparCgPathFixer {
  public joinAssetToNetworkPath(
    networkPath: string,
    assetFile: string,
    extensionWithLeadingDot: string,
    folder: string
  ): string {
    const folderWithForwardSlashes: string = this.replaceDoubleBackslashWithForwardSlash(folder)
    const assetWithForwardSlashes: string = this.replaceDoubleBackslashWithForwardSlash(assetFile)
    const networkPathWithForwardSlashes: string = networkPath[0] + this.replaceDoubleBackslashWithForwardSlash(networkPath.slice(1))

    const folderWithoutLeadingTrailingSlashes = this.removeLeadingSlash(this.removeTrailingSlash(folderWithForwardSlashes))
    const assetFileWithoutLeadingSlashes = this.removeLeadingSlash(assetWithForwardSlashes)
    const networkPathWithoutTrailingSlashes = this.removeTrailingSlash(networkPathWithForwardSlashes)

    const extension = this.removeLeadingDot(extensionWithLeadingDot)

    if (!folderWithoutLeadingTrailingSlashes) {
      return this.convertToWindowsPath(`${networkPathWithoutTrailingSlashes}/${assetFileWithoutLeadingSlashes}.${extension}`)
    }

    return this.convertToWindowsPath(`${networkPathWithoutTrailingSlashes}/${folderWithoutLeadingTrailingSlashes}/${assetFileWithoutLeadingSlashes}.${extension}`)
  }

  public joinAssetToFolder(assetFile: string, folder?: string): string {
    if (!folder) {
      return assetFile
    }

    const folderWithForwardSlashes: string = this.replaceDoubleBackslashWithForwardSlash(folder)
    const assetWithForwardSlashes: string = this.replaceDoubleBackslashWithForwardSlash(assetFile)

    const folderWithoutTrailingSlashes: string = folderWithForwardSlashes.replace(/\/+$/, '')
    const assetFileWithoutLeadingSlashes: string = assetWithForwardSlashes.replace(/^\/+/, '')

    return `${folderWithoutTrailingSlashes}/${assetFileWithoutLeadingSlashes}`
  }

  public replaceForwardSlashWithDoubleBackslash(str: string): string {
    return this.convertToWindowsPath(str).replace(/\\/g, '\\\\')
  }

  private removeTrailingSlash(str: string): string {
    return str.replace(/\/+$/, '')
  }

  private removeLeadingDot(str: string): string {
    return str.replace(/^\./, '')
  }

  private removeLeadingSlash(str: string): string {
    return str.replace(/^\/+/, '')
  }

  private replaceDoubleBackslashWithForwardSlash(str: string): string {
    return str.replace(/\\\\/g, '\\').replace(/\\/g, '/')
  }

  private convertToWindowsPath(str: string): string {
    return str.replace(/\//g, '\\')
  }
}