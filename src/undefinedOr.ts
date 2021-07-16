import {
  InternalRuntype,
  internalRuntype,
  isPureRuntype,
  Runtype,
} from './runtype'

export type Meta = Readonly<{ type: 'undefinedOr'; isPure: boolean }>

/**
 * Shortcut for a type or undefined.
 */
export function undefinedOr<A>(t: Runtype<A>): Runtype<A | undefined> {
  const meta: Meta = { type: 'undefinedOr', isPure: isPureRuntype(t) }

  return internalRuntype((v, failOrThrow) => {
    if (v === undefined) {
      return undefined
    }

    return (t as InternalRuntype)(v, failOrThrow)
  }, meta)
}

export function toSchema(): string {
  return 'never'
}
