const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const appUrl = 'https://ccsp-egmas.sf-express.com/cx-app-member/member/app/user/universalSign'

async function execute(file, preferences, fetch, request) {
  const notifications = []
  const logs = []
  let done
  const complete = new Promise(resolve => { done = resolve })
  const context = {
    $prefs: {
      valueForKey: key => preferences[key],
      setValueForKey: (value, key) => { preferences[key] = value; return true }
    },
    $task: { fetch },
    $request: request,
    $response: { body: JSON.stringify({ success: true, obj: { signed: true } }) },
    $notify: (...args) => notifications.push(args),
    $done: done,
    console: { log: value => logs.push(value) }
  }
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context)
  await complete
  return { notifications, logs }
}

function nativeAccount(id) {
  return {
    label: `账号 ${id}`,
    headers: { cookie: `_login_user_id_=${id}; auth=EXPIRED`, signature: 'OLD', timestamp: 'OLD' },
    app: {
      url: appUrl,
      headers: { sytToken: `native-${id}` },
      body: ` {"userId":"${id}","name":"mcs-mimp-web.sf-express.com"} `
    }
  }
}

function response(obj, statusCode = 200, headers = {}) {
  return { statusCode, headers, body: JSON.stringify({ success: true, obj }) }
}

test('captures exact native request locally, strips transport cookies, ignores other features', async () => {
  const preferences = {}
  const body = ' {"userId":"user-A", "mobile":"0000001234", "name":"mcs-mimp-web.sf-express.com"} '
  const result = await execute('scripts/sfexpress.cookie.js', preferences, null, {
    url: appUrl, body, headers: { Cookie: 'DO_NOT_COPY', 'Content-Length': '123', sytToken: 'PRIVATE_NATIVE_TOKEN' }
  })
  const saved = JSON.parse(preferences.sfexpress_app_sessions).accounts['user-A']
  assert.equal(saved.app.body, body)
  assert.equal(saved.app.headers.sytToken, 'PRIVATE_NATIVE_TOKEN')
  assert.equal(saved.app.headers.Cookie, undefined)
  assert.equal(saved.app.headers['Content-Length'], undefined)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_NATIVE_TOKEN|DO_NOT_COPY/)
  const before = preferences.sfexpress_app_sessions
  await execute('scripts/sfexpress.cookie.js', preferences, null, {
    url: appUrl, body: JSON.stringify({ name: 'unrelated.sf-express.com', userId: 'B' }), headers: {}
  })
  assert.equal(preferences.sfexpress_app_sessions, before)
})

test('replaces expired Web cookies using a fresh sign for each account and isolates accounts', async () => {
  const a = nativeAccount('A')
  const b = nativeAccount('B')
  const preferences = { sfexpress_app_sessions: JSON.stringify({ accounts: { A: a, B: b } }) }
  const calls = []
  let current
  const result = await execute('scripts/sfexpress.js', preferences, async request => {
    calls.push(request)
    assert.equal(request.opts['auto-cookie'], false)
    if (request.url === appUrl) {
      current = JSON.parse(request.body).userId
      assert.equal(request.body, current === 'A' ? a.app.body : b.app.body)
      assert.equal(request.headers.sytToken, `native-${current}`)
      return response({ sign: `FRESH+/${current}` })
    }
    if (request.url.includes('/shareRedirect?')) {
      assert.match(request.url, /sign=FRESH%2B%2F[AB]/)
      assert.equal(request.headers.cookie, '')
      return response(null, 302, { Location: '/mcs-mimp/finish', 'Set-Cookie': `auth=NEW-${current}; Expires=Wed, 23 Oct 2030 00:00:00 GMT; Path=/` })
    }
    if (request.url.endsWith('/finish')) {
      assert.equal(request.headers.cookie, `auth=NEW-${current}`)
      return response(null, 302, { 'set-cookie': [`_login_user_id_=${current}; Path=/`, 'another=ok; Path=/'] })
    }
    assert.match(request.headers.cookie, new RegExp(`auth=NEW-${current}`))
    assert.doesNotMatch(request.headers.cookie, /EXPIRED/)
    assert.equal(request.headers.signature, undefined)
    assert.equal(request.headers.timestamp, undefined)
    if (request.url.endsWith('getTodaySign')) return response({ signed: false })
    if (request.url.endsWith('~sign')) return response({ signed: true, dayCount: 2 })
    return response({ taskTitleLevels: [] })
  })
  assert.equal(calls.filter(call => call.url === appUrl).length, 2)
  assert.equal(result.notifications.length, 1)
  assert.match(result.notifications[0][1], /2\/2/)
})

test('stops before signing when native auth expires or returns another account', async () => {
  for (const scenario of ['expired', 'wrong-account', 'foreign-redirect']) {
    const preferences = { sfexpress_app_sessions: JSON.stringify({ accounts: { A: nativeAccount('A') } }) }
    const calls = []
    const result = await execute('scripts/sfexpress.js', preferences, async request => {
      calls.push(request)
      if (request.url === appUrl) {
        if (scenario === 'expired') return { statusCode: 200, body: '{"success":false,"errorMessage":"PRIVATE"}' }
        return response({ sign: 'FRESH' })
      }
      if (scenario === 'foreign-redirect') return response(null, 302, { location: 'https://example.com/collect' })
      return response(null, 302, { 'set-cookie': '_login_user_id_=B; Path=/' })
    })
    assert.equal(calls.length, scenario === 'expired' ? 1 : 2)
    assert.match(result.notifications[0][1], /0\/1/)
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE/)
  }
})

test('preserves legacy Web-only accounts', async () => {
  const preferences = { sfexpress_web_session: JSON.stringify({ cookie: '_login_user_id_=A; auth=old' }) }
  const result = await execute('scripts/sfexpress.js', preferences, async request => {
    assert.match(request.headers.cookie, /auth=old/)
    return response(request.url.endsWith('getTodaySign') ? { signed: true } : { taskTitleLevels: [] })
  })
  assert.match(result.notifications[0][1], /1\/1/)
})

test('only claims ready tasks and never reports unfinished business actions as completed', async () => {
  const preferences = { sfexpress_web_session: JSON.stringify({ cookie: '_login_user_id_=A' }) }
  const claimed = []
  const result = await execute('scripts/sfexpress.js', preferences, async request => {
    assert.doesNotMatch(request.url, /finishTask/)
    if (request.url.endsWith('getTodaySign')) return response({ signed: true })
    if (request.url.endsWith('fetchIntegral')) {
      const task = JSON.parse(request.body)
      claimed.push(task.taskId)
      if (task.taskId === 'stale') return { statusCode: 200, body: '{"success":false,"errorMessage":"任务未完成"}' }
      return response(null)
    }
    return response({ taskTitleLevels: [
      { status: 1, taskId: 'ready', taskCode: 'ready-code', strategyId: 1 },
      { status: 1, taskId: 'stale', taskCode: 'stale-code', strategyId: 2 },
      { status: 2, taskId: 'shipment', taskCode: 'shipment-code', strategyId: 3 },
      { status: 3, taskId: 'claimed', taskCode: 'claimed-code', strategyId: 4 }
    ] })
  })
  assert.deepEqual(claimed, ['ready', 'stale'])
  assert.match(result.notifications[0][2], /领取 1 项，待完成 2 项/)
  assert.doesNotMatch(JSON.stringify(result.logs), /任务未完成/)
  assert.doesNotMatch(result.notifications[0][2], /领取失败/)
})

test('reports an auth rejection code and category without leaking server-echoed credentials', async () => {
  const preferences = { sfexpress_app_sessions: JSON.stringify({ accounts: { A: nativeAccount('A') } }) }
  const result = await execute('scripts/sfexpress.js', preferences, async () => ({
    statusCode: 401,
    body: JSON.stringify({ success: false, errorCode: 'SESSION_EXPIRED', errorMessage: '登录态失效 token=PRIVATE_COOKIE' })
  }))
  assert.match(result.notifications[0][2], /HTTP 401，错误码 SESSION_EXPIRED，登录态无效或过期/)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE_COOKIE/)
})
