import { record } from './record'
import { Runtype, RuntypeUsageError } from './runtype'
import type { Meta as RuntypeMeta } from './runtypeMeta'

/**
 * Build a new record runtype that omits some keys from the original.
 */
// TODO: should work with unions too!!!!!
export function omit<T, K extends keyof T>(
  original: Runtype<T>,
  ...keys: K[]
): Runtype<Omit<T, K>> {
  const meta: RuntypeMeta = (original as any).meta

  if (meta.type !== 'record') {
    throw new RuntypeUsageError(`expected a record runtype`)
  }

  const newRecordFields: any = { ...meta.fields }

  keys.forEach((k: any) => {
    delete newRecordFields[k]
  })

  // TODO: keep 'sloppyness'
  return record(newRecordFields) as Runtype<any>
}
