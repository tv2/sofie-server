export interface Tv2CasparcgTemplateData {
  display: Tv2CasparcgTemplateDisplayMode
  partialUpdate: boolean
  slots: {
    [Tv2CasparcgTemplateSlotType.FULLSCREEN_GRAPHICS]?: {
      display: Tv2CasparcgTemplateDisplayMode
      payload: {
        type: 'still'
        url: string
        noAnimation: boolean
      }
    }
    [Tv2CasparcgTemplateSlotType.PILOT_OVERLAY]?: {
      display: Tv2CasparcgTemplateDisplayMode
      payload: {
        type: string
        url: string
        noAnimation: boolean
      }
    }
    [Tv2CasparcgTemplateSlotType.LOWER_THIRD]?: {
      display: Tv2CasparcgTemplateDisplayMode
      payload: {
        type: string
        [locatorIndex: number]: string
      }
    }
    [Tv2CasparcgTemplateSlotType.IDENT]?: {
      display: Tv2CasparcgTemplateDisplayMode
      payload: {
        type: string
        0: string
      }
    }
    [Tv2CasparcgTemplateSlotType.SPLIT_SCREEN]?: {
      display: Tv2CasparcgTemplateDisplayMode
      payload: {
        type: 'locators'
        style: object
      }
    }
  }
}

export enum Tv2CasparcgTemplateSlotType {
  FULLSCREEN_GRAPHICS = '250_full',
  PILOT_OVERLAY = '260_overlay',
  LOWER_THIRD = '450_lowerThird',
  IDENT = '650_ident',
  SPLIT_SCREEN = '850_dve',
}

export enum Tv2CasparcgTemplateDisplayMode {
  PROGRAM = 'program',
  PREVIEW = 'preview',
  HIDDEN = 'hidden',
}
