const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const scripts = path.join(__dirname, '..', 'scripts')
const nativeUrl = 'https://ccsp-egmas.sf-express.com/cx-app-member/member/app/user/universalSign'
const key = 'sfexpress_web_sessions'
const json = obj => ({ statusCode: 200, headers: {}, body: JSON.stringify(obj) })
const success = obj => json({ success: true, obj })
const sample = token => ({ at: Date.now() - 139 * 60000, request: {
  url: nativeUrl, method: 'POST', body: '{"name":"mcs-mimp-web.sf-express.com"}',
  headers: { token, sytToken: 'private-syt', requestSign: 'private-signature', timeInterval: 'original-time', deviceId: 'device', 'Content-Type': 'application/json', 'Content-Length': '100' },
} })
const account = id => ({ headers: { cookie: `_login_user_id_=${id}; session=old`, signature: 'old-web-sign', timestamp: 'old-time', deviceid: 'web-device' }, label: `账号尾号 ${id}` })

async function run(store, fetch, file = 'sfexpress.js', extra = {}) {
  const calls = []
  const output = []
  await new Promise((resolve, reject) => {
    try {
      vm.runInNewContext(fs.readFileSync(path.join(scripts, file), 'utf8'), {
        $prefs: {
          valueForKey: name => store[name],
          setValueForKey: (value, name) => { store[name] = value; return true },
        },
        $task: { fetch: async request => { calls.push(request); return fetch(request) } },
        $notify: (...args) => output.push(args.join('\n')),
        console: { log: line => output.push(line) },
        $done: resolve,
        ...extra,
      })
    } catch (error) { reject(error) }
  })
  return { calls, output: output.join('\n') }
}

test('reuses tested native request, collects redirect cookies, and preserves task request flow', async () => {
  const native = sample('private-token')
  const store = {
    [key]: JSON.stringify({ accounts: { '5031': account('5031') } }),
    sfexpress_auth_diagnostics_v1: JSON.stringify({ events: [{ ...native, route: 'universalSign', phase: 'request' }] }),
  }
  const fetch = request => {
    if (request.url === nativeUrl) {
      assert.equal(request.headers.requestSign, native.request.headers.requestSign)
      assert.equal(request.headers.timeInterval, 'original-time')
      assert.equal(request.headers['Content-Length'], undefined)
      assert.equal(request.body, native.request.body)
      assert.equal(request.opts.redirection, false)
      return success({ sign: 'private-ticket' })
    }
    if (request.url.includes('/shareRedirect?')) {
      assert.equal(request.headers.token, undefined)
      assert.equal(request.headers.Cookie, undefined)
      assert.ok(request.url.includes('sign=private-ticket'))
      return { statusCode: 302, headers: { 'Set-Cookie': '_login_user_id_=5031; Path=/; Expires=Wed, 21 Oct 2037 07:28:00 GMT, session=new; Path=/', Location: '/member/home' } }
    }
    if (request.url.endsWith('/member/home')) {
      assert.equal(request.headers.Cookie, '_login_user_id_=5031; session=new')
      return { statusCode: 200, headers: { 'set-cookie': ['extra=value; Path=/'] }, body: '' }
    }
    assert.ok(request.headers.cookie.includes('session=new'))
    assert.equal(request.headers.signature, undefined)
    assert.equal(request.headers.timestamp, undefined)
    if (request.url.endsWith('getTodaySign')) return success({ signed: false })
    if (request.url.endsWith('~sign')) return success({ signed: true, dayCount: 2 })
    if (request.url.endsWith('queryPointTaskAndSignFromES')) return success({ taskTitleLevels: [
      { status: 1, strategyId: 10, taskId: 'claim', taskCode: 'C' },
      { status: 2, strategyId: 20, taskId: 'finish', taskCode: 'F' },
      { status: 3, strategyId: 30, taskId: 'skip', taskCode: 'S' },
    ] })
    return success(null)
  }
  const result = await run(store, fetch)
  assert.ok(result.output.includes('每日任务领取 2 项，未完成 0 项｜App 换票已更新'))
  const tasks = result.calls.filter(item => /queryPointTaskAndSignFromES|finishTask|fetchIntegral/.test(item.url))
  assert.deepEqual(tasks.map(item => JSON.parse(item.body)), [
    { channelType: '1', deviceId: 'web-device' },
    { strategyId: 10, taskId: 'claim', taskCode: 'C', channelType: '1' },
    { taskCode: 'F' },
    { strategyId: 20, taskId: 'finish', taskCode: 'F', channelType: '1' },
  ])
  assert.equal(JSON.parse(store[key]).accounts['5031'].nativeRequest.request.headers.token, 'private-token')
  assert.ok(!result.output.includes('private-'))
  // Clearing temporary diagnostics must not remove the validated reusable request.
  delete store.sfexpress_auth_diagnostics_v1
  const again = await run(store, fetch)
  assert.equal(again.calls[0].url, nativeUrl)
})

test('binds refreshed Web cookies only to their matching account; revoked account keeps its own session', async () => {
  const first = account('5031')
  first.nativeRequest = sample('revoked-token')
  const store = {
    [key]: JSON.stringify({ accounts: { '5031': first, '1828': account('1828') } }),
    sfexpress_native_requests: JSON.stringify([sample('working-token')]),
  }
  const result = await run(store, request => {
    if (request.url === nativeUrl) {
      return request.headers.token === 'revoked-token' ? json({ success: false, message: 'private-error-token' }) : success({ sign: 'private-ticket' })
    }
    if (request.url.includes('/shareRedirect?')) return { statusCode: 302, headers: { 'set-cookie': ['_login_user_id_=1828; Path=/', 'session=1828-new; Path=/'], location: 'https://mcs-mimp-static.sf-express.com/page' } }
    if (request.url.endsWith('getTodaySign')) return success({ signed: true })
    if (request.url.endsWith('queryPointTaskAndSignFromES')) return success({ taskTitleLevels: [] })
    throw Error('unexpected endpoint')
  })
  const saved = JSON.parse(store[key]).accounts
  assert.equal(saved['5031'].headers.cookie, first.headers.cookie)
  assert.ok(saved['1828'].headers.cookie.includes('session=1828-new'))
  assert.equal(saved['1828'].nativeRequest.request.headers.token, 'working-token')
  assert.ok(!result.calls.some(item => item.url.startsWith('https://mcs-mimp-static')))
  assert.ok(result.output.includes('App 换票未成功，使用原 Web 会话'))
  assert.ok(!result.output.includes('private-error-token'))
})

test('rejects unmatched identity and unauthenticated off-host redirect without overwriting accounts', async () => {
  for (const response of [
    { statusCode: 302, headers: { location: 'https://example.com/private-ticket' } },
    { statusCode: 200, headers: { 'set-cookie': '_login_user_id_=someone-else; Path=/' } },
  ]) {
    const store = { [key]: JSON.stringify({ accounts: { '5031': account('5031') } }), sfexpress_native_requests: JSON.stringify([sample('private-token')]) }
    const before = store[key]
    const result = await run(store, request => {
      if (request.url === nativeUrl) return success({ sign: 'private-ticket' })
      if (request.url.includes('/shareRedirect?')) return response
      if (request.url.endsWith('getTodaySign')) return success({ signed: true })
      if (request.url.endsWith('queryPointTaskAndSignFromES')) return success({ taskTitleLevels: [] })
      throw Error('unexpected endpoint')
    })
    assert.equal(store[key], before)
    assert.ok(!result.calls.some(item => item.url.startsWith('https://example.com')))
  }
})

test('without native samples uses original Web flow and notification', async () => {
  const store = { [key]: JSON.stringify({ accounts: { '5031': account('5031') } }) }
  const result = await run(store, request => request.url.endsWith('getTodaySign') ? success({ signed: true, dayCount: 1 }) : success({ taskTitleLevels: [] }))
  assert.equal(result.calls.length, 2)
  assert.ok(result.output.includes('今日已签到，连续 1 天｜每日任务领取 0 项，未完成 0 项'))
  assert.ok(!result.output.includes('App 换票'))
})

test('matching identity is insufficient when the refreshed Web login is invalid', async () => {
  const store = { [key]: JSON.stringify({ accounts: { '5031': account('5031') } }), sfexpress_native_requests: JSON.stringify([sample('private-token')]) }
  const before = store[key]
  const result = await run(store, request => {
    if (request.url === nativeUrl) return success({ sign: 'private-ticket' })
    if (request.url.includes('/shareRedirect?')) return { statusCode: 200, headers: { 'set-cookie': ['_login_user_id_=5031; Path=/', 'session=invalid; Path=/'] } }
    if (request.url.endsWith('getTodaySign')) {
      return request.headers.cookie.includes('session=invalid') ? json({ success: false, message: 'private-server-error' }) : success({ signed: true })
    }
    return success({ taskTitleLevels: [] })
  })
  assert.equal(store[key], before)
  assert.ok(!result.output.includes('App 换票已更新'))
  assert.ok(!result.output.includes('private-server-error'))
})

test('native capture stays local and Web recapture preserves validated native binding', async () => {
  const native = sample('private-token')
  const original = account('5031')
  original.nativeRequest = native
  const store = { [key]: JSON.stringify({ accounts: { '5031': original } }) }
  const result = await run(store, () => {}, 'sfexpress.native-cookie.js', { $request: native.request })
  assert.equal(JSON.parse(store.sfexpress_native_requests)[0].request.headers.token, 'private-token')
  assert.ok(!result.output.includes('private-token'))
  await run(store, () => {}, 'sfexpress.cookie.js', {
    $request: { headers: { Cookie: '_login_user_id_=5031; _login_mobile_=13800005031' } },
    $response: { body: '{"success":true,"obj":{"signed":true}}' },
  })
  assert.deepEqual(JSON.parse(store[key]).accounts['5031'].nativeRequest, native)
})
