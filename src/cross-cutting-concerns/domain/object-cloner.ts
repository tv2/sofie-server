// TODO: Rename to DeepObjectCloner or the method should be deepClone as
//  it is important for the user of the contract to know whether it is a
//  deep copy or shallow copy.
export interface ObjectCloner {
  clone<T>(object: T): T
}
