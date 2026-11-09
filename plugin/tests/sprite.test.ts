import { expect, test } from 'claude-code/testing'
import { drawnLoopMs, frameCells, frameStep, fromBase64, spriteRows, toBase64, type SpriteSet } from '../hooks/sprite'

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

test('base64 matches the standard alphabet and padding', () => {
  const bytes = (s: string) => new Uint8Array([...s].map(c => c.charCodeAt(0)))
  for (const [plain, coded] of [['Man', 'TWFu'], ['Ma', 'TWE='], ['M', 'TQ=='], ['', ''], ['\xff\xfe\xfd\x00', '//79AA==']]) {
    expect(toBase64(bytes(plain!))).toBe(coded)
    expect([...fromBase64(coded!)]).toEqual([...bytes(plain!)])
  }
})

test('a frame becomes cells: blank top rows dropped, walked in by the offset, backdrop filled', () => {
  const FG = 0x112233
  const FILL = 0x0000aa
  // 2 x 2 cells of [mask, fg index, bg index]; the top row is never painted.
  const frame = toBase64(new Uint8Array([0, 0, 0, 0, 0, 0, 15, 1, 0, 1, 0, 1]))
  const set = {
    name: 'test',
    palette: [FG],
    sizes: { big: { columns: 2, rows: 2 }, small: { columns: 2, rows: 2 } },
    imageSizes: { big: { columns: 2, rows: 2 }, small: { columns: 2, rows: 2 } },
    states: { idle: { durations: [100], big: [frame], small: [frame] } },
  } as unknown as SpriteSet
  expect(spriteRows(set, 'small')).toBe(1)
  const cells = fromBase64(frameCells(set, 'idle', 'small', 0, 4, 1, FILL))
  const words = [...new Uint32Array(cells.buffer, cells.byteOffset, cells.byteLength / 4)]
  expect(words).toEqual([0x20, FILL, FILL, 0x2588, FG, FILL, 0x2598, FILL, FG, 0x20, FILL, FILL])
})

/** A one-state set of `columns` x `rows` cells, each frame given as [mask, fg, bg] per cell. */
function tinySet(columns: number, rows: number, palette: number[], ...frames: number[][]): SpriteSet {
  const coded = frames.map(f => toBase64(new Uint8Array(f)))
  const size = { columns, rows }
  return {
    name: `tiny-${Math.random()}`, // blankTop caches by name
    palette,
    sizes: { big: size, small: size },
    imageSizes: { big: size, small: size },
    states: { idle: { durations: coded.map(() => 100), big: coded, small: coded } },
  } as unknown as SpriteSet
}

const words = (cells: string) => {
  const b = fromBase64(cells)
  return [...new Uint32Array(b.buffer, b.byteOffset, b.byteLength / 4)]
}

test('the blank top is what no frame paints, checked across the whole row', () => {
  // frame A paints only row 1; frame B paints row 0, but only its second cell.
  const a = [0, 0, 0, 0, 0, 0, 15, 1, 0, 0, 0, 0]
  const b = [0, 0, 0, 15, 1, 0, 0, 0, 0, 0, 0, 0]
  expect(spriteRows(tinySet(2, 2, [1], a), 'small')).toBe(1)
  expect(spriteRows(tinySet(2, 2, [1], a, b), 'small')).toBe(2)
  expect(spriteRows(tinySet(2, 2, [1], new Array(12).fill(0)), 'small')).toBe(1)
  // three rows: the second row is painted only in its second cell
  expect(spriteRows(tinySet(2, 3, [1], [0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 1, 0, 0, 0, 0, 0, 0, 0]), 'small')).toBe(2)
})

test('each cell keeps its own colours; past the sprite and past the palette is backdrop', () => {
  const FG = 0x112233
  const BG = 0x445566
  const FILL = 0x0000aa
  // row 0: [█ fg bg] [▘ bg, unknown colour 9]; row 1: [▀ fg fg] [blank]
  const set = tinySet(2, 2, [FG, BG], [15, 1, 2, 1, 2, 9, 3, 1, 1, 0, 0, 0])
  expect(words(frameCells(set, 'idle', 'small', 0, 3, 0, FILL))).toEqual([
    0x2588, FG, BG, 0x2598, BG, FILL, 0x20, FILL, FILL,
    0x2580, FG, FG, 0x20, FILL, FILL, 0x20, FILL, FILL,
  ])
})
