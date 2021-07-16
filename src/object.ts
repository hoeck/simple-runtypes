import { createFail, internalRuntype, Runtype } from './runtype'

export type Meta = Readonly<{ type: 'object'; isPure: true }>
const meta: Meta = { type: 'object', isPure: true }

// cached object runtype
export const objectRuntype = internalRuntype<object>((v, failOrThrow) => {
  if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
    return v
  }

  return createFail(failOrThrow, 'expected an object', v)
}, meta)

/**
 * An object that is not an array.
 */
export function object(): Runtype<object> {
  return objectRuntype
}

export function toSchema(): string {
  return '{}'
}
