import { ActionType, PartActionType, PieceActionType } from '../enums/action-type'
import { PartInterface } from './part'
import { Piece, PieceInterface } from './piece'
import { Media } from './media'

export interface Action {
  id: string
  name: string
  description?: string
  type: ActionType
  data: unknown
  metadata?: unknown
}

export interface PartAction extends Action {
  type: PartActionType
  data: {
    partInterface: PartInterface,
    pieceInterfaces: PieceInterface[]
  }
}

export interface PieceAction extends Action {
  type: PieceActionType
  data: PieceInterface
}

export type MutateActionMethods = MutateActionWithPlannedPieceMethods | MutateActionWithMedia

export enum MutateActionType {
  PLANNED_PIECE = 'PLANNED_PIECE',
  MEDIA = 'MEDIA'
}

export interface MutateActionWithMedia {
  type: MutateActionType.MEDIA
  updateActionWithMedia: (action: Action, media?: Media) => Action
  getMediaId: () => string
}

export interface MutateActionWithPlannedPieceMethods {
  type: MutateActionType.PLANNED_PIECE
  updateActionWithPlannedPieceData: (action: Action, plannedPiece: Piece) => Action
  plannedPiecePredicate: (piece: Piece) => boolean
}

/**
 * Since we don't control Ingest we can't create Actions that requires data from the Ingest Gateway.
 * So we are forced to find the 'Actions' that Core has created and use the data from that to create our own Actions.
 * This interface is so we can retrieve those 'Actions' from the database and send them to Blueprints.
 * The 'actionId' is used to determine the piece type, so Blueprints can distinguish what kind of Actions to make e.g.
 * if the pieceType is PieceType.VIDEO_CLIP then Blueprints knows to create VideoClipActions.
 * The 'data' is the data that Core has saved and is needed by Blueprints to create the specific Action.
 * The 'data' is of type 'unknown' since the data used to create Actions are Blueprints specific. Blueprints will have
 * to map 'data' into whatever structure Blueprints needs.
 */
export interface ActionManifest<Data = unknown> {
  actionId: string
  data: Data
}
