const base = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/'
const sessionsKey = 'sfexpress_web_sessions'
const legacyKey = 'sfexpress_web_session'
const signService = '~memberNonactivity~integralSignV2Service~'
const taskService = '~memberNonactivity~integralTaskStrategyService~'
const taskRoute = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonRoutePost/memberEs/taskRecord/finishTask'

function request(path, body, headers, absolute = false, requireObj = true) {
  return $task.fetch({
    url: absolute ? path : base + path,
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(response => {
    let data
    try {
      data = JSON.parse(response.body)
    } catch (_) {
      throw new Error(`${path.split('/').pop().split('~').pop()} 返回了非 JSON 响应（HTTP ${response.statusCode}）`)
    }
    if (!data || data.success !== true || data.notSuccess === true || (requireObj && data.obj == null)) {
      throw new Error(`${path.split('/').pop().split('~').pop()} 请求失败：${data && (data.errorMessage || data.message || data.msg) || `HTTP ${response.statusCode}`}`)
    }
    return data.obj
  })
}

function accountId(headers) {
  const cookie = headers.cookie || headers.Cookie || ''
  const item = cookie.split(';').map(part => part.trim()).find(part => part.startsWith('_login_user_id_='))
  return item ? item.slice('_login_user_id_='.length) : ''
}

function accountLabel(headers, id) {
  const cookie = headers.cookie || headers.Cookie || ''
  const item = cookie.split(';').map(part => part.trim()).find(part => part.startsWith('_login_mobile_='))
  let mobile = item ? item.slice('_login_mobile_='.length) : ''
  try { mobile = decodeURIComponent(mobile) } catch (_) {}
  const digits = mobile.replace(/\D/g, '')
  return `账号尾号 ${digits.slice(-4) || id.slice(-4)}`
}

function loadAccounts() {
  const raw = $prefs.valueForKey(sessionsKey)
  const state = raw ? JSON.parse(raw) : { accounts: {} }
  if (!state.accounts || typeof state.accounts !== 'object' || Array.isArray(state.accounts)) {
    throw new Error('已保存的账号列表格式错误')
  }
  const accounts = { ...state.accounts }
  const legacy = $prefs.valueForKey(legacyKey)
  if (legacy) {
    const headers = JSON.parse(legacy)
    const id = accountId(headers)
    if (id && !accounts[id]) accounts[id] = { headers, label: accountLabel(headers, id) }
  }
  return Object.values(accounts)
}

async function runAccount(account) {
  const headers = { ...account.headers }
  const label = account.label || '账号'
  let today
  try {
    today = await request(signService + 'getTodaySign', {}, headers)
  } catch (error) {
    if (!headers.signature && !headers.timestamp) throw error
    delete headers.signature
    delete headers.timestamp
    today = await request(signService + 'getTodaySign', {}, headers)
  }
  if (typeof today.signed !== 'boolean') throw new Error('今日签到状态格式已变化')

  let summary
  if (today.signed) {
    summary = `今日已签到，连续 ${today.dayCount || 0} 天`
  } else {
    const result = await request(signService + 'sign', {}, headers)
    if (result.signed !== true) throw new Error('签到接口未确认成功')
    summary = `签到成功，连续 ${result.dayCount || 0} 天`
  }

  let tasks = ''
  try {
    const result = await request(taskService + 'queryPointTaskAndSignFromES', {
      channelType: '1',
      deviceId: headers.deviceId || headers.deviceid || ''
    }, headers)
    if (!Array.isArray(result.taskTitleLevels)) throw new Error('每日任务列表格式已变化')
    const pending = result.taskTitleLevels.filter(task => task.status === 1 || task.status === 2)
    let claimed = 0
    let failed = 0
    for (const task of pending) {
      if (!task.taskCode || task.strategyId == null || !task.taskId) {
        failed++
        continue
      }
      try {
        if (task.status === 2) await request(taskRoute, { taskCode: task.taskCode }, headers, true, false)
        await request(taskService + 'fetchIntegral', {
          strategyId: task.strategyId,
          taskId: task.taskId,
          taskCode: task.taskCode,
          channelType: '1'
        }, headers, false, false)
        claimed++
      } catch (error) {
        failed++
        console.log(`${label} 每日任务 ${task.title || task.taskCode}：${error.message}`)
      }
    }
    tasks = `每日任务领取 ${claimed} 项，未完成 ${failed} 项`
  } catch (error) {
    tasks = `每日任务查询失败：${error.message}`
  }
  return { summary, tasks }
}

async function main() {
  const accounts = loadAccounts()
  if (!accounts.length) throw new Error('缺少会话，请先在顺丰 App 打开签到页')
  const lines = []
  let success = 0
  for (const account of accounts) {
    const label = account.label || '账号'
    try {
      const result = await runAccount(account)
      success++
      lines.push(`${label}：${result.summary}${result.tasks ? `｜${result.tasks}` : ''}`)
    } catch (error) {
      console.log(`顺丰速运 ${label}：${error.message}`)
      lines.push(`${label}：签到失败（${error.message}）`)
    }
  }
  $notify('顺丰速运', `签到成功 ${success}/${accounts.length} 个账号`, lines.join('\n'))
}

main().catch(error => {
  console.log(`顺丰速运：${error.message}`)
  $notify('顺丰速运', '签到失败', error.message)
}).finally(() => $done())
