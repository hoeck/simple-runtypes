import { union } from './union'
import { record } from './record'
import {
  InternalRuntype,
  internalRuntype,
  isFail,
  isPureRuntype,
  propagateFail,
  Runtype,
  RuntypeUsageError,
} from './runtype'

// An intersection of two record runtypes
function recordIntersection2<A, B>(
  recordA: Runtype<A>,
  recordB: Runtype<B>,
): Runtype<A & B> {
  const fields: { [key: string]: Runtype<any> } = {}
  const a = (recordA as any).fields
  const b = (recordB as any).fields

  for (const k in { ...a, ...b }) {
    if (a[k] && b[k]) {
      fields[k] = intersection(a[k], b[k])
    } else if (a[k]) {
      fields[k] = a[k]
    } else if (b[k]) {
      fields[k] = b[k]
    } else {
      throw new RuntypeUsageError('recordIntersection2: invalid else')
    }
  }

  // results in a new record type
  return record<any>(fields)
}

// An intersection of a union with another type
function unionIntersection2<A, B>(
  u: Runtype<A>,
  b: Runtype<B>,
): Runtype<A & B> {
  const unionRuntypes: Runtype<any>[] = (u as any).unions

  if (
    !unionRuntypes ||
    !Array.isArray(unionRuntypes) ||
    !unionRuntypes.length
  ) {
    throw new RuntypeUsageError(
      'unionIntersection2: first argument is not a union type',
    )
  }

  // results in a new union (because the intersection distributes over the union)
  return union<Runtype<any>[]>(
    ...unionRuntypes.map((a) => intersection2<any, any>(a, b)),
  )
}

/**
 * An intersection of two runtypes.
 *
 * In case the intersection contains records or unions (of records), create a
 * completely new record or union runtype.
 */
function intersection2<A, B>(a: Runtype<A>, b: Runtype<B>): Runtype<A & B>
function intersection2(a: Runtype<any>, b: Runtype<any>): Runtype<any> {
  if ('fields' in a && 'fields' in b) {
    return recordIntersection2(a, b)
  } else if ('unions' in a && 'fields' in b) {
    return unionIntersection2(a, b)
  } else if ('unions' in b && 'fields' in a) {
    return unionIntersection2(b, a)
  } else if ('fields' in a || 'fields' in b) {
    // Does such an intersection (e.g. string | {a: number} even make sense?
    // And how would you implement it?
    throw new RuntypeUsageError(
      'intersection2: cannot intersect a base type with a record',
    )
  } else {
    const isPure = isPureRuntype(a) && isPureRuntype(b)

    return internalRuntype((v, failOrThrow) => {
      const valFromA = (a as InternalRuntype)(v, failOrThrow)
      const valFromB = (b as InternalRuntype)(v, failOrThrow)

      if (isFail(valFromB)) {
        return propagateFail(failOrThrow, valFromB, v)
      }

      if (isFail(valFromA)) {
        return propagateFail(failOrThrow, valFromA, v)
      }

      return valFromB // second runtype arg is preferred
    }, isPure)
  }
}

/**
 * An intersection of runtypes.
 */
export function intersection<A, B>(a: Runtype<A>, b: Runtype<B>): Runtype<A & B>
export function intersection<A, B, C>(
  a: Runtype<A>,
  b: Runtype<B>,
  c: Runtype<C>,
): Runtype<A & B & C>
export function intersection(...args: Runtype<any>[]): Runtype<any> {
  if (args.length === 2) {
    return intersection2(args[0], args[1])
  } else if (args.length === 3) {
    return intersection(intersection2(args[0], args[1]), args[2])
  } else {
    throw new RuntypeUsageError(
      `unsupported number of arguments ${args.length}`,
    )
  }
}
