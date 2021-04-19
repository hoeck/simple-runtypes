import {
  InternalRuntype,
  internalRuntype,
  isPureRuntype,
  Runtype,
  OptionalRuntype,
} from './runtype'

/**
 * Optional (?), only usable within `record`
 *
 * Marks the key its used on as optional, e.g.:
 *
 *    record({foo: optional(string())})
 *
 *    => {foo?: string}
 */
export function optional<A>(t: Runtype<A>): OptionalRuntype<A> {
  const isPure = isPureRuntype(t)

  const rt = internalRuntype((v, failOrThrow) => {
    if (v === undefined) {
      return undefined
    }

    return (t as InternalRuntype)(v, failOrThrow)
  }, isPure) as OptionalRuntype<A>

  return rt
}
