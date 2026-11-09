import { expect, test } from 'claude-code/testing'
import { pickState, TIRED_AFTER_MS, type Flags } from '../hooks/mood'

const NOW = 1_000_000
const CALM: Flags = {
  now: NOW,
  isWorking: false,
  turnStartedAt: 0,
  workAnim: 'thinking',
  isWaiting: false,
  greetUntil: 0,
  wakeUntil: 0,
  ackUntil: 0,
  failedUntil: 0,
  failedAnim: 'oops',
  compactUntil: 0,
  reviewUntil: 0,
  reviewAnim: 'proud',
  pokeUntil: 0,
  pokeAnim: 'surprised',
  angryUntil: 0,
  forgivenUntil: 0,
}

/** Each one-shot, highest first, with what it plays. */
const ONE_SHOTS: [keyof Flags, string][] = [
  ['angryUntil', 'angry'],
  ['pokeUntil', 'surprised'],
  ['forgivenUntil', 'forgiven'],
  ['failedUntil', 'oops'],
  ['compactUntil', 'compact'],
  ['reviewUntil', 'proud'],
  ['wakeUntil', 'redhot'],
  ['ackUntil', 'listening'],
]

test('nothing going on is idle', () => {
  expect(pickState(CALM)).toBe('idle')
})

test('a one-shot plays until its end, and is over at it', () => {
  for (const [key, anim] of ONE_SHOTS) {
    expect([key, pickState({ ...CALM, [key]: NOW + 1 })]).toEqual([key, anim])
    expect([key, pickState({ ...CALM, [key]: NOW })]).toEqual([key, 'idle'])
  }
  expect(pickState({ ...CALM, greetUntil: NOW + 1 })).toBe('waving')
  expect(pickState({ ...CALM, greetUntil: NOW })).toBe('idle')
})

test('each one-shot hides the ones below it', () => {
  for (let i = 0; i < ONE_SHOTS.length; i++) {
    const all = Object.fromEntries(ONE_SHOTS.slice(i).map(([k]) => [k, NOW + 1]))
    expect(pickState({ ...CALM, ...all, isWorking: true, greetUntil: NOW + 1 })).toBe(ONE_SHOTS[i]![1])
  }
})

test('a dialog waiting on you beats everything', () => {
  expect(pickState({ ...CALM, isWaiting: true, angryUntil: NOW + 1 })).toBe('waiting')
})

test('work shows its pose, and a long turn makes her tired', () => {
  const working = { ...CALM, isWorking: true, workAnim: 'searching' as const, greetUntil: NOW + 1 }
  expect(pickState({ ...working, turnStartedAt: NOW - TIRED_AFTER_MS })).toBe('searching')
  expect(pickState({ ...working, turnStartedAt: NOW - TIRED_AFTER_MS - 1 })).toBe('tired')
})
