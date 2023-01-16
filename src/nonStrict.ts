import { internalRecord } from './record'
import { Runtype, RuntypeUsageError } from './runtype'

export function nonStrict<T>(original: Runtype<T>): Runtype<T> {
  const fields = (original as any).fields

  if (!fields) {
    throw new RuntypeUsageError('expected a record runtype')
  }

  return internalRecord(fields, true)
}
