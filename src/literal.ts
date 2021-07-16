import { debugValue } from './runtypeError'
import { createFail, internalRuntype, Runtype } from './runtype'

type Literal = string | number | boolean
export type Meta = Readonly<{
  type: 'literal'
  isPure: true
  literal: Literal
}>

/**
 * A literal string, number, boolean or enum.
 */
export function literal<T extends string>(lit: T): Runtype<T>
export function literal<T extends number>(lit: T): Runtype<T>
export function literal<T extends boolean>(lit: T): Runtype<T>
export function literal(lit: Literal): Runtype<any> {
  // keep the literal as metadata on the runtype itself to be able to use it
  // in record intersections to determine the right record runtype
  const meta: Meta = { type: 'literal', isPure: true, literal: lit }
  return internalRuntype((v, failOrThrow) => {
    if (v === lit) {
      return lit
    }

    return createFail(failOrThrow, `expected a literal: ${debugValue(lit)}`, v)
  }, meta)
}

export function toSchema(runtype: Runtype<any>): string {
  const meta: Meta = (runtype as any).meta
  const lit = meta.literal

  return JSON.stringify(lit)
}
