import * as sr from '../src'
import { failSymbol } from '../src/runtype'
import {
  expectAcceptValuesImpure,
  expectAcceptValuesPure,
  expectRejectObjectAttributes,
  expectRejectValues,
  objectAttributes,
} from './helpers'

describe('custom runtypes', () => {
  describe('simple nested runtypes', () => {
    const rt = sr.runtype((v) => {
      if (v === 31) {
        return 31
      }

      if (v === '-') {
        return '-'
      }

      return sr.fail('not the right type')
    })

    it('should create a custom runtype', () => {
      expectAcceptValuesPure(rt, ['-', 31])
      expectRejectValues(rt, ['31', null, 123, []])
    })

    it('should not throw an exception when used internally', () => {
      expect((rt as any)(123, failSymbol)).toEqual(
        expect.objectContaining({
          [failSymbol]: true,
          reason: 'not the right type',
        }),
      )
    })
  })

  describe('nested runtypes that combine other runtypes', () => {
    const stringsRt = sr.tuple(sr.literal('3'), sr.literal('1'))
    const combinedRt = sr.runtype((v) => {
      const strings = sr.useRuntype(stringsRt, v)

      if (!sr.isFail(strings)) {
        return 31
      }

      if (v === 31) {
        return 31
      }

      return sr.fail('not the right type')
    })

    it('should invoke other runtypes', () => {
      expect(combinedRt(31)).toBe(31)
      expect(combinedRt(['3', '1'])).toBe(31)

      expectRejectValues(combinedRt, ['31', null, 123, ['3', '1', '0'], [], {}])
    })
  })
})
