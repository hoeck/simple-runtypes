import {
  createFail,
  failSymbol,
  InternalRuntype,
  internalRuntype,
  isFail,
  isPureRuntype,
  propagateFail,
  Runtype,
} from './runtype'

export const arrayRuntype = internalRuntype<unknown[]>((v, failOrThrow) => {
  if (Array.isArray(v)) {
    return v
  }

  return createFail(failOrThrow, `expected an Array`, v)
}, true)

/**
 * An array of a given type.
 *
 * Options:
 *
 *   minLength .. reject arrays shorter than that
 *   maxLength .. reject arrays longer than that
 */
export function array<A>(
  a: Runtype<A>,
  options?: { maxLength?: number; minLength?: number },
): Runtype<A[]> {
  const { maxLength, minLength } = options || {}

  const isPure = isPureRuntype(a)

  return internalRuntype<any>((v, failOrThrow) => {
    const arrayValue = (arrayRuntype as InternalRuntype)(v, failOrThrow)

    if (isFail(arrayValue)) {
      return propagateFail(failOrThrow, arrayValue, v)
    }

    if (maxLength !== undefined && arrayValue.length > maxLength) {
      return createFail(
        failOrThrow,
        `expected the array to contain at most ${maxLength} elements`,
        v,
      )
    }

    if (minLength !== undefined && arrayValue.length < minLength) {
      return createFail(
        failOrThrow,
        `expected the array to contain at least ${minLength} elements`,
        v,
      )
    }

    // copy the unknown array in case the item runtype is not pure (we do not mutate anything in place)
    const res: A[] = isPure ? arrayValue : new Array(arrayValue.length)

    for (let i = 0; i < arrayValue.length; i++) {
      const item = (a as InternalRuntype)(arrayValue[i], failSymbol)

      if (isFail(item)) {
        return propagateFail(failOrThrow, item, v, i)
      }

      if (!isPure) {
        res[i] = item
      }
    }

    return res
  }, isPure)
}
