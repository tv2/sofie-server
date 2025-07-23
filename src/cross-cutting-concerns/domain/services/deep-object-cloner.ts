export interface DeepObjectCloner {
  deepClone<T>(object: T): T
}
