import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'chibi-companion',
  component: 'Pane',
  requestId: 'chibi',
  props: {
    title: 'Claude ちゃん',
    isFocused: false,
    bodyColumns: 52,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const BAND = {
  plugin: 'chibi-companion',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isWorking: true,
    maxRows: 20,
    bodyColumns: 90,
    scroll: { offset: 0, bodyRows: 19 },
    view: {},
  },
} as const

function engine(on: Parameters<Parameters<typeof test>[1]>[1]) {
  mock.clock(on)
  mock.store(on)
  on('command.register', () => ({ value: { command: 'chibi' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.blit', () => ({ value: {} }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
}

test('the docked pane draws the big sprite and the tool it runs', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Read', file_path: '/repo/src/auth.ts' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster', key: 'sprite' })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /auth\.ts/ }))?.text).toContain('auth.ts')
  await ui.unmount()
})

test('the band draws the small sprite with a speech bubble', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster', key: 'sprite' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /chibi/ })).toBeDefined()
  await ui.unmount()
})

test('a band with too little room falls back to one line', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, maxRows: 6 }, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster', key: 'sprite' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /Claude ちゃん/ })).toBeDefined()
  await ui.unmount()
})

test('where frames can be read the pane draws the PNG as an Image', async ($, on) => {
  engine(on)
  on('fs.read', () => ({ value: { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Image', key: 'sprite' })).toBeDefined()
  expect(await ui.find({ type: 'Raster', key: 'sprite' })).toBeUndefined()
  await ui.unmount()
})

test('/chibi names the tmux settings that keep colours and the dock', async ($, on) => {
  engine(on)
  mock.env(on, { TMUX: '/tmp/tmux-501/default,1,0' })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const out = await $.command.run({ command: 'chibi', args: '' })
  expect(out.text).toContain('CLAUDE_CODE_TMUX_TRUECOLOR')
})

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

test('the picture grows with the room: a wider dock, a taller terminal', async ($, on) => {
  engine(on)
  on('fs.read', () => ({ value: { base64: PNG } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const rowsOf = async (mount: Parameters<typeof $.ui.mount>[0]) => {
    const ui = await $.ui.mount(mount)
    const img = await ui.find({ type: 'Image', key: 'sprite' })
    await ui.unmount()
    return Number(img?.props.rows)
  }
  const narrowDock = await rowsOf({ ...PANE, props: { ...PANE.props, bodyColumns: 40 }, surface: 'terminal' })
  const wideDock = await rowsOf({ ...PANE, props: { ...PANE.props, bodyColumns: 70 }, surface: 'terminal' })
  expect(wideDock).toBeGreaterThan(narrowDock)

  const shortBand = await rowsOf({ ...BAND, viewport: { columns: 95, rows: 30 }, surface: 'terminal' })
  const tallBand = await rowsOf({ ...BAND, viewport: { columns: 95, rows: 60 }, props: { ...BAND.props, maxRows: 30 }, surface: 'terminal' })
  expect(tallBand).toBeGreaterThan(shortBand)
  expect(tallBand).toBeLessThanOrEqual(18)
})

test('a short band keeps her face beside one line', async ($, on) => {
  engine(on)
  on('fs.read', () => ({ value: { base64: PNG } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, maxRows: 3 }, surface: 'terminal' })
  const img = await ui.find({ type: 'Image', key: 'sprite' })
  expect(img).toBeDefined()
  expect(Number(img?.props.rows)).toBe(3)
  expect(await ui.find({ type: 'Text', text: /Claude ちゃん/ })).toBeDefined()
  await ui.unmount()

  const one = await $.ui.mount({ ...BAND, props: { ...BAND.props, maxRows: 1 }, surface: 'terminal' })
  expect(await one.find({ type: 'Image', key: 'sprite' })).toBeUndefined()
  await one.unmount()
})

test('a prompt seats the pane that waited for room', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('command.register', () => ({ value: { command: 'chibi' } }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.blit', () => ({ value: {} }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  let opens = 0
  on('ui.open', () => {
    opens += 1
    return { value: { isPlaced: true } }
  })
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const before = opens

  await $.prompt.submit({ text: 'hi' })
  expect(opens).toBe(before + 1)
})
