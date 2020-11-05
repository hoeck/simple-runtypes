import {
  createFail,
  Fail,
  failSymbol,
  internalRuntype,
  InternalRuntype,
  isFail,
  propagateFail,
  Runtype,
} from './runtype'

/**
 * Create a validation error for custom runtypes
 */
export function createError(msg: string): Fail {
  return createFail(failSymbol, msg)
}

/**
 * Construct a custom runtype from a validation function.
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
 * Explicit validation result containing the wrapped result or error.
 */
export type ValidationResult<T> =
  | { ok: true; result: T }
  | { ok: false; error: Fail }

/**
 * Execute a runtype but do not throw Errors
 *
 * Return a ValidationResult instead.
 * When its an Error, use `getFormattedError` on it to get a well formatted
 * message for logging or reporting.
 *
 * Useful when writing your own runtypes and when the bad performance of
 * exceptions and try-catch for error handling is of concern.
 */
export function useRuntype<T>(r: Runtype<T>, v: unknown): ValidationResult<T> {
  const result = (r as InternalRuntype)(v, failSymbol)

  if (isFail(result)) {
    // we don't know who is using the result (passing error up the stack or
    // consuming it with e.g. `st.getFormattedError`) so set the toplevel
    // value (will be overwritten in case we're passed up anyways)
    result.value = v

    return { ok: false, error: result }
  }

  return { ok: true, result }
}
