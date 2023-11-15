import { Tv2AssetPathHelper } from '../tv2-asset-path-helper'

describe(Tv2AssetPathHelper.name, () => {
  describe(Tv2AssetPathHelper.prototype.joinAssetToFolder.name, () => {
    describe('when path is for windows', () => {
      describe('when no folder path is provided', () => {
        it('returns the asset file path', () => {
          const testee: Tv2AssetPathHelper = createTestee()
          const assetFilePath: string = 'asset'

          const result: string = testee.joinAssetToFolder(assetFilePath)
          expect(result).toBe(assetFilePath)
        })
      })

      describe('when folder path is relative', () => {
        it('returns the folder path with the asset file path appended', () => {
          const testee: Tv2AssetPathHelper = createTestee()
          const assetFilePath: string = 'asset'
          const folderPath: string = 'someFolderName\\someOtherFolder'

          const result: string = testee.joinAssetToFolder(assetFilePath, folderPath)
          expect(result).toBe(`${folderPath}\\${assetFilePath}`)
        })
      })
      describe('when folder path starts with a drive letter', () => {
        it('returns the folder path with the asset file path appended', () => {
          const testee: Tv2AssetPathHelper = createTestee()
          const assetFilePath: string = 'asset'
          const folderPath: string = 'C:\\someFolderName'

          const result: string = testee.joinAssetToFolder(assetFilePath, folderPath)
          expect(result).toBe(`${folderPath}\\${assetFilePath}`)
        })
      })
      describe('when folder path is relative from root', () => {
        it('returns the folder path with the asset file path appended', () => {
          const testee: Tv2AssetPathHelper = createTestee()
          const assetFilePath: string = 'asset'
          const folderPath: string = '\\someFolderName'

          const result: string = testee.joinAssetToFolder(assetFilePath, folderPath)
          expect(result).toBe(`${folderPath}\\${assetFilePath}`)
        })
      })
      describe('when folder path is a network path', () => {
        it('returns the folder path with the asset file path appended', () => {
          const testee: Tv2AssetPathHelper = createTestee()
          const assetFilePath: string = 'asset'
          const folderPath: string = '\\\\someFolderName'

          const result: string = testee.joinAssetToFolder(assetFilePath, folderPath)
          expect(result).toBe(`${folderPath}\\${assetFilePath}`)
        })
      })
    })
    describe('when path is for unix', () => {
      describe('when no folder path is provided', () => {
        it('returns the asset file path', () => {
          const testee: Tv2AssetPathHelper = createTestee()
          const assetFilePath: string = 'asset'

          const result: string = testee.joinAssetToFolder(assetFilePath)
          expect(result).toBe(assetFilePath)
        })
      })
      describe('when folder path is relative', () => {
        it('returns the folder path with the asset file path appended', () => {
          const testee: Tv2AssetPathHelper = createTestee()
          const assetFilePath: string = 'asset'
          const folderPath: string = 'someFolderName'

          const result: string = testee.joinAssetToFolder(assetFilePath, folderPath)
          expect(result).toBe(`${folderPath}/${assetFilePath}`)
        })
      })
      describe('when folder path is absolute', () => {
        it('returns the folder path with the asset file path appended', () => {
          const testee: Tv2AssetPathHelper = createTestee()
          const assetFilePath: string = 'asset'
          const folderPath: string = '/someFolderName'

          const result: string = testee.joinAssetToFolder(assetFilePath, folderPath)
          expect(result).toBe(`${folderPath}/${assetFilePath}`)
        })
      })
    })
  })
  describe(Tv2AssetPathHelper.prototype.joinAssetToNetworkPath.name, () => {
    describe('when path is for windows', () => {
      describe('when folder path is empty', () => {
        const folderPath: string = ''
        describe('when network path has trailing slash', () => {
          it('returns the joined network path', () => {
            const testee: Tv2AssetPathHelper = createTestee()
            const assetFilePath: string = 'asset'
            const networkPath: string = '\\\\someServerName'
            const networkPathWithTrailingSlashes: string = `${networkPath}\\\\\\`
            const extension: string = 'json'
            const extensionWithLeadingDot: string = `.${extension}`

            const result: string = testee.joinAssetToNetworkPath(networkPathWithTrailingSlashes, assetFilePath, extensionWithLeadingDot, folderPath)
            expect(result).toBe(`${networkPath}\\${assetFilePath}.${extension}`)
          })
        })
        describe('when network path has no trailing slash', () => {
          it('returns the joined network path', () => {
            const testee: Tv2AssetPathHelper = createTestee()
            const assetFilePath: string = 'asset'
            const networkPath: string = '\\\\someServerName'
            const extension: string = 'json'
            const extensionWithLeadingDot: string = `.${extension}`

            const result: string = testee.joinAssetToNetworkPath(networkPath, assetFilePath, extensionWithLeadingDot, folderPath)
            expect(result).toBe(`${networkPath}\\${assetFilePath}.${extension}`)
          })
        })
      })
      describe('when folder path is given', () => {
        const folderPath: string = 'someFolderPath'
        describe('when network path has trailing slash', () => {
          it('returns the joined network path', () => {
            const testee: Tv2AssetPathHelper = createTestee()
            const assetFilePath: string = 'asset'
            const networkPath: string = '\\\\someServerName'
            const networkPathWithTrailingSlashes: string = `${networkPath}\\\\\\`
            const extension: string = 'json'
            const extensionWithLeadingDot: string = `.${extension}`

            const result: string = testee.joinAssetToNetworkPath(networkPathWithTrailingSlashes, assetFilePath, extensionWithLeadingDot, folderPath)
            expect(result).toBe(`${networkPath}\\${folderPath}\\${assetFilePath}.${extension}`)
          })
        })
        describe('when network path has no trailing slash', () => {
          it('returns the joined network path', () => {
            const testee: Tv2AssetPathHelper = createTestee()
            const assetFilePath: string = 'asset'
            const networkPath: string = '\\\\someServerName'
            const extension: string = 'json'
            const extensionWithLeadingDot: string = `.${extension}`

            const result: string = testee.joinAssetToNetworkPath(networkPath, assetFilePath, extensionWithLeadingDot, folderPath)
            expect(result).toBe(`${networkPath}\\${folderPath}\\${assetFilePath}.${extension}`)
          })
        })
      })
    })
  })
})



function createTestee(): Tv2AssetPathHelper {
  return new Tv2AssetPathHelper()
}