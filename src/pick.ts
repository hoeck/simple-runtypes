import { record } from './record'
import type { RecordWithOptional } from './record'
import { Runtype, RuntypeUsageError } from './runtype'

/**
 * Build a new record runtype that contains some keys from the original
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  original: Runtype<T>,
  ...keys: K[]
): Runtype<RecordWithOptional<Pick<T, K>>> {
  const fields = (original as any).fields

  if (!fields) {
    throw new RuntypeUsageError(`expected a record runtype`)
  }

  const newRecordFields = {} as Pick<T, K>

  keys.forEach((k) => {
    newRecordFields[k] = fields[k]
  })

  return record(newRecordFields) as any
}
