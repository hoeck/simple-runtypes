import {
  InternalRuntype,
  internalRuntype,
  isPureRuntype,
  Runtype,
} from './runtype'

/**
 * Optional (?)
 */
export function optional<A>(t: Runtype<A>): Runtype<undefined | A> {
  const isPure = isPureRuntype(t)

  return internalRuntype((v, failOrThrow) => {
    if (v === undefined) {
      return undefined
    }

    return (t as InternalRuntype)(v, failOrThrow)
  }, isPure)
}
