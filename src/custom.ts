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

export type Meta = Readonly<{
  type: 'custom'
  isPure: false
  baseRuntype?: Runtype<any>
}>

function ensureBaseValue(
  v: unknown,
  failOrThrow: typeof failSymbol | undefined,
  baseRuntype?: Runtype<any>,
) {
  if (!baseRuntype) {
    return v
  }

  const baseValueOrFail = (baseRuntype as InternalRuntype)(v, failOrThrow)

  if (isFail(baseValueOrFail)) {
    return propagateFail(failOrThrow, baseValueOrFail, v)
  }

  return baseValueOrFail
}

/**
 * Construct a custom runtype from a validation function.
 */
// overload with base runtype
export function runtype<T, U>(
  fn: (v: U) => T | Fail,
  baseRuntype: Runtype<U>,
): Runtype<T>
// overload without base runtype
export function runtype<T>(fn: (v: unknown) => T | Fail): Runtype<T>
// implementation
export function runtype<T>(
  fn: (v: unknown) => T | Fail,
  baseRuntype?: Runtype<any>,
): Runtype<T> {
  const meta: Meta = { type: 'custom', isPure: false, baseRuntype }

  return internalRuntype<any>((v, failOrThrow) => {
    const baseValue = ensureBaseValue(v, failOrThrow, baseRuntype)

    if (isFail(baseValue)) {
      return propagateFail(failOrThrow, baseValue, v)
    }

    const res = fn(baseValue)

    if (isFail(res)) {
      return propagateFail(failOrThrow, res, baseValue)
    }

    return res
  }, meta)
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
export function use<T>(r: Runtype<T>, v: unknown): ValidationResult<T> {
  const result = ((r as unknown) as InternalRuntype)(v, failSymbol)

  if (isFail(result)) {
    // we don't know who is using the result (passing error up the stack or
    // consuming it with e.g. `st.getFormattedError`) so set the toplevel
    // value (will be overwritten in case we're passed up anyways)
    result.value = v

    return { ok: false, error: result }
  }

  return { ok: true, result }
}

export function toSchema(
  customRuntype: Runtype<any>,
  runtypeToSchema: (runtype: Runtype<any>) => string,
): string {
  const meta: Meta = (customRuntype as any).meta

  if (meta.baseRuntype) {
    return runtypeToSchema(meta.baseRuntype)
  }

  return 'any'
}
