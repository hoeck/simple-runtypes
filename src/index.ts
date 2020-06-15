/// infrastructure

// context variables:

// the current processed key in object to provide better error messages
let _currentKey: string | undefined // TODO: remove that and add the current key on failure

// current key accessor
function currentKey() {
  if (!_currentKey) {
    return ''
  }

  return ` (key: ${_currentKey})`
}

function debugValue(v: any, maxLength: number = 128) {
  let s: string

  if (v === undefined) {
    return 'undefined'
  }

  try {
    s = JSON.stringify(v)
  } catch {
    s = `${v}`
  }

  if (s.length > maxLength) {
    return s.slice(maxLength - 1) + '\u2026'
  } else {
    return s
  }
}

export class RuntypeError extends Error {}

export const runtypeFailSymbol: unique symbol = Symbol('SimpleRuntypesFail')

export interface Fail {
  [runtypeFailSymbol]: true
  reason?: string
}

function fail(msg: string, value: any): Fail {
  return {
    [runtypeFailSymbol]: true,
    reason: `${msg}, value: ${debugValue(value)}${currentKey()}`,
  }
}

export function isFail(v: unknown): v is Fail {
  if (typeof v !== 'object' || !v) {
    return false
  }

  return runtypeFailSymbol in v
}

/**
 * Runtype
 */
export interface Runtype<T> {
  // a function to check that v 'conforms' to type T
  (v: unknown): T | Fail
  check(value: unknown): T
}

/**
 * Runtype that is a literal
 */
export interface LiteralRuntype<T> extends Runtype<T> {
  literal: T
}

/**
 * Runtype to help with record runtype fns (discriminatedUnion, pick, ...)
 */
export interface RecordRuntype<T> extends Runtype<T> {
  fields: { [key: string]: any }
}

/**
 * Construct a runtype from a validation function.
 */
export function runtype<T>(fn: (v: unknown) => T | Fail): Runtype<T> {
  const rt: Runtype<T> = <any>fn

  rt.check = (v: unknown) => {
    const res = fn(v)

    if (isFail(res)) {
      throw new RuntypeError(res.reason)
    }

    return res
  }

  return rt
}

/// basic types

export const numberRuntype = runtype((v) => {
  if (typeof v === 'number') {
    return v
  }

  return fail('expected a number', v)
})

export const nonNaNnumberRuntype = runtype((v) => {
  if (typeof v === 'number') {
    if (isNaN(v)) {
      return fail('expected a number and not NaN', v)
    }

    return v
  }

  return fail('expected a number', v)
})

/**
 * A number.
 *
 * Explicitly pass true for allowNaN to not fail on NaNs
 */
export function number(allowNaN: boolean = false): Runtype<number> {
  return allowNaN ? numberRuntype : nonNaNnumberRuntype
}

export const integerRuntype = runtype((v: unknown) => {
  if (
    typeof v === 'number' &&
    Number.isInteger(v) &&
    -Number.MAX_SAFE_INTEGER <= v &&
    v <= Number.MAX_SAFE_INTEGER
  ) {
    return v
  }

  return fail('expected an integer', v)
})

/**
 * A number without decimals and within +-MAX_SAFE_INTEGER.
 */
export function integer(): Runtype<number> {
  return integerRuntype
}

export const stringAsIntegerRuntype = runtype((v) => {
  if (typeof v === 'string') {
    const parsedNumber = parseInt(v, 10)
    const n = integerRuntype(parsedNumber)

    if (isFail(n)) {
      return n
    }

    // ensure that value did only contain that integer, nothing else
    if (n.toString() !== v) {
      return fail(
        'expected string to contain only the integer, not additional characters',
        v,
      )
    }

    return n
  }

  return fail('expected a string that contains an integer', v)
})

/**
 * A string that contains an integer.
 */
export function stringAsInteger(): Runtype<number> {
  return stringAsIntegerRuntype
}

const booleanRuntype = runtype((v) => {
  if (v === true || v === false) {
    return v
  }

  return fail('expected a boolean', v)
})

/**
 * A boolean.
 */
export function boolean(): Runtype<boolean> {
  return booleanRuntype
}

const stringRuntype = runtype((v) => {
  if (typeof v === 'string') {
    return v
  }

  return fail('expected a string', v)
})

/**
 * A string.
 */
export function string(): Runtype<string> {
  return stringRuntype
}

/**
 * A literal (string | number | boolean).
 */
export function literal<T extends string>(literal: T): LiteralRuntype<T>
export function literal<T extends number>(literal: T): LiteralRuntype<T>
export function literal<T extends boolean>(literal: T): LiteralRuntype<T>
export function literal(
  literal: string | number | boolean,
): LiteralRuntype<any> {
  const rt: any = runtype((v: unknown) => {
    if (v === literal) {
      return literal
    }

    return fail(`expected a literal: ${debugValue(literal)}`, v)
  })

  rt.literal = literal

  return rt
}

/**
 * A value to check later.
 */
export function unknown(): Runtype<unknown> {
  return runtype((v) => {
    return v
  })
}

/**
 * A value to check later.
 */
export function any(): Runtype<any> {
  return runtype((v) => {
    return v as any
  })
}

/**
 * A value to ignore (typed as unknown and always set to undefined).
 */
export function ignore(): Runtype<unknown> {
  return runtype((_v: unknown) => {
    return undefined as unknown
  })
}

type EnumObject = { [key: string]: string | number }

/**
 * Any value defined in the enumObject.
 */
export function enumValue<T extends EnumObject, S extends keyof T>(
  enumObject: T,
): Runtype<T[S]> {
  return runtype((v) => {
    // use the fast reverse lookup of number enums to check whether v is a
    // value of the enum
    if (typeof v === 'number' && (enumObject as any)[v as any] !== undefined) {
      return (v as unknown) as T[S]
    }

    if (Object.values(enumObject).indexOf(v as any) !== -1) {
      return v as T[S]
    }

    return fail(
      `expected a value that belongs to the enum ${debugValue(enumObject)}`,
      v,
    )
  })
}

/**
 * A union of string literals.
 */
export function stringLiteralUnion<A extends string>(a: A): Runtype<A>
export function stringLiteralUnion<A extends string, B extends string>(
  a: A,
  b: B,
): Runtype<A | B>
export function stringLiteralUnion<
  A extends string,
  B extends string,
  C extends string
>(a: A, b: B, c: C): Runtype<A | B | C>
export function stringLiteralUnion<
  A extends string,
  B extends string,
  C extends string,
  D extends string
>(a: A, b: B, c: C, d: D): Runtype<A | B | C | D>
export function stringLiteralUnion<
  A extends string,
  B extends string,
  C extends string,
  D extends string,
  E extends string
>(a: A, b: B, c: C, d: D, e: E): Runtype<A | B | C | D | E>
export function stringLiteralUnion<
  A extends string,
  B extends string,
  C extends string,
  D extends string,
  E extends string,
  F extends string
>(a: A, b: B, c: C, d: D, e: E, f: F): Runtype<A | B | C | D | E | F>
export function stringLiteralUnion<
  A extends string,
  B extends string,
  C extends string,
  D extends string,
  E extends string,
  F extends string,
  G extends string
>(a: A, b: B, c: C, d: D, e: E, f: F, g: G): Runtype<A | B | C | D | E | F | G>
export function stringLiteralUnion(...values: string[]): any {
  const valuesIndex = new Set(values)

  return runtype((v: unknown) => {
    if (typeof v !== 'string' || !valuesIndex.has(v)) {
      return fail(`expected one of ${values}`, v)
    }

    return v
  })
}

/// containers

export const arrayRuntype = runtype((v: unknown): unknown[] | Fail => {
  if (Array.isArray(v)) {
    return v
  }

  return fail(`expected an Array`, v)
})

/**
 * An array.
 */
export function array<A>(a: Runtype<A>): Runtype<A[]> {
  return runtype((v: unknown) => {
    const arrayValue = arrayRuntype(v)

    if (isFail(arrayValue)) {
      return arrayValue
    }

    const res: A[] = new Array(arrayValue.length)

    for (let i in arrayValue) {
      const item = a(arrayValue[i])

      if (isFail(item)) {
        return item
      }

      res[i] = item
    }

    return res
  })
}

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
  return runtype((v: unknown) => {
    const a = arrayRuntype(v)

    if (isFail(a)) {
      return a
    }

    if (a.length !== types.length) {
      return fail('array does not have the required length', v)
    }

    const res: any[] = []

    for (let i in types) {
      const item = types[i](a[i])

      if (isFail(item)) {
        return item
      }

      res.push(item)
    }

    return res
  })
}

// cached object runtype
export const objectRuntype = runtype((v: unknown) => {
  if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
    return v
  }

  return fail('expected an object', v)
})

/**
 * An object that is not an array.
 */
export function object(): Runtype<object> {
  return objectRuntype
}

/**
 * An index with string keys.
 */
export function stringIndex<T>(t: Runtype<T>): Runtype<{ [key: string]: T }> {
  return runtype((v) => {
    const o: any = objectRuntype(v)

    if (isFail(o)) {
      return o
    }

    const res: { [key: string]: T } = {}

    for (let k in o) {
      const value = t(o[k])

      if (isFail(value)) {
        return value
      }

      res[k] = value
    }

    return res
  })
}

/**
 * An index with number keys.
 */
export function numberIndex<T>(t: Runtype<T>): Runtype<{ [key: number]: T }> {
  return runtype((v) => {
    const o: any = objectRuntype(v)

    if (isFail(o)) {
      return o
    }

    const res: { [key: number]: T } = {}

    for (let k in o) {
      const key = stringAsIntegerRuntype(k)

      if (isFail(key)) {
        return key
      }

      const value = t(o[key])

      if (isFail(value)) {
        return value
      }

      res[key] = value
    }

    return res
  })
}

/**
 * An object with defined keys and values.
 */
export function record<T extends object>(
  typemap: { [K in keyof T]: Runtype<T[K]> },
): RecordRuntype<T> {
  const rt: RecordRuntype<T> = <any>runtype((v: unknown) => {
    const o: any = objectRuntype(v)

    if (isFail(o)) {
      return o
    }

    // TODO: optimize allocations: only create a copy if any of the key
    // runtypes return a different object - otherwise return value as is
    const res = {} as T

    // context vars
    const currentKey = _currentKey

    for (const k in typemap) {
      _currentKey = k

      const value = typemap[k](o[k])

      if (isFail(value)) {
        return value
      }

      res[k] = value
    }

    _currentKey = currentKey

    const unknownKeys = Object.keys(o).filter((k) => !res.hasOwnProperty(k))

    if (unknownKeys.length) {
      return fail('invalid keys in record', unknownKeys)
    }

    return res
  })

  rt.fields = {}

  for (const k in typemap) {
    rt.fields[k] = typemap[k]
  }

  return rt
}

/**
 * A runtype based on a type guard
 */
export function guardedBy<F>(typeGuard: (v: unknown) => v is F): Runtype<F> {
  return runtype((v: unknown) => {
    if (!typeGuard(v)) {
      return fail('expected typeguard to return true', v)
    }

    return v
  })
}

/**
 * Optional (?)
 */
export function optional<A>(t: Runtype<A>): Runtype<undefined | A> {
  return runtype((v: unknown) => {
    if (v === undefined) {
      return undefined
    }

    return t(v)
  })
}

/**
 * A type or null.
 */
export function nullable<A>(t: Runtype<A>): Runtype<null | A> {
  return runtype((v: unknown) => {
    if (v === null) {
      return null
    }

    return t(v)
  })
}

/**
 * A tagged union with type discriminant 'key'.
 *
 * Runtypes must be created with `record(...)` which contains type metadata to
 * perform an efficient lookup of runtype functions.
 */
export function discriminatedUnion<A>(
  key: keyof A,
  a: RecordRuntype<A>,
): RecordRuntype<A>
export function discriminatedUnion<A, B>(
  key: keyof (A | B),
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
): RecordRuntype<A | B>
export function discriminatedUnion<A, B, C>(
  key: keyof (A | B | C),
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
  c: RecordRuntype<C>,
): RecordRuntype<A | B | C>
export function discriminatedUnion<A, B, C, D>(
  key: keyof (A | B | C | D),
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
  c: RecordRuntype<C>,
  d: RecordRuntype<D>,
): Runtype<A | B | C | D>
export function discriminatedUnion<A, B, C, D, E>(
  key: keyof (A | B | C | D | E),
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
  c: RecordRuntype<C>,
  d: RecordRuntype<D>,
  e: RecordRuntype<E>,
): Runtype<A | B | C | D | E>
export function discriminatedUnion<A, B, C, D, E, F>(
  key: keyof (A | B | C | D | F),
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
  c: RecordRuntype<C>,
  d: RecordRuntype<D>,
  e: RecordRuntype<E>,
  f: RecordRuntype<F>,
): Runtype<A | B | C | D | E | F>
export function discriminatedUnion<A, B, C, D, E, F, G>(
  key: keyof (A | B | C | D | F | G),
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
  c: RecordRuntype<C>,
  d: RecordRuntype<D>,
  e: RecordRuntype<E>,
  f: RecordRuntype<F>,
  g: RecordRuntype<G>,
): Runtype<A | B | C | D | E | F | G>
export function discriminatedUnion<A, B, C, D, E, F, G, H>(
  key: keyof (A | B | C | D | F | G | H),
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
  c: RecordRuntype<C>,
  d: RecordRuntype<D>,
  e: RecordRuntype<E>,
  f: RecordRuntype<F>,
  g: RecordRuntype<G>,
  h: RecordRuntype<H>,
): Runtype<A | B | C | D | E | F | G | H>
export function discriminatedUnion<A, B, C, D, E, F, G, H, I>(
  key: keyof (A | B | C | D | F | G | H | I),
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
  c: RecordRuntype<C>,
  d: RecordRuntype<D>,
  e: RecordRuntype<E>,
  f: RecordRuntype<F>,
  g: RecordRuntype<G>,
  h: RecordRuntype<H>,
  i: RecordRuntype<I>,
): Runtype<A | B | C | D | E | F | G | H | I>
export function discriminatedUnion<A, B, C, D, E, F, G, H, I, J>(
  key: keyof (A | B | C | D | F | G | H | I | J),
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
  c: RecordRuntype<C>,
  d: RecordRuntype<D>,
  e: RecordRuntype<E>,
  f: RecordRuntype<F>,
  g: RecordRuntype<G>,
  h: RecordRuntype<H>,
  i: RecordRuntype<I>,
  j: RecordRuntype<J>,
): Runtype<A | B | C | D | E | F | G | H | I | J>
export function discriminatedUnion(...args: any[]): Runtype<any> {
  const key: string = args[0]
  const runtypes: RecordRuntype<any>[] = args.slice(1)
  const typeMap = new Map<string | number, Runtype<any>>()

  // build an index for fast runtype lookups by literal
  runtypes.forEach((t) => {
    const runtype = t.fields[key]
    const tagValue = runtype.literal

    if (tagValue === undefined) {
      throw new Error(
        `broken record type definition, ${t}[${key}] is not a literal`,
      )
    }

    if (!(typeof tagValue === 'string' || typeof tagValue === 'number')) {
      throw new Error(
        `broken record type definition, ${t}[${key}] must be a string or number, not ${debugValue(
          tagValue,
        )}`,
      )
    }

    // use `object` to also allow enums but they can't be used in types
    // for keys of indexes so we need any
    typeMap.set(tagValue, t)
  })

  return runtype((v: unknown) => {
    const o: any = objectRuntype(v)

    if (isFail(o)) {
      return o
    }

    const tagValue = o[key]
    const rt = typeMap.get(tagValue)

    if (rt === undefined) {
      return fail(
        `no Runtype found for discriminated union tag ${key}: ${debugValue(
          tagValue,
        )}`,
        v,
      )
    }

    return rt(v)
  })
}

/**
 * A union of runtypes.
 */
export function union<A, B>(a: Runtype<A>, b: Runtype<B>): Runtype<A | B>
export function union<A, B, C>(
  a: Runtype<A>,
  b: Runtype<B>,
  c: Runtype<C>,
): Runtype<A | B | C>
export function union<A, B, C, D>(
  a: Runtype<A>,
  b: Runtype<B>,
  c: Runtype<C>,
  d: Runtype<D>,
): Runtype<A | B | C | D>
export function union<A, B, C, D, E>(
  a: Runtype<A>,
  b: Runtype<B>,
  c: Runtype<C>,
  d: Runtype<D>,
  e: Runtype<E>,
): Runtype<A | B | C | D | E>
export function union(...runtypes: Runtype<any>[]): Runtype<any> {
  return runtype((v) => {
    let lastFail: Fail | undefined

    for (let i in runtypes) {
      const val = runtypes[i](v)

      if (!isFail(val)) {
        return val
      } else {
        lastFail = val
      }
    }

    if (!lastFail) {
      throw new Error('no runtypes given to union')
    }

    return lastFail
  })
}

// An intersection of two record runtypes
function recordIntersection<A, B>(
  recordA: RecordRuntype<A>,
  recordB: RecordRuntype<B>,
): RecordRuntype<A & B> {
  const fields: { [key: string]: Runtype<any> } = {}
  const a = recordA.fields
  const b = recordB.fields

  for (let k in { ...a, ...b }) {
    if (a[k] && b[k]) {
      fields[k] = intersection(a[k], b[k])
    } else if (a[k]) {
      fields[k] = a[k]
    } else if (b[k]) {
      fields[k] = b[k]
    } else {
      throw new Error('invalid else')
    }
  }

  return <any>record(fields)
}

/**
 * An intersection of two runtypes
 */
function intersection2<A, B>(
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
): RecordRuntype<A & B>
function intersection2<A, B>(a: Runtype<A>, b: Runtype<B>): Runtype<A & B>
function intersection2(a: Runtype<any>, b: Runtype<any>): Runtype<any> {
  if ('fields' in a && 'fields' in b) {
    return recordIntersection(a, b)
  } else {
    return runtype((v) => {
      const valFromA = a(v)
      const valFromB = b(v)

      if (isFail(valFromB)) {
        return valFromB
      }

      if (isFail(valFromA)) {
        return valFromA
      }

      return valFromB // second runtype arg is preferred
    })
  }
}

/**
 * An intersection of runtypes.
 */
export function intersection<A, B>(
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
): RecordRuntype<A & B>
export function intersection<A, B>(a: Runtype<A>, b: Runtype<B>): Runtype<A & B>
export function intersection<A, B, C>(
  a: RecordRuntype<A>,
  b: RecordRuntype<B>,
  c: RecordRuntype<C>,
): RecordRuntype<A & B & C>
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
    throw new Error(`unsupported number of arguments ${args.length}`)
  }
}

/**
 * Build a new record runtype that contains some keys from the original
 */
export function pick<T, K extends keyof T>(
  original: RecordRuntype<T>,
  ...keys: K[]
): RecordRuntype<Pick<T, K>> {
  const newRecordFields: any = {}

  keys.forEach((k: any) => {
    newRecordFields[k] = original.fields[k]
  })

  return record(newRecordFields)
}

// type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

/**
 * Build a new record runtype that omits some keys from the original.
 */
export function omit<T, K extends keyof T>(
  original: RecordRuntype<T>,
  ...keys: K[]
): RecordRuntype<Omit<T, K>> {
  const newRecordFields: any = { ...original.fields }

  keys.forEach((k: any) => {
    delete newRecordFields[k]
  })

  return record(newRecordFields)
}

// TODO: other combinators like partial, required, ...
