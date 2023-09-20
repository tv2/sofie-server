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

export const A_B_SOURCE_LAYERS: Tv2ABSourceLayers = {
  caspar: {
    clipPending: Tv2CasparCgLayer.CASPAR_CG_PLAYER_CLIP_PENDING,
  },
  sisyfos: {
    clipPending: Tv2SisyfosLayer.SISYFOS_SOURCE_CLIP_PENDING,
    playerA: Tv2SisyfosLayer.SISYFOS_SOURCE_SERVER_A,
    playerB: Tv2SisyfosLayer.SISYFOS_SOURCE_SERVER_B,
  },
}
