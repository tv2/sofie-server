// The enum values in this file is taken from Blueprints and still has to match those values until we control ingest.
export enum Tv2SourceLayer {
  CAMERA = 'studio0_camera',
  JINGLE = 'studio0_jingle',
  AUDIO_BED = 'studio0_audio_bed',
  GRAPHICS_ACTION_COMMAND = 'studio0_adlib_graphic_cmd',
  AUDIO_ACTION_COMMAND = 'studio0_sisyfos_adlibs',
  DOWNSTREAM_KEYER_ACTION_COMMAND = 'studio0_dsk', // Original one from Blueprint includes the number of the DSK, followed by '_cmd'.
  DVE = 'dve',

  VIDEO_CLIP = 'studio0_selected_clip',
  SERVER_VOICE_OVER = 'studio0_selected_voiceover',
}

export enum Tv2GraphicsLayer {
  GRAPHICS_ACTIONS = 'graphic_adlibs',
  GRAPHICS_PILOT = 'graphic_pilot',
  GRAPHICS_LOCATORS = 'graphic_locators'
}

export enum Tv2AtemLayer {
  PROGRAM = 'atem_me_program',
  CLEAN_FEED = 'atem_me_clean',
  LOOKAHEAD = 'atem_aux_lookahead',
  DOWNSTREAM_KEYER = 'atem_dsk',
  DVE = 'atem_dve',
  DVE_BOXES = 'atem_dve_boxes'
}

export enum Tv2CasparCgLayer {
  PLAYER_CLIP_PENDING = 'casparcg_player_clip_pending',
  DVE_KEY = 'casparcg_dve_key',
  DVE_FRAME = 'casparcg_dve_frame'
}

export enum Tv2VideoClipLayer {
  VIDEO_CLIP_ENABLE_PENDING = 'server_enable_pending'
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
