import { integerRuntype } from './integer'
import {
  createFail,
  failSymbol,
  InternalRuntype,
  internalRuntype,
  isFail,
  propagateFail,
  Runtype,
} from './runtype'

export const stringAsIntegerRuntype = internalRuntype<number>(
  (v, failOrThrow) => {
    if (typeof v === 'string') {
      const parsedNumber = parseInt(v, 10)
      const n: number = (integerRuntype as InternalRuntype)(
        parsedNumber,
        failSymbol,
      )

      if (isFail(n)) {
        return propagateFail(failOrThrow, n, v)
      }

      // ensure that value did only contain that integer, nothing else
      // but also make '+1' === '1' and '-0' === '0'
      const vStringSansLeadingPlus =
        v === '-0' ? '0' : v[0] === '+' ? v.slice(1) : v

      if (n.toString() !== vStringSansLeadingPlus) {
        return createFail(
          failOrThrow,
          'expected string to contain only the safe integer, not additional characters, whitespace or leading zeros',
          v,
        )
      }

      return n
    }

    return createFail(
      failOrThrow,
      'expected a string that contains a safe integer',
      v,
    )
  },
)

/**
 * A string that is parsed as an integer.
 *
 * Parsing is strict, e.g leading/trailing whitespace or leading zeros will
 * result in an error. Exponential notation is not allowed. The resulting
 * number must be a safe integer (`Number.isSafeInteger`).
 * A leading '+' or '-' is allowed.
 *
 * Options:
 *
 *   min .. reject numbers smaller than that
 *   max .. reject number larger than that
 */
export function stringAsInteger(options?: {
  min?: number
  max?: number
}): Runtype<number> {
  if (!options) {
    return stringAsIntegerRuntype
  }

  const { min, max } = options

  return internalRuntype<number>((v, failOrThrow) => {
    const n = (stringAsIntegerRuntype as InternalRuntype)(v, failOrThrow)

    if (isFail(n)) {
      return propagateFail(failOrThrow, n, v)
    }

    if (min !== undefined && n < min) {
      return createFail(failOrThrow, `expected the integer to be >= ${min}`, v)
    }

    if (max !== undefined && n > max) {
      return createFail(failOrThrow, `expected the integer to be <= ${max}`, v)
    }

    return n
  })
}
