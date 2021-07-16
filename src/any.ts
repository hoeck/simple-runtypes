import { Runtype, internalRuntype } from './runtype'

export type Meta = Readonly<{ type: 'any'; isPure: true }>

const meta: Meta = { type: 'any', isPure: true }
const anyRuntype: any = internalRuntype((v) => {
  return v as any
}, meta)

/**
 * A value to check later.
 */
export function any(): Runtype<any> {
  return anyRuntype
}

export function toSchema(): string {
  return 'any'
}
