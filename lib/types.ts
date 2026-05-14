// When T is void (default), the success branch carries no data field.
// When T is a concrete type, data is required on the success branch — TypeScript
// can then narrow result.data without optional chaining after a success check.
export type ActionResult<T = void> =
  | (T extends void ? { success: true } : { success: true; data: T })
  | { success: false; error: string }
