const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const root = path.join(__dirname, '..', 'scripts')
const key = 'sfexpress_auth_diagnostics_v1'
const base = 'https://ccsp-egmas.sf-express.com/cx-app-member/member/app/user/'

function run(file, store, globals = {}) {
  const output = []
  const done = []
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), {
    $prefs: {
      valueForKey: name => store[name],
      setValueForKey: (value, name) => { store[name] = value; return true },
      removeValueForKey: name => delete store[name],
    },
    $notify: (...args) => output.push(args.join(' ')),
    console: { log: message => output.push(message) },
    $done: value => done.push(value),
    ...globals,
  })
  assert.equal(done.length, 1)
  return { output: output.join('\n'), done }
}

test('captures exact native request/response locally and passes traffic through', () => {
  const store = {}
  const request = { url: base + 'universalSign', method: 'POST', headers: { token: 'secret-token' }, body: '{"mobile":"13800000000"}' }
  let result = run('sfexpress.auth-capture.js', store, { $request: request })
  assert.equal(JSON.stringify(result.done), '[{}]')
  result = run('sfexpress.auth-capture.js', store, { $request: request, $response: { statusCode: 200, body: '{"success":true,"obj":{"sign":"secret-sign"}}' } })
  const state = JSON.parse(store[key])
  assert.deepEqual(state.events[0].request, request)
  assert.equal(state.events[1].response.statusCode, 200)
  assert.ok(!result.output.includes('secret'))
  const report = run('sfexpress.auth-report.js', store).output
  assert.ok(report.includes('success=true，sign=有'))
  for (const value of ['secret-token', 'secret-sign', '13800000000']) assert.ok(!report.includes(value))
})

test('does not retain login passwords, OTP, headers or unrelated response fields', () => {
  const store = {}
  const request = { url: base + 'loginOrRegister', headers: { authorization: 'private-header' }, body: '{"password":"private-password","otp":"123456"}' }
  run('sfexpress.auth-capture.js', store, { $request: request })
  assert.equal(store[key], undefined)
  run('sfexpress.auth-capture.js', store, { $request: request, $response: { statusCode: 200, body: JSON.stringify({ obj: { result: { token: 'private-token', salt: 'private-salt', address: 'private-address', password: 'private-password' } } }) } })
  assert.deepEqual(JSON.parse(store[key]).events[0].login, { '$.obj.result.token': 'private-token', '$.obj.result.salt': 'private-salt' })
  for (const value of ['private-header', 'private-password', '123456', 'private-address']) assert.ok(!store[key].includes(value))
  assert.ok(!run('sfexpress.auth-report.js', store).output.includes('private-'))
})

test('caps events, drops aged samples and ignores unrelated endpoints', () => {
  const store = { [key]: JSON.stringify({ version: 1, events: [{ at: 0, route: 'old' }] }) }
  const request = { url: base + 'universalSign', method: 'POST', headers: {} }
  for (let i = 0; i < 30; i++) run('sfexpress.auth-capture.js', store, { $request: request })
  assert.equal(JSON.parse(store[key]).events.length, 24)
  assert.ok(!store[key].includes('"old"'))
  const before = store[key]
  run('sfexpress.auth-capture.js', store, { $request: { url: 'https://example.com/universalSign' } })
  assert.equal(store[key], before)
})

test('oversized and malformed inputs never leak in errors; cleanup only removes diagnostics', () => {
  const store = { sfexpress_web_sessions: 'keep-original-accounts' }
  const request = { url: base + 'universalSign', body: 's'.repeat(140000) }
  run('sfexpress.auth-capture.js', store, { $request: request })
  assert.equal(store[key], undefined)
  store[key] = 'malformed-private-data'
  assert.ok(!run('sfexpress.auth-report.js', store).output.includes('malformed-private-data'))
  run('sfexpress.auth-clear.js', store)
  assert.equal(store[key], undefined)
  assert.equal(store.sfexpress_web_sessions, 'keep-original-accounts')
})
