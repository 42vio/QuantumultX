const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const code = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'sfexpress.auth-replay.js'), 'utf8')
const url = 'https://ccsp-egmas.sf-express.com/cx-app-member/member/app/user/universalSign'
function event(age, token = 'private-token', address = url) {
  return { at: Date.now() - age * 60000, route: 'universalSign', phase: 'request', request: {
    url: address, method: 'POST', body: '{"mobile":"private-mobile"}',
    headers: { Token: token, deviceId: 'private-device', requestSign: `private-sign-${age}`, timeInterval: `${age}`, 'Content-Length': '30', Host: 'ignored' },
  } }
}
async function run(events, fetch) {
  const calls = []
  const output = []
  const raw = JSON.stringify({ events })
  await new Promise(resolve => vm.runInNewContext(code, {
    $prefs: { valueForKey: () => raw },
    $task: { fetch: async request => { calls.push(request); return fetch(request) } },
    console: { log: line => output.push(line) },
    $notify: (...args) => output.push(args.join('\n')),
    $done: resolve,
  }))
  return { calls, output: output.join('\n') }
}

test('replays only two same-session samples preserving signatures/body; hides response secrets', async () => {
  const old = event(130)
  const fresh = event(0)
  const { calls, output } = await run([old, event(60, 'other-account'), fresh], () => ({ statusCode: 200, body: '{"success":true,"obj":{"sign":"private-new-sign"}}' }))
  assert.equal(calls.length, 2)
  assert.equal(calls[0].headers.requestSign, old.request.headers.requestSign)
  assert.equal(calls[1].headers.requestSign, fresh.request.headers.requestSign)
  assert.equal(calls[0].body, old.request.body)
  assert.equal(calls[0].headers.Host, undefined)
  assert.equal(calls[0].headers['Content-Length'], undefined)
  assert.equal(calls[0].opts.redirection, false)
  assert.equal(calls[0].opts['auto-cookie'], false)
  assert.ok(output.includes('success=true，sign=有'))
  assert.ok(!output.includes('private-'))
})

test('does not send missing, cross-account, young, or untrusted endpoint samples', async () => {
  for (const events of [[], [event(0)], [event(130, 'other-account'), event(0)], [event(1), event(0)], [event(130, 'private-token', 'https://example.com/'), event(0)]]) {
    const { calls } = await run(events, () => { throw Error('unexpected') })
    assert.equal(calls.length, 0)
  }
})

test('reports failure themes without printing server messages or network errors', async () => {
  const result = await run([event(130), event(0)], request => {
    if (request.headers.timeInterval === '130') return { statusCode: 200, body: '{"success":false,"errorMessage":"签名无效 private-server-secret"}' }
    throw Error('private-network-secret')
  })
  assert.ok(result.output.includes('提示涉及签名'))
  assert.ok(result.output.includes('网络请求失败'))
  assert.ok(!result.output.includes('private-'))
})
