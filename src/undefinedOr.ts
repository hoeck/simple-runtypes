import { getInternalRuntype, Runtype, setupInternalRuntype } from './runtype'

/**
 * Shortcut for a type or undefined.
 */
export function undefinedOr<A>(t: Runtype<A>): Runtype<A | undefined> {
  const ti = getInternalRuntype(t)

  return setupInternalRuntype(
    (v, failOrThrow) => {
      if (v === undefined) {
        return undefined
      }

      return ti(v, failOrThrow)
    },
    { isPure: ti.meta?.isPure },
  )
}
