import { createFail, internalRuntype, Runtype } from './runtype'

export type Meta = Readonly<{
  type: 'stringLiteralUnion'
  isPure: true
  valuesIndex: Set<string>
}>

/**
 * A union of string literals.
 */
export function stringLiteralUnion<V extends string[]>(
  ...values: V
): Runtype<V[number]> {
  const meta: Meta = {
    type: 'stringLiteralUnion',
    isPure: true,
    valuesIndex: new Set(values),
  }

  return internalRuntype((v, failOrThrow) => {
    if (typeof v !== 'string' || !meta.valuesIndex.has(v)) {
      return createFail(failOrThrow, `expected one of ${values}`, v)
    }

    return v
  }, meta)
}

export function toSchema(runtype: Runtype<any>): string {
  const meta: Meta = (runtype as any).meta

  return Array.from(meta.valuesIndex).join(' | ')
}
