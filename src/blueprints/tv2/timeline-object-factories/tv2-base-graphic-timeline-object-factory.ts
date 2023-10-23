import { Tv2BlueprintConfiguration } from '../value-objects/tv2-blueprint-configuration'
import { Tv2GraphicsLayer } from '../value-objects/tv2-layers'
import { Tv2GraphicsTarget } from '../value-objects/tv2-graphics-target'
import { Tv2GraphicsActionManifest } from '../value-objects/tv2-action-manifest'

export abstract class Tv2BaseGraphicTimelineObjectFactory {
  protected abstract createFullGraphicTimelineObjectContent(blueprintConfiguration: Tv2BlueprintConfiguration, manifest: Tv2GraphicsActionManifest): object // Todo: create/find better return type.

  protected getLayerNameFromGraphicTarget(target: Tv2GraphicsTarget): string {
    switch (target) { // Todo: should the default case be here, throwing an 'UnexpectedCaseException'?
      case Tv2GraphicsTarget.WALL: return Tv2GraphicsLayer.GRAPHICS_WALL
      case Tv2GraphicsTarget.OVL: return Tv2GraphicsLayer.GRAPHICS_OVERLAY_PILOT
      case Tv2GraphicsTarget.FULL:
      case Tv2GraphicsTarget.TLF: return Tv2GraphicsLayer.GRAPHICS_PILOT
    }
  }

}