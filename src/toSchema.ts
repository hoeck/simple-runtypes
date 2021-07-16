import type { Runtype } from './runtype'
import { toSchema as anyToSchema } from './any'
import { toSchema as arrayToSchema } from './array'
import { toSchema as booleanToSchema } from './boolean'
import { toSchema as customToSchema } from './custom'
import { toSchema as dictionaryToSchema } from './dictionary'
import { toSchema as enumToSchema } from './enum'
import { toSchema as guardedByToSchema } from './guardedBy'
import { toSchema as ignoreToSchema } from './ignore'
import { toSchema as integerToSchema } from './integer'
import { toSchema as intersectionToSchema } from './intersection'
import { toSchema as jsonToSchema } from './json'
import { toSchema as literalToSchema } from './literal'
import { toSchema as nullToSchema } from './null'
import { toSchema as nullOrToSchema } from './nullOr'
import { toSchema as numberToSchema } from './number'
import { toSchema as objectToSchema } from './object'
import { toSchema as optionalToSchema } from './optional'
import { toSchema as recordToSchema } from './record'
import { toSchema as stringToSchema } from './string'
import { toSchema as stringAsIntegerToSchema } from './stringAsInteger'
import { toSchema as stringLiteralUnionToSchema } from './stringLiteralUnion'
import { toSchema as tupleToSchema } from './tuple'
import { toSchema as unionToSchema } from './union'
import { toSchema as undefinedToSchema } from './undefined'
import { toSchema as undefinedOrToSchema } from './undefinedOr'
import { toSchema as unknownToSchema } from './unknown'
import type { Meta } from './runtypeMeta'

function assertNever(x: never): never {
  throw new Error(`unexpected object ${x}`)
}

export function toSchema(runtype: Runtype<any>): string {
  const meta: Meta = (runtype as any).meta

  switch (meta.type) {
    case 'any':
      return anyToSchema()

    case 'array':
      return arrayToSchema(runtype, toSchema)

    case 'boolean':
      return booleanToSchema()

    case 'custom':
      return customToSchema()

    case 'dictionary':
      return dictionaryToSchema(runtype, toSchema)

    case 'enum':
      return enumToSchema(runtype)

    case 'guardedBy':
      return guardedByToSchema()

    case 'ignore':
      return ignoreToSchema()

    case 'integer':
      return integerToSchema()

    case 'intersection':
      return intersectionToSchema(runtype, toSchema)

    case 'json':
      return jsonToSchema()

    case 'literal':
      return literalToSchema(runtype)

    case 'null':
      return nullToSchema()

    case 'nullOr':
      return nullOrToSchema(runtype, toSchema)

    case 'number':
      return numberToSchema()

    case 'object':
      return objectToSchema()

    case 'optional':
      return optionalToSchema(runtype, toSchema)

    case 'record':
      return recordToSchema(runtype, toSchema)

    case 'string':
      return stringToSchema()

    case 'stringAsInteger':
      return stringAsIntegerToSchema()

    case 'stringLiteralUnion':
      return stringLiteralUnionToSchema(runtype)

    case 'tuple':
      return tupleToSchema(runtype, toSchema)

    case 'union':
      return unionToSchema(runtype, toSchema)

    case 'undefined':
      return undefinedToSchema()

    case 'undefinedOr':
      return undefinedOrToSchema()

    case 'unknown':
      return unknownToSchema()

    default:
      assertNever(meta)
  }
}
