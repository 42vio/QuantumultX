const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')
const scripts = path.join(__dirname, '..', 'scripts')
const ok = obj => ({ statusCode: 200, body: JSON.stringify({ success: true, obj }) })
const bad = message => ({ statusCode: 200, body: JSON.stringify({ success: false, errorMessage: message }) })
const task = (status, extra = {}) => ({ status, taskId: 'id', taskCode: 'code', strategyId: 1, title: '点击合作任务', actionType: '07', buttonRedirect: '/partner', ...extra })
function storeForTasks() {
  return {
    sfexpress_web_sessions: JSON.stringify({ accounts: { accountA: { label: '账号尾号 5031', headers: { cookie: '_login_user_id_=accountA', deviceid: 'native-device' } } } }),
    sfexpress_task_contexts: JSON.stringify({ accounts: { accountA: { deviceId: 'h5-device', channelType: '1' }, accountB: { deviceId: 'other-device' } } }),
  }
}
async function run(store, fetch, filename = 'sfexpress.js', extra = {}) {
  const calls = []
  const output = []
  await new Promise(resolve => vm.runInNewContext(fs.readFileSync(path.join(scripts, filename), 'utf8'), {
    $prefs: { valueForKey: key => store[key], setValueForKey: (value, key) => { store[key] = value; return true } },
    $task: { fetch: async request => {
      calls.push(request)
      if (request.url.endsWith('getTodaySign')) return ok({ signed: true, dayCount: 1 })
      return fetch(request)
    } },
    $notify: (...args) => output.push(args.join('\n')),
    console: { log: message => output.push(message) },
    $done: resolve,
    ...extra,
  }))
  return { calls, output: output.join('\n') }
}

test('query and claim use the captured H5 device for this account; completed business tasks can be claimed', async () => {
  const result = await run(storeForTasks(), request => {
    const body = JSON.parse(request.body)
    assert.equal(body.deviceId, 'h5-device')
    if (request.url.endsWith('queryPointTaskAndSignFromES')) return ok({ taskTitleLevels: [task(1, { title: '寄一单国际件', actionType: '0107' })] })
    assert.equal(request.url.endsWith('fetchIntegral'), true)
    assert.equal(body.channelType, undefined)
    return ok(null)
  })
  assert.ok(result.output.includes('每日任务领取 1 项'))
  assert.ok(!result.calls.some(request => request.url.endsWith('finishTask')))
})

test('unfinished business actions and video entries are not sent to generic completion or claim', async () => {
  const entries = [
    ['用行业模板寄件下单', '0507'], ['寄一单国际件', '0107'], ['去新增一个收件偏好', '0508'],
    ['设置你的顺丰ID', '0509'], ['领任意生活特权福利', '0506'], ['参与积分活动', '0504'],
    ['每月累计寄件', '0106'], ['参与积分活动', '0504'], ['完成每月任务', '0901'],
  ].map(([title, actionType], index) => task(2, { title, actionType, taskId: String(index) }))
  entries.push({ status: 2, title: '看小丰TV趣味视频' })
  const result = await run(storeForTasks(), request => {
    assert.ok(request.url.endsWith('queryPointTaskAndSignFromES'))
    return ok({ taskTitleLevels: entries })
  })
  assert.equal(result.calls.length, 2)
  assert.ok(result.output.includes('每日任务领取 0 项，需手动 10 项'))
  assert.ok(!result.output.includes('请求失败'))
})

test('after click completion succeeds, only claim if a requery confirms the exact task is ready', async () => {
  let queries = 0
  const result = await run(storeForTasks(), request => {
    if (request.url.endsWith('queryPointTaskAndSignFromES')) return ok({ taskTitleLevels: [task(++queries === 1 ? 2 : 1)] })
    return ok(null)
  })
  assert.deepEqual(result.calls.slice(1).map(request => request.url.split('~').pop().split('/').pop()), [
    'queryPointTaskAndSignFromES', 'finishTask', 'queryPointTaskAndSignFromES', 'fetchIntegral',
  ])
  assert.ok(result.output.includes('每日任务领取 1 项'))
})

test('accepted completion with unchanged state must not trigger claim or count a reward', async () => {
  const result = await run(storeForTasks(), request => request.url.endsWith('queryPointTaskAndSignFromES') ? ok({ taskTitleLevels: [task(2)] }) : ok(null))
  assert.ok(!result.calls.some(request => request.url.endsWith('fetchIntegral')))
  assert.ok(result.output.includes('每日任务领取 0 项，需手动 0 项，待确认 1 项'))
  assert.ok(result.output.includes('服务端尚未确认可领取'))
})

test('completion and requery failures are reported at their actual stage without claiming', async () => {
  for (const stage of ['finishTask', 'requery']) {
    let queries = 0
    const result = await run(storeForTasks(), request => {
      if (request.url.endsWith('queryPointTaskAndSignFromES')) {
        if (++queries > 1 && stage === 'requery') return bad('复查失败')
        return ok({ taskTitleLevels: [task(2)] })
      }
      return stage === 'finishTask' ? bad('完成失败') : ok(null)
    })
    assert.ok(!result.calls.some(request => request.url.endsWith('fetchIntegral')))
    assert.ok(result.output.includes('失败 1 项'))
    assert.ok(result.output.includes(stage === 'finishTask' ? '完成任务失败' : '状态复查失败'))
  }
})

test('duplicate codes from another strategy and already claimed states cannot cause a wrong claim', async () => {
  for (const refreshed of [task(1, { strategyId: 2 }), task(3)]) {
    let queries = 0
    const result = await run(storeForTasks(), request => request.url.endsWith('queryPointTaskAndSignFromES') ? ok({ taskTitleLevels: [++queries === 1 ? task(2) : refreshed] }) : ok(null))
    assert.ok(!result.calls.some(request => request.url.endsWith('fetchIntegral')))
    assert.ok(result.output.includes('每日任务领取 0 项'))
  }
})

test('task context capture is account-specific, does not retain credentials, and passes through', async () => {
  const store = storeForTasks()
  const before = store.sfexpress_web_sessions
  const request = {
    url: 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/~memberNonactivity~integralTaskStrategyService~queryPointTaskAndSignFromES',
    headers: { Cookie: '_login_user_id_=accountB; token=private-cookie', token: 'private-token' },
    body: JSON.stringify({ deviceId: 'new-h5-device', channelType: '1', private: 'private-body' }),
  }
  const result = await run(store, () => { throw Error('no network allowed') }, 'sfexpress.task-context.js', { $request: request })
  const saved = JSON.parse(store.sfexpress_task_contexts).accounts
  assert.equal(saved.accountA.deviceId, 'h5-device')
  assert.equal(saved.accountB.deviceId, 'new-h5-device')
  assert.equal(store.sfexpress_web_sessions, before)
  assert.ok(!store.sfexpress_task_contexts.includes('private-'))
  assert.ok(!result.output.includes('private-'))
  assert.equal(result.calls.length, 0)
})
