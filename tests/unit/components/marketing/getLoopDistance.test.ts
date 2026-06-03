import { describe, it, expect } from 'vitest'
import { getLoopDistance } from '@/components/marketing/ComingSoonCarousel'

// ---------------------------------------------------------------------------
// getLoopDistance — unit tests
//
// This function computes the shortest distance from a card's index to the
// currently selected index, accounting for carousel loop wrap-around.
// It is the only non-trivial logic in the Coming Soon carousel.
// ---------------------------------------------------------------------------

const TOTAL = 6 // matches the real carousel card count

describe('getLoopDistance', () => {
  describe('no wrap-around needed', () => {
    it('returns 0 when index equals selectedIndex', () => {
      expect(getLoopDistance(0, 0, TOTAL)).toBe(0)
      expect(getLoopDistance(3, 3, TOTAL)).toBe(0)
      expect(getLoopDistance(5, 5, TOTAL)).toBe(0)
    })

    it('returns 1 for immediately adjacent cards', () => {
      expect(getLoopDistance(1, 0, TOTAL)).toBe(1)
      expect(getLoopDistance(0, 1, TOTAL)).toBe(1)
      expect(getLoopDistance(4, 3, TOTAL)).toBe(1)
    })

    it('returns 2 for cards two positions away', () => {
      expect(getLoopDistance(2, 0, TOTAL)).toBe(2)
      expect(getLoopDistance(0, 2, TOTAL)).toBe(2)
    })
  })

  describe('loop wrap-around', () => {
    it('takes the short path when wrapping is shorter — index 0, selected 5', () => {
      // Direct distance: |0 - 5| = 5. Wrap distance: 6 - 5 = 1. Should return 1.
      expect(getLoopDistance(0, 5, TOTAL)).toBe(1)
    })

    it('takes the short path when wrapping is shorter — index 5, selected 0', () => {
      // Direct distance: |5 - 0| = 5. Wrap distance: 6 - 5 = 1. Should return 1.
      expect(getLoopDistance(5, 0, TOTAL)).toBe(1)
    })

    it('takes the short path — index 1, selected 4', () => {
      // Direct: |1 - 4| = 3. Wrap: 6 - 3 = 3. Equal — either is fine, expect 3.
      expect(getLoopDistance(1, 4, TOTAL)).toBe(3)
    })

    it('takes the short path — index 0, selected 4', () => {
      // Direct: |0 - 4| = 4. Wrap: 6 - 4 = 2. Should return 2.
      expect(getLoopDistance(0, 4, TOTAL)).toBe(2)
    })
  })

  describe('symmetry', () => {
    it('is symmetric — distance(a, b) === distance(b, a)', () => {
      for (let a = 0; a < TOTAL; a++) {
        for (let b = 0; b < TOTAL; b++) {
          expect(getLoopDistance(a, b, TOTAL)).toBe(getLoopDistance(b, a, TOTAL))
        }
      }
    })
  })

  describe('distance never exceeds half the total', () => {
    it('maximum distance is floor(total / 2)', () => {
      const maxExpected = Math.floor(TOTAL / 2)
      for (let selected = 0; selected < TOTAL; selected++) {
        for (let i = 0; i < TOTAL; i++) {
          expect(getLoopDistance(i, selected, TOTAL)).toBeLessThanOrEqual(maxExpected)
        }
      }
    })
  })
})
