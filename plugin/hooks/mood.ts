import type { AnimName } from './sprite'

/** A turn this long and she is tired: 'tired' takes over from her work pose. */
export const TIRED_AFTER_MS = 10 * 60_000

/**
 * Everything the mod knows at one moment, as plain facts.
 *
 * The `...Until` fields are timestamps (ms, `$.clock.now()`): the register
 * module sets them to "now + a few loops of that animation" when the event
 * happens, the way the Codex app plays a one-shot state three times.
 * A field in the past means that event is over.
 */
export type Flags = {
  now: number
  /** A main-loop turn is running (from your prompt until the turn completes). */
  isWorking: boolean
  /** When the running turn started. */
  turnStartedAt: number
  /** The pose of the running turn: 'thinking' before its first tool, then the last tool's. */
  workAnim: AnimName
  /** A permission dialog, an AskUserQuestion or a plan approval is waiting on you. */
  isWaiting: boolean
  /** Session just started: waving. */
  greetUntil: number
  /** Caught dozing (your prompt woke her): she blushes before the nod. */
  wakeUntil: number
  /** You just sent a prompt: she listens ("got it"). */
  ackUntil: number
  /** A tool failed or was denied, or the turn was interrupted / errored: `failedAnim` says which. */
  failedUntil: number
  failedAnim: AnimName
  /** The conversation is being compacted (and a moment after). */
  compactUntil: number
  /** The turn just finished with an answer: `reviewAnim`, proud or (after a long turn) happy. */
  reviewUntil: number
  reviewAnim: AnimName
  /** You clicked her: she plays `pokeAnim` for a moment. */
  pokeUntil: number
  pokeAnim: AnimName
  /** You clicked her too often: she is cross. */
  angryUntil: number
  /** Her anger just passed: she forgives you. */
  forgivenUntil: number
}

/**
 * Which animation Claude ちゃん plays right now. Called on every frame: pure and cheap.
 *
 * The Codex app's order: waiting > failed > review > running > idle.
 * A click on her answers above all but a dialog waiting on you: anger first,
 * then the forgiving that follows it.
 * The one-shots Codex has no task state for slot in where they can be seen:
 * the caught-dozing blush and the "got it" nod play just before work starts (else the
 * work pose would always hide them), and the greeting only while nothing
 * else is going on.
 * 'idle' is resolved by register.tsx into the rotation or the doze;
 * 'running-left' / 'running-right' are the band's walk, chosen there too.
 */
export function pickState(f: Flags): AnimName {
  if (f.isWaiting) return 'waiting'
  if (f.angryUntil > f.now) return 'angry'
  if (f.pokeUntil > f.now) return f.pokeAnim
  if (f.forgivenUntil > f.now) return 'forgiven'
  if (f.failedUntil > f.now) return f.failedAnim
  if (f.compactUntil > f.now) return 'compact'
  if (f.reviewUntil > f.now) return f.reviewAnim
  if (f.wakeUntil > f.now) return 'redhot'
  if (f.ackUntil > f.now) return 'listening'
  if (f.isWorking) return f.now - f.turnStartedAt > TIRED_AFTER_MS ? 'tired' : f.workAnim
  if (f.greetUntil > f.now) return 'waving'
  return 'idle'
}
