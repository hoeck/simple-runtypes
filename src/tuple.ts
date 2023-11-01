import {
  createFail,
  failSymbol,
  InternalRuntype,
  setupInternalRuntype,
  isFail,
  isPureRuntype,
  propagateFail,
  Runtype,
} from './runtype'

import { arrayRuntype } from './array'

// TODO: find a simple (not type-computationally expensive) generic tuple definition.
// atm the one that comes closest would be: https://github.com/Microsoft/TypeScript/issues/13298#issuecomment-675386981
// For now, keep the tuple definition simple as I don't see a usecase for big
// (>5elements) tuples. Most of the time I use them only for simple [lat, lon],
// [x,y,z] and other vectors.
/**
 * A tuple.
 */
export function tuple<A>(a: Runtype<A>): Runtype<[A]>
export function tuple<A, B>(a: Runtype<A>, b: Runtype<B>): Runtype<[A, B]>
export function tuple<A, B, C>(
  a: Runtype<A>,
  b: Runtype<B>,
  c: Runtype<C>,
): Runtype<[A, B, C]>
export function tuple<A, B, C, D>(
  a: Runtype<A>,
  b: Runtype<B>,
  c: Runtype<C>,
  d: Runtype<D>,
): Runtype<[A, B, C, D]>
export function tuple<A, B, C, D, E>(
  a: Runtype<A>,
  b: Runtype<B>,
  c: Runtype<C>,
  d: Runtype<D>,
  e: Runtype<E>,
): Runtype<[A, B, C, D, E]>
export function tuple(...types: Runtype<any>[]): Runtype<any> {
  const isPure = types.every((t) => isPureRuntype(t))

  return setupInternalRuntype<any>((v, failOrThrow) => {
    const a = (arrayRuntype as InternalRuntype)(v, failOrThrow)

    if (isFail(a)) {
      return propagateFail(failOrThrow, a, v)
    }

    if (a.length !== types.length) {
      return createFail(
        failOrThrow,
        'tuple array does not have the required length',
        v,
      )
    }

    const res: any[] = isPure ? a : new Array(a.length)

    for (let i = 0; i < types.length; i++) {
      const item = (types[i] as InternalRuntype)(a[i], failSymbol)

      if (isFail(item)) {
        return propagateFail(failOrThrow, item, v, i)
      }

      if (!isPure) {
        res[i] = item
      }
    }

    return res
  }, isPure)
}
