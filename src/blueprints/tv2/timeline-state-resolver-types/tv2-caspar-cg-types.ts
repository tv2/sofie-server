export interface Tv2CasparCgTemplateData {
  display: Tv2CasparCgTemplateDisplayMode
  partialUpdate: boolean
  slots: {
    [Tv2CasparCgTemplateSlotType.FULLSCREEN_GRAPHICS]?: {
      display: Tv2CasparCgTemplateDisplayMode
      payload: {
        type: 'still'
        url: string,
        noAnimation: boolean
      }
    }
    [Tv2CasparCgTemplateSlotType.PILOT_OVERLAY]?: {
      display: Tv2CasparCgTemplateDisplayMode,
      payload: {
        type: string
        url: string
        noAnimation: boolean
      }
    }
    [Tv2CasparCgTemplateSlotType.LOWER_THIRD]?: {
      display: Tv2CasparCgTemplateDisplayMode
      payload: {
        type: string
        [locatorIndex: number]: string
      }
    }
    [Tv2CasparCgTemplateSlotType.IDENT]?: {
      display: Tv2CasparCgTemplateDisplayMode
      payload: {
        type: string
        0: string
      }
    }
    [Tv2CasparCgTemplateSlotType.SPLIT_SCREEN]?: {
      display: Tv2CasparCgTemplateDisplayMode
      payload: {
        type: 'locators'
        style: object
      }
    }
  }
}

export enum Tv2CasparCgTemplateSlotType {
  FULLSCREEN_GRAPHICS = '250_full',
  PILOT_OVERLAY = '260_overlay',
  LOWER_THIRD = '450_lowerThird',
  IDENT = '650_ident',
  SPLIT_SCREEN = '850_dve',
}

export enum Tv2CasparCgTemplateDisplayMode {
  PROGRAM = 'program',
  PREVIEW = 'preview',
  HIDDEN = 'hidden',
}
