
/// infrastructure

// context variable: the current processed key in object to provide better error messages
let _currentKey: string | undefined

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
        return s.slice(maxLength-1) + '\u2026'
    } else {
        return s
    }
}


export class RuntypeError extends Error {}

function createError(msg: string, value: any) {
    return new RuntypeError(`${msg}, value: ${debugValue(value)}${currentKey()}`)
}

export interface Runtype<T> {
    // keys which are constant in case that T is a record type to help
    // identifying the correct function for a discriminatedUnion type
    constants?: {[key: string]: object | string | number}

    // a function to check that v 'conforms' to type T
    (v: unknown): T
}

/// basic types

/**
 * A number.
 *
 * Explicitly pass true for allowNaN to not fail on NaNs
 */
export function number(allowNaN: boolean = false): Runtype<number> {
    return (v: unknown): number => {
        if (typeof v === 'number') {

            if (!allowNaN && isNaN(v)) {
                throw createError('expected a number and not NaN', v)
            }

            return v
        }

        throw createError('expected a number', v)
    }
}

/**
 * A number without decimals and within +-MAX_SAFE_INTEGER.
 */
export function integer(): Runtype<number> {
    return (v: unknown) => {
        if (typeof v === 'number' && Number.isInteger(v) && -Number.MAX_SAFE_INTEGER <= v &&v <= Number.MAX_SAFE_INTEGER) {

            return v
        }

        throw createError('expected an integer', v)
    }
}


/**
 * A boolean.
 */
export function boolean(): Runtype<boolean> {
    return (v: unknown) => {
        if (v === true || v === false) {
            return v
        }

        throw createError('expected a boolean', v)
    }
}

/**
 * A string.
 */
export function string(): Runtype<string> {
    return (v: unknown) => {
        if (typeof v === 'string') {

            return v
        }

        throw createError('expected a string', v)
    }
}

/**
 * A literal (string | number | boolean).
 */
export function literal<T extends string>(v: unknown, literal: T): Runtype<T>
export function literal<T extends number>(v: unknown, literal: T): Runtype<T>
export function literal<T extends boolean>(v: unknown, literal: T): Runtype<T>
export function literal(literal: any): any {
    return (v: unknown) => {
        if (v === literal) {
            return literal
        }

        throw createError(`expected a literal: ${debugValue(literal)}`, v)
    }
}

/**
 * A value to check later.
 */
export function unknown(): Runtype<unknown> {
    return (v: unknown) => {
        return v
    }
}

/**
 * A value to check later.
 */
export function any(): Runtype<any> {
    return (v: unknown) => {
        return v as any
    }
}

/**
 * A value to ignore (typed as unknown and always set to undefined).
 */
export function ignore(): Runtype<unknown> {
    return (_v: unknown) => {
        return undefined as unknown
    }
}

/**
 * Any value defined in the enumObject.
 */
export function enumValue<T extends object, S extends keyof T>(enumObject: T): Runtype<T[S]> {
    return (v: unknown) => {
        // use the reverse lookup of number enums to check whether v is a value of
        // the enum
        if (typeof v === 'number' && (enumObject as any)[v as any] !== undefined) {
            return (v as unknown) as T[S]
        }

        if (Object.values(enumObject).indexOf(v) !== -1) {
            return v as T[S]
        }

        throw createError(`expected a value that belongs to the enum ${debugValue(enumObject)}`, v)
    }
}

/**
 * The value of enumObject[key].
 */
export function enumConstant<T extends object, S extends keyof T>(enumObject: T, key: S): Runtype<T[S]> {
    return (v:unknown) => {
        if (enumObject[key] === v) {
            return v as T[S]
        }

        throw createError(`expected value to be item ${key} of enum ${debugValue(enumObject)}`, v)
    }
}

/// containers

export function arrayRuntype(v: unknown) {
    if (Array.isArray(v)) {
        return v
    }

    throw createError(`expected an Array`, v)
}

export function array(): Runtype<unknown[]> {
    return arrayRuntype
}

export function tuple<A>(t: [Runtype<A>]): Runtype<[A]>
export function tuple<A,B>(t: [Runtype<A>, Runtype<B>]): Runtype<[A,B]>
export function tuple<A,B,C>(t: [Runtype<A>, Runtype<B>, Runtype<C>]): Runtype<[A,B,C]>
export function tuple<A,B,C,D>(t: [Runtype<A>, Runtype<B>, Runtype<C>, Runtype<D>]): Runtype<[A,B,C,D]>
export function tuple<A,B,C,D,E>(t: [Runtype<A>, Runtype<B>, Runtype<C>, Runtype<D>, Runtype<E>]): Runtype<[A,B,C,D,E]>
export function tuple(types: Runtype<any>[]): any {
    return (v:unknown) => {
        const a = arrayRuntype(v)
        
        return types.map((t,i) => t(a[i]))
    }
}

export function objectRuntype(v: unknown) {
    if (typeof v === 'object' && !Array.isArray(v) && v !== null) {
        return v
    }
    
    throw createError('expected an object', v)
}

export function object(): Runtype<object> {
    return objectRuntype
}

export function record<T extends object>(typemap: {[K in keyof T]: Runtype<T[K]>}): Runtype<T> {
    return (v: unknown) => {
        const o: any = objectRuntype(v)
        const res = {} as T
        const currentKey = _currentKey

        for (const k in typemap) {
            _currentKey = k
            res[k] = typemap[k](o[k])
        }

        _currentKey = currentKey

        const unknownKeys = Object.keys(o).filter(k => !res.hasOwnProperty(k))

        if (unknownKeys.length) {
            throw createError('invalid keys in object', unknownKeys)
        }
        
        return res
    }
}

/// combinators

export function optional<A>(t: Runtype<A>): Runtype<undefined | A> {
    return (v: unknown) => {
        if (v === undefined || v === null) {
            return undefined
        }

        return t(v)
    }
}


// pattern

// const xxx = v => {
//     switch (objectRuntype(o).type) {
//         case 'a':
//             return record_type_a()
//         case 'b':
//             return record_type_b()
//         default:
//             throw createError()
//     }
// }

enum Types {
    // A = 'a',
    // B = 'b',
    A, B,C
}

interface Atype {
    type: Types.A,
    a: number
    x?: boolean
}

interface Btype {
    type: Types.B,
    b: string
    x?: boolean
}


interface Ctype {
    type: Types.C,
    b: string
    x?: boolean
}

type AlphaType = Atype | Btype | Ctype

const data: unknown = {type: 'b', b: 'bbb'}

function discriminatedUnion<A>(key: keyof A, a: Runtype<A>): Runtype<A>
function discriminatedUnion<A, B>(key: keyof (A | B), a: Runtype<A>, b: Runtype<B>): Runtype<A | B>
function discriminatedUnion<A, B, C>(key: keyof (A | B | C), a: Runtype<A>, b: Runtype<B>, c: Runtype<C>): Runtype<A | B | C>
// function discriminatedUnion<A, B, C, D>(a: Runtype<A>, b: Runtype<B>, c: Runtype<C>, d: Runtype<D>): Runtype<A | B | C | D>
// function discriminatedUnion<A, B, C, D, E>(a: Runtype<A>, b: Runtype<B>, c: Runtype<C>, d: Runtype<D>, e: Runtype<E>): Runtype<A | B | C | D | E>
// function discriminatedUnion<A, B, C, D, E, F>(a: Runtype<A>, b: Runtype<B>, c: Runtype<C>, d: Runtype<D>, e: Runtype<E>, f: Runtype<F>): Runtype<A | B | C | D | E | F>
// function discriminatedUnion<A, B, C, D, E, F, G>(a: Runtype<A>, b: Runtype<B>, c: Runtype<C>, d: Runtype<D>, e: Runtype<E>, f: Runtype<F>, g: Runtype<G>): Runtype<A | B | C | D | E | F | G>
// function discriminatedUnion<A, B, C, D, E, F, G, H>(a: Runtype<A>, b: Runtype<B>, c: Runtype<C>, d: Runtype<D>, e: Runtype<E>, f: Runtype<F>, g: Runtype<G>, h: Runtype<H>): Runtype<A | B | C | D | E | F | G | H>
// function discriminatedUnion<A, B, C, D, E, F, G, H, I>(a: Runtype<A>, b: Runtype<B>, c: Runtype<C>, d: Runtype<D>, e: Runtype<E>, f: Runtype<F>, g: Runtype<G>, h: Runtype<H>, i: Runtype<I>): Runtype<A | B | C | D | E | F | G | H | I>
// function discriminatedUnion<A, B, C, D, E, F, G, H, I, J>(a: Runtype<A>, b: Runtype<B>, c: Runtype<C>, d: Runtype<D>, e: Runtype<E>, f: Runtype<F>, g: Runtype<G>, h: Runtype<H>, i: Runtype<I>, j: Runtype<J>): Runtype<A | B | C | D | E | F | G | H | I | J>
function discriminatedUnion(key: any, ...runtypes: RunType<any>): Runtype<any> {                   
    const typeMap: any = {}

    
    
    
    return (v: unknown) => {
        // const o: any = objectRuntype(v) // any, we need index access
        // const d = o[discriminant]
        // const runtype = (types as any)[d]
        // 
        // return runtype(o)
        console.log(v,a,b)
        return undefined as any
    }
}

const x: AlphaType = discriminatedUnion(
    record({type: enumConstant(Types, 'A'), a: number()}),
    record({type: enumConstant(Types, 'B'), b: string()}),    
)(data)




