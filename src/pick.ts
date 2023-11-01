import { internalRecord } from './record'
import { InternalRuntype, Runtype, RuntypeUsageError } from './runtype'

/**
 * Build a new record runtype that contains some keys from the original
 */
export function pick<T, K extends keyof T>(
  original: Runtype<T>,
  ...keys: K[]
): Runtype<Pick<T, K>> {
  const fields = (original as InternalRuntype<any>).meta?.fields
  const isNonStrict = (original as InternalRuntype<any>).meta?.isNonStrict

  if (!fields) {
    throw new RuntypeUsageError(`expected a record runtype`)
  }

  const newRecordFields: any = {}

  keys.forEach((k: any) => {
    newRecordFields[k] = fields[k]
  })

  return internalRecord(newRecordFields, isNonStrict)
}
