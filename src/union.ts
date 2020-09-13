import { objectRuntype } from './object'
import { getRecordFields } from './record'
import {
  createFail,
  Fail,
  failSymbol,
  InternalRuntype,
  internalRuntype,
  isFail,
  isPureRuntype,
  propagateFail,
  Runtype,
} from './runtype'
import { debugValue, RuntypeUsageError } from './runtypeError'

// A tagged union with type discriminant 'key'.
// Runtypes must be created with `record(...)` which contains type metadata to
// identify the literals in each record.
// Perform an efficient lookup of runtype functions by checking the
// discriminant key and using the runtype that matches it. This results 1
// runtype check vs man in the naive union check implementation.
function internalDiscriminatedUnion(
  key: string,
  runtypes: Runtype<any>[],
): Runtype<any> {
  const typeMap = new Map<string | number, Runtype<any>>()

  // build an index for fast runtype lookups by literal
  runtypes.forEach((t: any) => {
    const rt = t.fields[key]
    const tagValue = rt.literal

    if (tagValue === undefined) {
      throw new RuntypeUsageError(
        `broken record type definition, ${t}[${key}] is not a literal`,
      )
    }

    if (!(typeof tagValue === 'string' || typeof tagValue === 'number')) {
      throw new RuntypeUsageError(
        `broken record type definition, ${t}[${key}] must be a string or number, not ${debugValue(
          tagValue,
        )}`,
      )
    }

    // use `object` to also allow enums but they can't be used in types
    // for keys of indexes so we need any
    typeMap.set(tagValue, t)
  })

  const isPure = runtypes.every((t) => isPureRuntype(t))

  return internalRuntype((v, failOrThrow) => {
    const o: any = (objectRuntype as InternalRuntype)(v, failOrThrow)

    if (isFail(o)) {
      return propagateFail(failOrThrow, o, v)
    }

    const tagValue = o[key]
    const rt = typeMap.get(tagValue)

    if (rt === undefined) {
      return createFail(
        failOrThrow,
        `no Runtype found for discriminated union tag ${key}: ${debugValue(
          tagValue,
        )}`,
        v,
      )
    }

    return (rt as InternalRuntype)(v, failOrThrow)
  }, isPure)
}

// given a list of runtypes, return the name of the key that acts as the
// unique discriminating value across all runtypes
// return undefined if no such key exists
function findDiscriminatingUnionKey(
  runtypes: Runtype<any>[],
): string | undefined {
  const commonKeys = new Map<string, Set<string>>()

  for (let i = 0; i < runtypes.length; i++) {
    const r = runtypes[i]
    const fields = getRecordFields(r)

    if (!fields) {
      // not a record runtype -> no common tag key
      return
    }

    for (const f in fields) {
      const fieldRuntype = fields[f]
      const l = (fieldRuntype as any).literal

      if (l !== undefined) {
        // found a literal value, add it to the field
        // if we get a distinct literalruntype, we can use the optimized
        // index-accessed internalDiscriminatedUnion runtype
        if (!commonKeys.has(f)) {
          commonKeys.set(f, new Set())
        }

        commonKeys.get(f)?.add(l)
      }
    }
  }

  const possibleKeys: string[] = []

  commonKeys.forEach((val, key) => {
    // when the key has a unique value for each runtype it can be used as a discriminant
    if (val.size === runtypes.length) {
      possibleKeys.push(key)
    }
  })

  if (!possibleKeys.length) {
    return
  }

  // just use the first key (any key in possibleKeys would suffice)
  return possibleKeys[0]
}

// helper type to get the type of a runtype
type UnpackRuntypes<T extends Runtype<any>> = T extends Runtype<infer R>
  ? R
  : never

/**
 * A union of runtypes.
 */
export function union<V extends Runtype<any>[]>(
  ...runtypes: V
): Runtype<UnpackRuntypes<V[number]>> {
  if (!runtypes.length) {
    throw new RuntypeUsageError('no runtypes given to union')
  }

  // optimize: when the union is a discriminating union, find the
  // discriminating key and use it to efficiently validate the union
  const commonKey = findDiscriminatingUnionKey(runtypes)

  if (commonKey !== undefined) {
    return internalDiscriminatedUnion(commonKey, runtypes)
  }

  const isPure = runtypes.every((t) => isPureRuntype(t))

  // simple union validation: try all runtypes and use the first one that
  // doesn't fail
  return internalRuntype((v, failOrThrow) => {
    let lastFail: Fail | undefined

    for (let i = 0; i < runtypes.length; i++) {
      const val = (runtypes[i] as InternalRuntype)(v, failSymbol)

      if (!isFail(val)) {
        return val
      } else {
        lastFail = val
      }
    }

    return propagateFail(failOrThrow, lastFail as any, v)
  }, isPure)
}
