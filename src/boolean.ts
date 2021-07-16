import { createFail, internalRuntype, Runtype } from './runtype'

export type Meta = Readonly<{
  type: 'boolean'
  isPure: true
}>

const meta: Meta = { type: 'boolean', isPure: true }
const booleanRuntype = internalRuntype<boolean>((v, failOrThrow) => {
  if (v === true || v === false) {
    return v
  }

  return createFail(failOrThrow, 'expected a boolean', v)
}, meta)

/**
 * A boolean.
 */
export function boolean(): Runtype<boolean> {
  return booleanRuntype
}

export function toSchema(): string {
  return 'boolean'
}
