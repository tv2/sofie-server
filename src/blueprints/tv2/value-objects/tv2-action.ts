import { Action } from '../../../model/entities/action'

export interface Tv2Action extends Action {
    metadata: {
        contentType: Tv2ActionContentType
    }
}

export interface Tv2VideoClipAction extends Tv2Action {
    metadata: {
        contentType: Tv2ActionContentType.VIDEO_CLIP,
        sourceName: string
    }
}

enum Tv2ActionContentType {
    VIDEO_CLIP = 'VIDEO_CLIP'
}
