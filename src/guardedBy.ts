import { createFail, internalRuntype, Runtype } from './runtype'

export type Meta = Readonly<{ type: 'guardedBy'; isPure: true }>

const meta: Meta = { type: 'guardedBy', isPure: true }

/**
 * A runtype based on a type guard
 */
export function guardedBy<F>(typeGuard: (v: unknown) => v is F): Runtype<F> {
  return internalRuntype((v, failOrThrow) => {
    if (!typeGuard(v)) {
      return createFail(failOrThrow, 'expected typeguard to return true', v)
    }

    return v
  }, meta)
}

export function toSchema(): string {
  return 'any'
}
