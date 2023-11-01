/**
 * Runtype
 *
 * Just a function. The returned value may be a copy of v, depending on the
 * runtypes implementation.
 */
export interface Runtype<T> {
  /**
   * A function to check that v 'conforms' to type T
   *
   * By default, Raises a RuntypeError if the check fails.
   * With `useRuntype(runtype, value)` it will return a `ValidationResult` instead.
   */
  (v: unknown): T
}

/**
 * Helper for use in record definitions to mark optional keys.
 */
export interface OptionalRuntype<T> {
  isOptionalRuntype: true
  (v: unknown): T
}

/**
 * Helper to build record types with optionals
 */
export type Unpack<T> = T extends Runtype<infer U>
  ? U
  : T extends OptionalRuntype<infer V>
  ? V
  : never

/**
 * Helper to Force Typescript to boil down complex types to a plain interface
 */
export type Collapse<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

/**
 * Error with additional information
 *
 * Thrown if the input does not match the runtype.
 *
 * Use `getFormattedErrorPath`, `getFormattedErrorValue` and
 * `getFormattedError` to convert path and value to a loggable string.
 */
export class RuntypeError extends Error {
  // implements RuntypeErrorInfo
  readonly path: (string | number)[]
  readonly value: any
  readonly reason: string

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(reason: string, value: any, path: (string | number)[]) {
    super(reason)

    this.name = 'RuntypeError'
    this.reason = reason
    this.path = path
    this.value = value
  }
}

/**
 * Thrown if the api is misused
 */
export class RuntypeUsageError extends Error {}

/**
 * Symbol that identifies failed typechecks
 */
export const failSymbol: unique symbol = Symbol('SimpleRuntypesFail')

/**
 * Object to return internally if a typecheck failed
 *
 * This is used internally to avoid creating garbage for each runtype
 * validation call.
 */
export interface Fail {
  [failSymbol]: true // marker to be able to distinguish Fail from other objects
  reason: string
  path: (string | number)[]
  value?: any
}

/**
 * Create a fail or raise the error exception if the called runtype was on top
 */
export function createFail(
  failOrThrow: typeof failSymbol | undefined,
  msg: string,
  topLevelValue?: unknown,
): any {
  if (failOrThrow === undefined) {
    // runtype check failed
    throw new RuntypeError(msg, topLevelValue, [])
  } else if (failOrThrow === failSymbol) {
    // runtype check failed but it should not throw an exception bc its called
    // internally e.g. as part of a union or because we want to add debug info
    // while unrolling the stack
    return {
      [failSymbol]: true,
      reason: msg,
      path: [],
      value: undefined,
    }
  } else {
    throw new RuntypeUsageError(
      `failOrThrow must be undefined or the failSymbol, not ${JSON.stringify(
        failOrThrow,
      )}`,
    )
  }
}

/**
 * Pass the fail up to the caller or, if on top, raise the error exception
 */
export function propagateFail(
  failOrThrow: typeof failSymbol | undefined,
  failObj: Fail,
  topLevelValue?: unknown,
  key?: string | number,
): Fail {
  // while unwinding the stack, add path information
  if (key !== undefined) {
    failObj.path.push(key)
  }

  if (failOrThrow === undefined) {
    // toplevel runtype invocation: throw
    throw new RuntypeError(failObj.reason, topLevelValue, failObj.path)
  } else if (failOrThrow === failSymbol) {
    // either non-throw invocation or not at the toplevel
    return failObj
  } else {
    // some passed an invalid second argument to the runtype
    throw new RuntypeUsageError(
      `do not pass a second argument to a runtype - failOrThrow must be undefined or the failSymbol, not ${JSON.stringify(
        failOrThrow,
      )}`,
    )
  }
}

/**
 * Check whether a returned value is a failure
 */
export function isFail(v: unknown): v is Fail {
  if (typeof v !== 'object' || !v) {
    return false
  }

  return (v as any)[failSymbol]
}

/**
 * Internals of a runtype.
 *
 * Used to implement combinators (pick, omit, intersection, ...) and
 * optimizations.
 */
export interface RuntypeMetadata {
  // fields of a record runtype
  // Used by combinators to build new records.
  fields?: Record<string, InternalRuntype<any>>

  // true if the record runtype ignores additional fields
  // Used by combinators to preserve non-strictness.
  isNonStrict?: boolean

  // true if the runtype (after the check) does return the passed value as-is.
  // Nested pure runtypes can save allocations by just passing the value back
  // after a successful check. Impure runtypes must always copy its values to
  // be safe.
  // Container runtypes made of impure elements must also copy the whole
  // container.
  isPure?: boolean

  // the elements of a union runtype, used to implement distribution of union
  // intersections
  unions?: InternalRuntype<any>[]

  // literal value used to identify tagged union members
  literal?: string | boolean | number
}

/**
 * The internal runtype is one that receives an additional flag that
 * determines whether the runtype should throw a RuntypeError or whether it
 * should return a Fail up to the caller.
 *
 * Use this to:
 *   * accumulate additional path data when unwinding a fail (propagateFail)
 *   * have runtypes return a dedicated fail value to implement union over any
 *     runtypes (isFail)
 */
export interface InternalRuntype<T> {
  (v: unknown, failOrThrow?: typeof failSymbol): T | Fail
  meta?: RuntypeMetadata
}

export type InternalRuntypeOf<T> = T extends Runtype<infer X>
  ? InternalRuntype<X>
  : never

/**
 * Cast to an internal runtype.
 */
export function getInternalRuntype<T>(rt: Runtype<T>): InternalRuntype<T> {
  return rt as InternalRuntype<T>
}

/**
 * Setup the internal runtype with metadata.
 */
export function setupInternalRuntype<T>(
  fn: InternalRuntype<T>,
  meta?: RuntypeMetadata,
): Runtype<T> {
  if (!meta) {
    return fn as Runtype<T>
  }

  return Object.assign(fn, { meta }) as Runtype<T>
}

/**
 * Return runtype metadata.
 *
 * Not all runtypes have them set (e.g. user-defined ones).
 */
export function getRuntypeMetadata(rt: Runtype<any>): RuntypeMetadata {
  return (rt as any)?.meta || {}
}
