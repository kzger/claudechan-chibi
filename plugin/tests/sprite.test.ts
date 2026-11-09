import { expect, test } from 'claude-code/testing'
import { drawnLoopMs, frameStep } from '../hooks/sprite'

const RUNNING = [120, 120, 120, 120, 120, 220]

/** The frames one loop draws, from frame 0. */
function drawn(d: number[], min: number): number[] {
  const out: number[] = []
  for (let f = 0; f < d.length; f += frameStep(d, f, min).frames) out.push(f)
  return out
}

test('quick frames merge, but the last (held) frame is always drawn', () => {
  expect(drawn(RUNNING, 240)).toEqual([0, 2, 4, 5])
  expect(drawn([...Array(7).fill(120), 240], 240)).toEqual([0, 2, 4, 6, 7])
})

test('no draw comes sooner than the minimum', () => {
  for (let f = 0; f < RUNNING.length; f++) expect(frameStep(RUNNING, f, 240).ms >= 240).toBe(true)
})

test('slow frames are drawn one by one at their own time', () => {
  expect(frameStep([1000, 400, 240], 1, 240)).toEqual({ frames: 1, ms: 400 })
  expect(drawnLoopMs([1000, 400, 240], 240)).toBe(1640)
})

test('the loop time is what the clock draws', () => {
  expect(drawnLoopMs(RUNNING, 240)).toBe(240 * 4)
  expect(drawnLoopMs([60, 60, 60], 0)).toBe(180)
})

test('a frame past the end wraps', () => {
  expect(frameStep(RUNNING, 6, 240)).toEqual(frameStep(RUNNING, 0, 240))
})
