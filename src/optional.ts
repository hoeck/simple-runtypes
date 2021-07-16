import {
  InternalRuntype,
  internalRuntype,
  isPureRuntype,
  OptionalRuntype,
  Runtype,
} from './runtype'

export type Meta = Readonly<{
  type: 'optional'
  isPure: boolean
  optionalRuntype: Runtype<any>
}>

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
  const meta: Meta = {
    type: 'optional',
    isPure: isPureRuntype(t),
    optionalRuntype: t,
  }

  const rt = internalRuntype((v, failOrThrow) => {
    if (v === undefined) {
      return undefined
    }

    return (t as InternalRuntype)(v, failOrThrow)
  }, meta) as OptionalRuntype<A>

  return rt
}

export function toSchema(
  runtype: Runtype<any>,
  runtypeToSchema: (runtype: Runtype<any>) => string,
): string {
  const meta: Meta = (runtype as any).meta
  const { optionalRuntype } = meta

  return runtypeToSchema(optionalRuntype)
}
