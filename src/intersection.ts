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
import type { Meta as RuntypeMeta } from './runtypeMeta'
import type { Meta as UnionMeta } from './union'

export type Meta = Readonly<{
  type: 'intersection'
  isPure: boolean
  aRuntype: Runtype<any>
  bRuntype: Runtype<any>
}>

// An intersection of two record runtypes
function recordIntersection2<A, B>(
  recordA: Runtype<A>,
  recordB: Runtype<B>,
): Runtype<A & B> {
  const fields: Record<string, Runtype<A & B>> = {}
  const aMeta: RuntypeMeta = (recordA as any).meta
  const bMeta: RuntypeMeta = (recordB as any).meta

  if (aMeta.type !== 'record' || bMeta.type !== 'record') {
    throw new Error()
  }

  const a = aMeta.fields
  const b = bMeta.fields

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
  const meta: UnionMeta = (u as any).meta
  const unionRuntypes = meta.unions

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
  const aMeta: RuntypeMeta = (a as any).meta
  const bMeta: RuntypeMeta = (b as any).meta

  if (aMeta.type === 'record' && bMeta.type === 'record') {
    return recordIntersection2(a, b)
  } else if (
    aMeta.type === 'union' &&
    aMeta.hasCommonKey &&
    bMeta.type === 'record'
  ) {
    return unionIntersection2(a, b)
  } else if (
    bMeta.type === 'union' &&
    bMeta.hasCommonKey &&
    aMeta.type === 'record'
  ) {
    return unionIntersection2(b, a)
  } else if (aMeta.type === 'record' || bMeta.type === 'record') {
    // Does such an intersection (e.g. string | {a: number} even make sense?
    // And how would you implement it?
    throw new RuntypeUsageError(
      'intersection2: cannot intersect a base type with a record',
    )
  } else {
    const meta: Meta = {
      type: 'intersection',
      isPure: isPureRuntype(a) && isPureRuntype(b),
      aRuntype: a,
      bRuntype: b,
    }

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
    }, meta)
  }
}

export function toSchema(
  runtype: Runtype<any>,
  runtypeToSchema: (runtype: Runtype<any>) => string,
): string {
  const meta: Meta = (runtype as any).meta
  const aSchema = runtypeToSchema(meta.aRuntype)
  const bSchema = runtypeToSchema(meta.bRuntype)

  return `${aSchema} & ${bSchema}`
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
