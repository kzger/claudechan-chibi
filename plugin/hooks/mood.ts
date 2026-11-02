import type { StateName } from './sprite'

/**
 * Everything the mod knows at one moment, as plain facts.
 *
 * The `...Until` fields are timestamps (ms, `$.clock.now()`): the register
 * module sets them to "now + three loops of that animation" when the event
 * happens, the way the Codex app plays a one-shot state three times.
 * A field in the past means that event is over.
 */
export type Flags = {
  now: number
  /** A main-loop turn is running (from your prompt until the turn completes). */
  isWorking: boolean
  /** A permission dialog, an AskUserQuestion or a plan approval is waiting on you. */
  isWaiting: boolean
  /** Session just started: waving. */
  greetUntil: number
  /** You just sent a prompt: nod / blink ("got it"). */
  ackUntil: number
  /** A tool failed, was denied, or the turn was interrupted / errored. */
  failedUntil: number
  /** The turn just finished with an answer. */
  reviewUntil: number
}

/**
 * Which animation Claude 娘 plays right now. Called on every frame: pure and cheap.
 *
 * The Codex app's order: waiting > failed > review > running > idle.
 * The two one-shots Codex has no task state for slot in where they can be seen:
 * the "got it" nod plays just before work starts (else 'running' would always
 * hide it), and the greeting only while nothing else is going on.
 * ('running-left' / 'running-right' are the band's walk, chosen elsewhere.)
 */
export function pickState(f: Flags): StateName {
  if (f.isWaiting) return 'waiting'
  if (f.failedUntil > f.now) return 'failed'
  if (f.reviewUntil > f.now) return 'review'
  if (f.ackUntil > f.now) return 'jumping'
  if (f.isWorking) return 'running'
  if (f.greetUntil > f.now) return 'waving'
  return 'idle'
}
