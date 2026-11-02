import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'chibi-companion',
  component: 'Pane',
  requestId: 'chibi',
  props: {
    title: 'Claude 娘',
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
  expect(await ui.find({ type: 'Text', text: /Claude 娘/ })).toBeDefined()
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
