import { debugValue } from './runtypeError'
import { createFail, internalRuntype, Runtype } from './runtype'

/**
 * A literal string, number, boolean or enum.
 */
export function literal<T extends string>(lit: T): Runtype<T>
export function literal<T extends number>(lit: T): Runtype<T>
export function literal<T extends boolean>(lit: T): Runtype<T>
export function literal(lit: string | number | boolean): Runtype<any> {
  const rt: any = internalRuntype((v, failOrThrow) => {
    if (v === lit) {
      return lit
    }

    return createFail(failOrThrow, `expected a literal: ${debugValue(lit)}`, v)
  }, true)

  // keep the literal as metadata on the runtype itself to be able to use it
  // in record intersections to determine the right record runtype
  rt.literal = lit

  return rt
}
