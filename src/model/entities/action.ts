import { ActionType, PartActionType, PieceActionType } from '../enums/action-type'
import { Part, PartInterface } from './part'
import { Piece, PieceInterface } from './piece'
import { PieceType } from '../enums/piece-type'
import { Media } from './media'
import { InTransition } from '../value-objects/in-transition'

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
  data: {
    pieceInterface: PieceInterface,
    partInTransition?: InTransition
  }
}

export type MutateActionMethods = MutateActionWithPieceMethods | MutateActionWithMedia | MutateActionWithHistoricPartMethods

export enum MutateActionType {
  PIECE = 'PIECE',
  MEDIA = 'MEDIA',
  HISTORIC_PART= 'HISTORIC_PART'
}

export interface MutateActionWithPieceMethods {
  type: MutateActionType.PIECE
  updateActionWithPieceData: (action: Action, piece: Piece) => Action
  piecePredicate: (piece: Piece) => boolean
}

export interface MutateActionWithMedia {
  type: MutateActionType.MEDIA
  updateActionWithMedia: (action: Action, media?: Media) => Action
  getMediaId: () => string
}

export interface MutateActionWithHistoricPartMethods {
  type: MutateActionType.HISTORIC_PART,
  updateActionWithPartData: (action: Action, historicPart: Part, presentPart: Part | undefined) => Action
  partPredicate: (part: Part) => boolean
}

/**
 * Since we don't control Ingest we can't create Actions that requires data from the Ingest Gateway.
 * So we are forced to find the 'Actions' that Core has created and use the data from that to create our own Actions.
 * This interface is so we can retrieve those 'Actions' from the database and send them to Blueprints.
 * The 'pieceType' is so Blueprints can distinguish what kind of Actions to make e.g. if the pieceType is PieceType.SERVER
 * then Blueprints knows to create ServerActions.
 * The 'data' is the data that Core has saved and is needed by Blueprints to create the specific Action.
 * The 'data' is of type 'unknown' since the data used to create Actions are Blueprints specific. Blueprints will have
 * to map 'data' into whatever structure Blueprints needs.
 */
export interface ActionManifest {
  pieceType: PieceType
  data: unknown
}
