import { ActionManifest } from '../../../rundown-execution/domain/entities/action'
import { Tv2ActionManifestData } from './tv2-action-manifest-data'

export type Tv2ActionManifest<Tv2ActionManifestDataType extends Tv2ActionManifestData = Tv2ActionManifestData> = ActionManifest<Tv2ActionManifestDataType>
