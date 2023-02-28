import { internalRecord } from './record'
import { Runtype, RuntypeUsageError, isNonStrictRuntype } from './runtype'

/**
 * Build a new record runtype that omits some keys from the original.
 */
// TODO: should work with unions too!!!!!
export function omit<T, K extends keyof T>(
  original: Runtype<T>,
  ...keys: K[]
): Runtype<Omit<T, K>> {
  const fields = (original as any).fields

  if (!fields) {
    throw new RuntypeUsageError(`expected a record runtype`)
  }

  const newRecordFields: any = { ...fields }

  keys.forEach((k: any) => {
    delete newRecordFields[k]
  })

  return internalRecord(
    newRecordFields,
    isNonStrictRuntype(original),
  ) as Runtype<any>
}
