import { internalRecord } from './record'
import { InternalRuntype, Runtype, RuntypeUsageError } from './runtype'

/**
 * Build a non-strict `record` runtype from the provided `record` runtype.
 *
 * In contrast to a `record` runtype, a non-strict `record` runtype will ignore
 * keys that are not specified in the original runtype's typemap (non-strict checking).
 *
 * When a non-strict `record` runtype checks an object, it will return a new
 * object that contains only the keys specified in the original runtype's typemap.
 *
 * Non-strict checking only applies to the root typemap. To apply non-strict checking
 * to a nested typemap, `nonStrict` needs to be used at each level of the typemap.
 */
export function nonStrict<T>(original: Runtype<T>): Runtype<T> {
  const fields = (original as InternalRuntype<any>).meta?.fields

  if (!fields) {
    throw new RuntypeUsageError('expected a record runtype')
  }

  return internalRecord(fields, true)
}
