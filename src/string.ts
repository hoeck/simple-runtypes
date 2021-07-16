import {
  createFail,
  InternalRuntype,
  internalRuntype,
  isFail,
  propagateFail,
  Runtype,
} from './runtype'

export type Meta = Readonly<{
  type: 'string'
  isPure: boolean
}>

const pureMeta: Meta = {
  type: 'string',
  isPure: true,
}

const stringRuntype = internalRuntype<string>((v, failOrThrow) => {
  if (typeof v === 'string') {
    return v
  }

  return createFail(failOrThrow, 'expected a string', v)
}, pureMeta)

/**
 * A string.
 *
 * Options:
 *
 *   minLength .. reject strings that are shorter than that
 *   maxLength .. reject strings that are longer than that
 *   trim .. when true, remove leading and trailing spaces from the string
 *   match .. reject strings that do not match against provided RegExp
 */
export function string(options?: {
  minLength?: number
  maxLength?: number
  trim?: boolean
  match?: RegExp
}): Runtype<string> {
  if (!options) {
    return stringRuntype
  }

  const { minLength, maxLength, trim, match } = options

  const meta: Meta = {
    type: 'string',
    isPure: !trim, // trim modifies the string
  }

  return internalRuntype((v, failOrThrow) => {
    const s: string = (stringRuntype as InternalRuntype)(v, failOrThrow)

    if (isFail(s)) {
      return propagateFail(failOrThrow, s, v)
    }

    if (minLength !== undefined && s.length < minLength) {
      return createFail(
        failOrThrow,
        `expected the string length to be at least ${minLength}`,
        v,
      )
    }

    if (maxLength !== undefined && s.length > maxLength) {
      return createFail(
        failOrThrow,
        `expected the string length to not exceed ${maxLength}`,
        v,
      )
    }

    if (match !== undefined && !match.test(s)) {
      return createFail(failOrThrow, `expected the string to match ${match}`, v)
    }

    return trim ? s.trim() : s
  }, meta)
}

export function toSchema(): string {
  return 'string'
}
