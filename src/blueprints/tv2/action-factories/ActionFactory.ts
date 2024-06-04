export abstract class ActionFactory {
  protected sanitizeStringForId(value: string): string {
    return value.replaceAll(/\s/g, '_').replaceAll('/', '_')
  }
}
