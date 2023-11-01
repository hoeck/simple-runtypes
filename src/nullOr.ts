import { getInternalRuntype, Runtype, setupInternalRuntype } from './runtype'

/**
 * Shortcut for a type or null.
 */
export function nullOr<A>(t: Runtype<A>): Runtype<A | null> {
  const ti = getInternalRuntype(t)

  return setupInternalRuntype(
    (v, failOrThrow) => {
      if (v === null) {
        return null
      }

      return ti(v, failOrThrow)
    },
    { isPure: ti?.meta?.isPure },
  )
}
