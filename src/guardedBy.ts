import {
  createFail,
  propagateFail,
  isFail,
  internalRuntype,
  Runtype,
} from './runtype'
import { ensureBaseValue } from './custom'

export type Meta = Readonly<{
  type: 'guardedBy'
  isPure: true
  baseRuntype?: Runtype<any>
}>

/**
 * A runtype based on a type guard
 */
// overload with base runtype
export function guardedBy<T, U>(
  typeGuard: (v: unknown, base: U) => v is T,
  baseRuntype: Runtype<U>,
): Runtype<T>
// overload without base runtype
export function guardedBy<T>(typeGuard: (v: unknown) => v is T): Runtype<T>
// implemetation
export function guardedBy<T>(
  typeGuard: (v: unknown, maybeBase?: any) => v is T,
  baseRuntype?: Runtype<any>,
): Runtype<T> {
  const meta: Meta = { type: 'guardedBy', isPure: true, baseRuntype }

  return internalRuntype((v, failOrThrow) => {
    const baseValue = ensureBaseValue(v, failOrThrow, baseRuntype)

    if (isFail(baseValue)) {
      return propagateFail(failOrThrow, baseValue, v)
    }

    const guardResult = baseRuntype
      ? typeGuard(v, baseValue)
      : typeGuard(baseValue)

    if (!guardResult) {
      return createFail(
        failOrThrow,
        'expected typeguard to return true',
        baseValue,
      )
    }

    return v
  }, meta)
}

export function toSchema(
  customRuntype: Runtype<any>,
  runtypeToSchema: (runtype: Runtype<any>) => string,
): string {
  const meta: Meta = (customRuntype as any).meta

  if (meta.baseRuntype) {
    return runtypeToSchema(meta.baseRuntype)
  }

  return 'any'
}
