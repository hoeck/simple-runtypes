import { createFail, setupInternalRuntype, Runtype } from './runtype'

/**
 * A union of string literals.
 */
export function stringLiteralUnion<V extends string[]>(
  ...values: V
): Runtype<V[number]> {
  const valuesIndex = new Set(values)

  return setupInternalRuntype(
    (v, failOrThrow) => {
      if (typeof v !== 'string' || !valuesIndex.has(v)) {
        return createFail(failOrThrow, `expected one of ${values}`, v)
      }

      return v
    },
    { isPure: true },
  )
}
