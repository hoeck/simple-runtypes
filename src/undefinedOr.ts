import {
  InternalRuntype,
  setupInternalRuntype,
  isPureRuntype,
  Runtype,
} from './runtype'

/**
 * Shortcut for a type or undefined.
 */
export function undefinedOr<A>(t: Runtype<A>): Runtype<A | undefined> {
  const isPure = isPureRuntype(t)

  return setupInternalRuntype((v, failOrThrow) => {
    if (v === undefined) {
      return undefined
    }

    return (t as InternalRuntype)(v, failOrThrow)
  }, isPure)
}
