import { BaseMongoRepository } from './base-mongo-repository'
import { ActionManifestRepository } from '../interfaces/action-manifest-repository'
import { ActionManifest } from '../../../model/entities/action'
import { MongoEntityConverter } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { PieceType } from '../../../model/enums/piece-type'
import { UnexpectedCaseException } from '../../../model/exceptions/unexpected-case-exception'

const AD_LIB_PIECES_COLLECTION: string = 'adLibPieces'

interface AdLibPiece {
  sourceLayerId: string
  name: string
}

export class MongoAdLibPieceRepository extends BaseMongoRepository implements ActionManifestRepository {
  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
  }

  protected getCollectionName(): string {
    return AD_LIB_PIECES_COLLECTION
  }

  public async getActionManifests(): Promise<ActionManifest[]> {
    this.assertDatabaseConnection(this.getActionManifests.name)
    const mongoAdLibPieces: AdLibPiece[] = await this.getCollection().find<AdLibPiece>({}).toArray()
    return mongoAdLibPieces.map(adLibPiece => this.mapToActionManifest(adLibPiece))
  }

  private mapToActionManifest(adLibPiece: AdLibPiece): ActionManifest {
    return {
      pieceType: this.getPieceTypeFromAdLibPiece(adLibPiece),
      data: {
        name: adLibPiece.name
      },
      pieceLayer: adLibPiece.sourceLayerId
    }
  }

  private getPieceTypeFromAdLibPiece(adLibPiece: AdLibPiece): PieceType {
    switch (adLibPiece.sourceLayerId) {
      case 'studio0_graphicsLower':
      case 'studio0_graphicsIdent':
      case 'studio0_overlay':
      case 'studio0_pilotOverlay':
        return PieceType.GRAPHIC
      case 'studio0_audio_bed':
        return PieceType.AUDIO
      default:
        throw new UnexpectedCaseException(`Unknown sourceLayerId: ${adLibPiece.sourceLayerId}`)
    }
  }
}