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
    clipPending: Tv2CasparCgLayer.CasparPlayerClipPending,
  },
  sisyfos: {
    clipPending: Tv2SisyfosLayer.SisyfosSourceClipPending,
    playerA: Tv2SisyfosLayer.SisyfosSourceServerA,
    playerB: Tv2SisyfosLayer.SisyfosSourceServerB,
  },
}
