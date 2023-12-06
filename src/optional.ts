import {
  getInternalRuntype,
  OptionalRuntype,
  Runtype,
  setupInternalRuntype,
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
  const ti = getInternalRuntype(t)

  return setupInternalRuntype(
    (v, failOrThrow) => {
      if (v === undefined) {
        return undefined
      }

      return ti(v, failOrThrow)
    },
    { isPure: ti.meta?.isPure, optional: true },
  ) as OptionalRuntype<A>
}
