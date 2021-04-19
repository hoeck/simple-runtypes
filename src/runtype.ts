/**
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
 * Thrown if the api is misused.
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

// create a fail or raise the error exception if the called runtype was on top
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

// pass the fail up to the caller or, if on top, raise the error exception
export function propagateFail(
  failOrThrow: typeof failSymbol | undefined,
  failObj: Fail,
  topLevelValue?: unknown,
  key?: string | number,
): Fail {
  if (key !== undefined) {
    failObj.path.push(key)
  }

  if (failOrThrow === undefined) {
    // runtype check failed
    throw new RuntypeError(failObj.reason, topLevelValue, failObj.path)
  } else if (failOrThrow === failSymbol) {
    return failObj
  } else {
    throw new RuntypeUsageError(
      `failOrThrow must be undefined or the failSymbol, not ${JSON.stringify(
        failOrThrow,
      )}`,
    )
  }
}

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
 * Special runtype for use in record definitions to mark optional keys.
 */
export interface OptionalRuntype<T> {
  isOptionalRuntype: true
  (v: unknown): T
}

export type Unpack<T> = T extends Runtype<infer U>
  ? U
  : T extends OptionalRuntype<infer V>
  ? V
  : never

// force Typescript to boil down complex mapped types to a plain interface
export type Collapse<T> = T extends infer U ? { [K in keyof U]: U[K] } : never

const isPureRuntypeSymbol = Symbol('isPure')

// The internal runtype is one that receives an additional flag that
// determines whether the runtype should throw a RuntypeError or whether it
// should return a Fail up to the caller.
//
// Use this to:
//   * accumulate additional path data when unwinding a fail (propagateFail)
//   * have runtypes return a dedicated fail value to implement union over any
//     runtypes (isFail)
//
// Pass `true` as isPure to signal that this runtype is not modifying its
// value (checked with `isPureRuntype`
export function internalRuntype<T>(
  fn: (v: unknown, failOrThrow?: typeof failSymbol) => T,
  isPure?: boolean,
): Runtype<T> {
  if (isPure === true) {
    return Object.assign(fn, { isPure: isPureRuntypeSymbol })
  } else if (isPure === undefined || isPure === false) {
    return fn
  } else {
    throw new RuntypeUsageError(
      'expected "isPure" or undefined as the second argument',
    )
  }
}

/**
 * A pure runtype does not change its value.
 *
 * A non-pure runtype may return a changed value.
 * This is used to get rid of redundant object copying
 */
export function isPureRuntype(fn: Runtype<any>): boolean {
  return !!(fn as any).isPure
}

export type InternalRuntype = (
  v: unknown,
  failOrThrow: typeof failSymbol | undefined,
) => any

/**
 * Check whether a returned value is a failure.
 */
export function isFail(v: unknown): v is Fail {
  if (typeof v !== 'object' || !v) {
    return false
  }

  return (v as any)[failSymbol]
}
