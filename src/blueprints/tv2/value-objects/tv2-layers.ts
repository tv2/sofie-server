// The enum values in this file is taken from Blueprints and still has to match those values until we control ingest.
export enum Tv2SourceLayer {
  CAMERA = 'studio0_camera',
  JINGLE = 'studio0_jingle',
  AUDIO_BED = 'studio0_audio_bed',
  GRAPHICS_ACTION_COMMAND = 'studio0_adlib_graphic_cmd',
  AUDIO_ACTION_COMMAND = 'studio0_sisyfos_adlibs',
  DOWNSTREAM_KEYER_ACTION_COMMAND = 'studio0_dsk', // Original one from Blueprint includes the number of the DSK, followed by '_cmd'.
  SELECTED_GRAPHICS_FULL = 'studio0_selected_graphicsFull',
  WALL_GRAPHIC = 'studio0_wall_graphics',
  TELEPHONE_GRAPHIC = 'studio0_graphicsTelefon',
  PILOT_GRAPHICS = 'studio0_pilot',
  PILOT_OVERLAY_GRAPHICS = 'studio0_pilotOverlay'
}

export enum Tv2GraphicsLayer {
  GRAPHICS_ACTIONS = 'graphic_adlibs',
  GRAPHICS_PILOT = 'graphic_pilot',
  GRAPHICS_OVERLAY_PILOT = 'graphic_overlay_pilot',
  GRAPHICS_WALL = 'graphic_wall',
}

export enum Tv2AtemLayer {
  PROGRAM = 'atem_me_program',
  CLEAN = 'atem_me_clean',
  LOOKAHEAD = 'atem_aux_lookahead',
  DOWNSTREAM_KEYER = 'atem_dsk'
}

export enum Tv2CasparCgLayer {
  PLAYER_CLIP_PENDING = 'casparcg_player_clip_pending',
}

export enum Tv2SisyfosLayer {
  SOURCE_CLIP_PENDING = 'sisyfos_source_clip_pending',
  SOURCE_SERVER_A = 'sisyfos_source_server_a',
  SOURCE_SERVER_B = 'sisyfos_source_server_b',

  STUDIO_MICS = 'sisyfos_group_studio_mics',
  PERSISTED_LEVELS = 'sisyfos_persisted_levels',
  AUDIO_BED = 'sisyfos_source_audiobed',
  RESYNCHRONIZE = 'sisyfos_resync'
}
