// The enum values in this file is taking from Blueprints and still has to match those values until we control ingest.
export enum Tv2SourceLayer {
  CAMERA = 'studio0_camera',
}

export enum Tv2AtemLayer {
  PROGRAM = 'atem_me_program',
  LOOKAHEAD = 'atem_aux_lookahead'
}

export enum Tv2CasparCgLayer {
  CASPAR_CG_PLAYER_CLIP_PENDING = 'casparcg_player_clip_pending',
}

export enum Tv2SisyfosLayer {
  SISYFOS_SOURCE_CLIP_PENDING = 'sisyfos_source_clip_pending',
  SISYFOS_SOURCE_SERVER_A = 'sisyfos_source_server_a',
  SISYFOS_SOURCE_SERVER_B = 'sisyfos_source_server_b',

  // "Shared" layers according to Blueprints
  SISYFOS_STUDIO_MICS = 'sisyfos_group_studio_mics',
  SISYFOS_PERSISTED_LEVELS = 'sisyfos_persisted_levels',
}
