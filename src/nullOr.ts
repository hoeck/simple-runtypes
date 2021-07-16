import {
  InternalRuntype,
  internalRuntype,
  isPureRuntype,
  Runtype,
} from './runtype'

export type Meta = Readonly<{
  type: 'nullOr'
  isPure: boolean
  orRuntype: Runtype<any>
}>

/**
 * Shortcut for a type or null.
 */
export function nullOr<A>(t: Runtype<A>): Runtype<A | null> {
  const meta: Meta = {
    type: 'nullOr',
    isPure: isPureRuntype(t),
    orRuntype: t,
  }

  return internalRuntype((v, failOrThrow) => {
    if (v === null) {
      return null
    }

    return (t as InternalRuntype)(v, failOrThrow)
  }, meta)
}

export function toSchema(
  runtype: Runtype<any>,
  runtypeToSchema: (runtype: Runtype<any>) => string,
): string {
  const meta: Meta = (runtype as any).meta
  const orSchema = runtypeToSchema(meta.orRuntype)

  return `null | ${orSchema}`
}
