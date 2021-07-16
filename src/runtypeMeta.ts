import type { Meta as AnyMeta } from './any'
import type { Meta as ArrayMeta } from './array'
import type { Meta as BooleanMeta } from './boolean'
import type { Meta as CustomMeta } from './custom'
import type { Meta as DictionaryMeta } from './dictionary'
import type { Meta as EnumMeta } from './enum'
import type { Meta as GuardedByMeta } from './guardedBy'
import type { Meta as IgnoreMeta } from './ignore'
import type { Meta as IntegerMeta } from './integer'
import type { Meta as IntersectionMeta } from './intersection'
import type { Meta as JsonMeta } from './json'
import type { Meta as LiteralMeta } from './literal'
import type { Meta as NullMeta } from './null'
import type { Meta as NullOrMeta } from './nullOr'
import type { Meta as NumberMeta } from './number'
import type { Meta as ObjectMeta } from './object'
import type { Meta as OptionalMeta } from './optional'
import type { Meta as RecordMeta } from './record'
import type { Meta as StringMeta } from './string'
import type { Meta as StringAsIntegerMeta } from './stringAsInteger'
import type { Meta as StringLiteralUnionMeta } from './stringLiteralUnion'
import type { Meta as TupleMeta } from './tuple'
import type { Meta as UndefinedMeta } from './undefined'
import type { Meta as UndefinedOrMeta } from './undefinedOr'
import type { Meta as UnionMeta } from './union'
import type { Meta as UnknownMeta } from './unknown'

export type Meta =
  | AnyMeta
  | ArrayMeta
  | BooleanMeta
  | CustomMeta
  | DictionaryMeta
  | EnumMeta
  | GuardedByMeta
  | IgnoreMeta
  | IntegerMeta
  | IntersectionMeta
  | JsonMeta
  | LiteralMeta
  | NullMeta
  | NullOrMeta
  | NumberMeta
  | ObjectMeta
  | OptionalMeta
  | RecordMeta
  | StringMeta
  | StringAsIntegerMeta
  | StringLiteralUnionMeta
  | TupleMeta
  | UndefinedMeta
  | UndefinedOrMeta
  | UnionMeta
  | UnknownMeta
