import { RuntypeError, RuntypeUsageError } from './runtypeError'

/**
 * Symbol that identifies failed typechecks
 */
export const failSymbol: unique symbol = Symbol('SimpleRuntypesFail')

/**
 * Object to return internally if a typecheck failed
 */
export interface Fail {
  [failSymbol]: true
  reason: string
  path: (string | number)[]
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
    throw new RuntypeError(
      failObj.reason,
      topLevelValue,
      failObj.path.length ? failObj.path.reverse() : undefined,
    )
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
  // a function to check that v 'conforms' to type T
  (v: unknown): T
}

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
 * Construct a runtype from a validation function.
 */
export function runtype<T>(fn: (v: unknown) => T | Fail): Runtype<T> {
  return internalRuntype<any>((v, failOrThrow) => {
    const res = fn(v)

    if (isFail(res)) {
      return propagateFail(failOrThrow, res, v)
    }

    return res
  })
}

/**
 * Create a runtype validation error for custom runtypes
 */
export function fail(msg: string): Fail {
  return createFail(failSymbol, msg)
}

/**
 * Check whether a returned value is a failure.
 */
export function isFail(v: unknown): v is Fail {
  if (typeof v !== 'object' || !v) {
    return false
  }

  return failSymbol in v
}

/**
 * Use a runtype within a custom runtype
 */
export function useRuntype<T>(r: Runtype<T>, v: unknown): T | Fail {
  return (r as InternalRuntype)(v, failSymbol)
}
