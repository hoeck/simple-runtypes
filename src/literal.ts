import { debugValue } from './runtypeError'
import { createFail, setupInternalRuntype, Runtype } from './runtype'

/**
 * A literal string, number, boolean or enum.
 */
export function literal<T extends string>(lit: T): Runtype<T>
export function literal<T extends number>(lit: T): Runtype<T>
export function literal<T extends boolean>(lit: T): Runtype<T>
export function literal(lit: string | number | boolean): Runtype<any> {
  return setupInternalRuntype(
    (v, failOrThrow) => {
      if (v === lit) {
        return lit
      }

      return createFail(
        failOrThrow,
        `expected a literal: ${debugValue(lit)}`,
        v,
      )
    },
    { isPure: true, literal: lit },
  )
}
