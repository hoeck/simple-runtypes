import {
  createFail,
  failSymbol,
  InternalRuntype,
  internalRuntype,
  isFail,
  isPureRuntype,
  propagateFail,
  Runtype,
} from './runtype'
import { any as anyRt } from './any'

export type Meta = Readonly<{
  type: 'array'
  isPure: boolean
  membersRuntype: Runtype<any>
}>

const anyArrayMeta: Meta = {
  type: 'array',
  isPure: true,
  membersRuntype: anyRt(),
}

export const arrayRuntype = internalRuntype<unknown[]>((v, failOrThrow) => {
  if (Array.isArray(v)) {
    return v
  }

  return createFail(failOrThrow, `expected an Array`, v)
}, anyArrayMeta)

/**
 * An array of a given type.
 *
 * Options:
 *
 *   minLength .. reject arrays shorter than that
 *   maxLength .. reject arrays longer than that
 */
export function array<A>(
  a: Runtype<A>,
  options?: { maxLength?: number; minLength?: number },
): Runtype<A[]> {
  const { maxLength, minLength } = options || {}

  const meta: Meta = {
    type: 'array',
    isPure: isPureRuntype(a),
    membersRuntype: a,
  }

  return internalRuntype<any>((v, failOrThrow) => {
    const arrayValue = (arrayRuntype as InternalRuntype)(v, failOrThrow)

    if (isFail(arrayValue)) {
      return propagateFail(failOrThrow, arrayValue, v)
    }

    if (maxLength !== undefined && arrayValue.length > maxLength) {
      return createFail(
        failOrThrow,
        `expected the array to contain at most ${maxLength} elements`,
        v,
      )
    }

    if (minLength !== undefined && arrayValue.length < minLength) {
      return createFail(
        failOrThrow,
        `expected the array to contain at least ${minLength} elements`,
        v,
      )
    }

    // copy the unknown array in case the item runtype is not pure (we do not mutate anything in place)
    const res: A[] = meta.isPure ? arrayValue : new Array(arrayValue.length)

    for (let i = 0; i < arrayValue.length; i++) {
      const item = (a as InternalRuntype)(arrayValue[i], failSymbol)

      if (isFail(item)) {
        return propagateFail(failOrThrow, item, v, i)
      }

      if (!meta.isPure) {
        res[i] = item
      }
    }

    return res
  }, meta)
}

export function toSchema(
  runtype: Runtype<any[]>,
  runtypeToSchema: (runtype: Runtype<any>) => string,
): string {
  const meta: Meta = (runtype as any).meta
  const memberSchema = runtypeToSchema(meta.membersRuntype)

  return `${memberSchema}[]`
}
