export interface UuidGenerator {
  generateUuid(): string
  validateUuid(uuid: string): boolean
}
