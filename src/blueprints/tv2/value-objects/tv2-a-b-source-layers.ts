import { Tv2CasparCgLayer, Tv2SisyfosLayer } from './tv2-layers'

interface Tv2ABSourceLayers {
  caspar: {
    clipPending: string
  }
  sisyfos: {
    clipPending: string
    playerA: string // TODO: Same approach as caspar
    playerB: string
  }
}

export const A_B_SOURCE_INPUT_PLACEHOLDER: number = -1

export const A_B_SOURCE_LAYERS: Tv2ABSourceLayers = {
  caspar: {
    clipPending: Tv2CasparCgLayer.PLAYER_CLIP_PENDING,
  },
  sisyfos: {
    clipPending: Tv2SisyfosLayer.SOURCE_CLIP_PENDING,
    playerA: Tv2SisyfosLayer.SOURCE_SERVER_A,
    playerB: Tv2SisyfosLayer.SOURCE_SERVER_B,
  },
}
