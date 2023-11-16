export class Tv2AssetPathHelper {
  public joinAssetToNetworkPath(
    networkPath: string,
    assetFilePathWithoutExtension: string,
    extensionWithLeadingDot: string,
    folderPath: string
  ): string {
    const extension = this.removeLeadingDot(extensionWithLeadingDot)
    const assetFilePath: string = `${assetFilePathWithoutExtension}.${extension}`
    return this.createWindowsPath(networkPath, folderPath, assetFilePath)
  }

  public joinAssetToFolder(assetFilePath: string, folderPath?: string): string {
    if (!folderPath) {
      return assetFilePath
    }
    return this.isWindowsPath(folderPath)
      ? this.createWindowsPath(folderPath, assetFilePath)
      : this.createUnixPath(folderPath, assetFilePath)
  }

  private isWindowsPath(folder: string): boolean {
    return folder.includes('\\')
  }

  private createUnixPath(...pathSegments: string[]): string {
    return this.removeConsecutiveSlashesNotAtStartOfPath(pathSegments.map(pathSegment => this.normalizeSlashes(pathSegment)).join('/'))
  }

  private createWindowsPath(...pathSegments: string[]): string {
    return this.convertUnixPathToWindowsPath(this.createUnixPath(...pathSegments))
  }

  public convertUnixPathToWindowsPath(path: string): string {
    return path.replaceAll('/', '\\')
  }

  public escapePath(path: string): string {
    return path.replaceAll('\\', '\\\\')
  }

  private normalizeSlashes(pathSegment: string): string {
    return pathSegment.replaceAll('\\', '/')
  }

  private removeConsecutiveSlashesNotAtStartOfPath(path: string): string {
    return path.replace(/(?<!^)\/+/g, '/')
  }

  private removeLeadingDot(str: string): string {
    return str.replace(/^\./, '')
  }
}