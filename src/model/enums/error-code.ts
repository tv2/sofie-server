export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  LAST_PART_IN_RUNDOWN = 'LAST_PART_IN_RUNDOWN',
  LAST_PART_IN_SEGMENT = 'LAST_PART_IN_SEGMENT',
  LAST_SEGMENT_IN_RUNDOWN = 'LAST_SEGMENT_IN_RUNDOWN',
  END_OF_RUNDOWN = 'END_OF_RUNDOWN',
  DATABASE_NOT_CONNECTED = 'DATABASE_NOT_CONNECTED',
  MISCONFIGURATION = 'MISCONFIGURATION',
  NOT_ACTIVATED = 'NOT_ACTIVATED',
  ALREADY_EXIST = 'ALREADY_EXIST',
  ALREADY_ACTIVATED = 'ALREADY_ACTIVATED',
  RUNDOWN_IS_LOCKED = 'RUNDOWN_IS_LOCKED',
  RUNDOWN_IS_ACTIVE = 'RUNDOWN_IS_ACTIVE',
  DELETION_FAILED = 'DELETION_FAILED',
  UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION',
  UNEXPECTED_CASE = 'UNEXPECTED_CASE',
  NO_PART_IN_HISTORY = 'NO_PART_IN_HISTORY'
}
