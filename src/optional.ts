import {
  InternalRuntype,
  internalRuntype,
  isPureRuntype,
  Runtype,
} from './runtype'

// Symbol to be used as marker to be found in record
const undefinedSymbol = Symbol('undefined')
export type UndefinedSymbol = typeof undefinedSymbol

/**
 * Optional (?)
 */
export function optional<A>(
  t: Runtype<A>,
): Runtype<undefined | A | UndefinedSymbol> {
  const isPure = isPureRuntype(t)

  return internalRuntype((v, failOrThrow) => {
    if (v === undefined) {
      return undefined
    }

    return (t as InternalRuntype)(v, failOrThrow)
  }, isPure)
}
