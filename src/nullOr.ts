import {
  InternalRuntype,
  internalRuntype,
  isPureRuntype,
  Runtype,
} from './runtype'

/**
 * Shortcut for a type or null.
 */
export function nullOr<A>(t: Runtype<A>): Runtype<A | null> {
  const isPure = isPureRuntype(t)

  return internalRuntype((v, failOrThrow) => {
    if (v === null) {
      return null
    }

    return (t as InternalRuntype)(v, failOrThrow)
  }, isPure)
}
