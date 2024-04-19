import { TriCasterLayer } from '../../timeline-state-resolver-types/tri-caster-type'

const ATEM_WIDTH: number = 32
const ATEM_HEIGHT: number = 18

const ATEM_CROP_LEFT_RIGHT_MAX_VALUE: number = 32000
const ATEM_CROP_TOP_BOTTOM_MAX_VALUE: number = 18000

const TRICASTER_HEIGHT: number = 2
const TRICASTER_WIDTH: number = TRICASTER_HEIGHT * (16 / 9)

export class AtemToTriCasterSplitScreenConverter {
  public convertPosition(x: number, y: number): NonNullable<TriCasterLayer['position']> {
    return {
      x: this.convertPositionX(x),
      y: this.convertPositionY(y)
    }
  }

  private convertPositionX(atemX: number): number {
    const positionPercentage = atemX / ATEM_WIDTH
    return (positionPercentage * TRICASTER_WIDTH) / 100
  }

  private convertPositionY(atemY: number): number {
    const positionPercentage = atemY / ATEM_HEIGHT
    return ((positionPercentage * 2) / 100) * -1
  }

  public convertScale(atemSize: number): NonNullable<TriCasterLayer['scale']> {
    return {
      x: atemSize / 1000,
      y: atemSize / 1000
    }
  }

  public convertCrop(crop: {
    cropped: boolean
    cropTop: number
    cropBottom: number
    cropLeft: number
    cropRight: number
  }): TriCasterLayer['crop'] {
    if (!crop.cropped || this.isAllCropZero(crop)) {
      return {
        down: 0,
        up: 0,
        left: 0,
        right: 0
      }
    }

    return {
      down: this.getPercentage(crop.cropBottom, ATEM_CROP_TOP_BOTTOM_MAX_VALUE),
      up: this.getPercentage(crop.cropTop, ATEM_CROP_TOP_BOTTOM_MAX_VALUE),
      left: this.getPercentage(crop.cropLeft, ATEM_CROP_LEFT_RIGHT_MAX_VALUE),
      right: this.getPercentage(crop.cropRight, ATEM_CROP_LEFT_RIGHT_MAX_VALUE)
    }
  }

  private isAllCropZero(crop: { cropTop: number; cropBottom: number; cropLeft: number; cropRight: number }): boolean {
    return crop.cropTop === 0 && crop.cropBottom === 0 && crop.cropLeft === 0 && crop.cropRight === 0
  }

  private getPercentage(part: number, whole: number): number {
    return (part / whole) * 100
  }
}
