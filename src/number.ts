import { createFail, setupInternalRuntype, Runtype } from './runtype'

/**
 * A number. By default reject NaN and Infinity values.
 *
 * Options:
 *
 *   allowNaN .. allow NaN values
 *   allowInfinity .. allow positive and negative Infinity values
 *   min .. reject numbers smaller than that
 *   max .. reject numbers larger than that
 */
export function number(options?: {
  allowNaN?: boolean
  allowInfinity?: boolean
  min?: number
  max?: number
}): Runtype<number> {
  const { allowNaN, allowInfinity, min, max } = options || {}

  return setupInternalRuntype<number>((v, failOrThrow) => {
    if (typeof v !== 'number') {
      return createFail(failOrThrow, 'expected a number', v)
    }

    if (!allowNaN && isNaN(v)) {
      return createFail(failOrThrow, 'expected a number that is not NaN', v)
    }

    if (!allowInfinity && (v === Infinity || v === -Infinity)) {
      return createFail(failOrThrow, 'expected a finite number', v)
    }

    if (min !== undefined && v < min) {
      return createFail(failOrThrow, `expected number to be >= ${min}`, v)
    }

    if (max !== undefined && v > max) {
      return createFail(failOrThrow, `expected number to be <= ${max}`, v)
    }

    return v
  }, true)
}
