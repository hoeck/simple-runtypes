import {
  createFail,
  InternalRuntype,
  isFail,
  propagateFail,
  Runtype,
  setupInternalRuntype,
} from './runtype'

const stringRuntype = setupInternalRuntype<string>(
  (v, failOrThrow) => {
    if (typeof v === 'string') {
      return v
    }

    return createFail(failOrThrow, 'expected a string', v)
  },
  { isPure: true },
)

/**
 * A string.
 *
 * Options:
 *
 *   trim .. when true, remove leading and trailing spaces from the string
 *           trimming is applied before the optional length and regex checks
 *   minLength .. reject strings that are shorter than that
 *   maxLength .. reject strings that are longer than that
 *   match .. reject strings that do not match against provided RegExp
 */
export function string(options?: {
  trim?: boolean
  minLength?: number
  maxLength?: number
  match?: RegExp
}): Runtype<string> {
  if (!options) {
    return stringRuntype
  }

  const { minLength, maxLength, trim, match } = options

  const isPure = !trim // trim modifies the string

  return setupInternalRuntype(
    (v, failOrThrow) => {
      const r: string = (stringRuntype as InternalRuntype<any>)(v, failOrThrow)

      if (isFail(r)) {
        return propagateFail(failOrThrow, r, v)
      }

      const s = trim ? r.trim() : r

      if (minLength !== undefined && s.length < minLength) {
        return createFail(
          failOrThrow,
          `expected the string length to be at least ${minLength}`,
          v,
        )
      }

      if (maxLength !== undefined && s.length > maxLength) {
        return createFail(
          failOrThrow,
          `expected the string length to not exceed ${maxLength}`,
          v,
        )
      }

      if (match !== undefined && !match.test(s)) {
        return createFail(
          failOrThrow,
          `expected the string to match ${match}`,
          v,
        )
      }

      return s
    },
    { isPure },
  )
}
