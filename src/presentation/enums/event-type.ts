export type EventType = RundownEventType | IngestEventType | ConfigurationEventType | ActionTriggerEventType

export enum RundownEventType {
  ACTIVATED = 'ACTIVATED',
  REHEARSE = 'REHEARSE',
  DEACTIVATED = 'DEACTIVATED',
  RESET = 'RESET',
  TAKEN = 'TAKEN',
  SET_NEXT = 'SET_NEXT',
  PART_INSERTED_AS_ON_AIR = 'PART_INSERTED_AS_ON_AIR',
  PART_INSERTED_AS_NEXT = 'PART_INSERTED_AS_NEXT',
  PIECE_INSERTED = 'PIECE_INSERTED',
  INFINITE_PIECES_UPDATED = 'INFINITE_PIECES_UPDATED',
  AUTO_NEXT_STARTED = 'AUTO_NEXT_STARTED'
}

export enum IngestEventType {
  RUNDOWN_CREATED = 'RUNDOWN_CREATED',
  RUNDOWN_UPDATED = 'RUNDOWN_UPDATED',
  RUNDOWN_DELETED = 'RUNDOWN_DELETED',
  SEGMENT_CREATED = 'SEGMENT_CREATED',
  SEGMENT_UPDATED = 'SEGMENT_UPDATED',
  SEGMENT_DELETED = 'SEGMENT_DELETED',
  SEGMENT_UNSYNCED = 'SEGMENT_UNSYNCED',
  PART_CREATED = 'PART_CREATED',
  PART_UPDATED = 'PART_UPDATED',
  PART_DELETED = 'PART_DELETED',
  PART_UNSYNCED = 'PART_UNSYNCED',
  MEDIA_CREATED = 'MEDIA_CREATED',
  MEDIA_UPDATED = 'MEDIA_UPDATED',
  MEDIA_DELETED = 'MEDIA_DELETED'
}

export enum ConfigurationEventType {
  SHELF_CONFIGURATION_UPDATED = 'SHELF_CONFIGURATION_UPDATED'
}

export enum ActionTriggerEventType {
  ACTION_TRIGGER_CREATED = 'ACTION_TRIGGER_CREATED',
  ACTION_TRIGGER_UPDATED = 'ACTION_TRIGGER_UPDATED',
  ACTION_TRIGGER_DELETED = 'ACTION_TRIGGER_DELETED'
}

export enum StatusMessageEventType {
  STATUS_MESSAGE = 'STATUS_MESSAGE'
}
