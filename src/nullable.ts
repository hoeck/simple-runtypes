import {
  InternalRuntype,
  internalRuntype,
  isPureRuntype,
  Runtype,
} from './runtype'

/**
 * A type or null.
 */
export function nullable<A>(t: Runtype<A>): Runtype<null | A> {
  const isPure = isPureRuntype(t)

  return internalRuntype((v, failOrThrow) => {
    if (v === null) {
      return null
    }

    return (t as InternalRuntype)(v, failOrThrow)
  }, isPure)
}
