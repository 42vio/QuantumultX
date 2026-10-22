const base = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/'
const sessionsKey = 'sfexpress_web_sessions'
const legacyKey = 'sfexpress_web_session'
const appSessionsKey = 'sfexpress_app_sessions'
const signService = '~memberNonactivity~integralSignV2Service~'
const taskService = '~memberNonactivity~integralTaskStrategyService~'
const taskRoute = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonRoutePost/memberEs/taskRecord/finishTask'

function request(path, body, headers, absolute = false, requireObj = true) {
  return $task.fetch({
    url: absolute ? path : base + path,
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    opts: { 'auto-cookie': false }
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
  const appRaw = $prefs.valueForKey(appSessionsKey)
  const appState = appRaw ? JSON.parse(appRaw) : { accounts: {} }
  if (!appState.accounts || typeof appState.accounts !== 'object' || Array.isArray(appState.accounts)) {
    throw new Error('已保存的 App 账号列表格式错误')
  }
  for (const id of Object.keys(appState.accounts)) accounts[id] = { ...accounts[id], ...appState.accounts[id] }
  return Object.entries(accounts).map(([id, account]) => ({ ...account, id }))
}

function headerValue(headers, name) {
  const key = Object.keys(headers || {}).find(key => key.toLowerCase() === name)
  return key ? headers[key] : ''
}

function authFailureDetail(response, data) {
  // Do not print arbitrary server messages: they may echo credentials or identifiers.
  const rawCode = data && (data.errorCode || data.code)
  const code = typeof rawCode === 'number' || typeof rawCode === 'string' && /^[a-z0-9_-]{1,64}$/i.test(rawCode) ? String(rawCode) : ''
  const message = data && (data.errorMessage || data.message || data.msg)
  let reason = '服务端未返回有效 sign'
  if (typeof message === 'string') {
    if (/签名|signature|requestSign|sytToken/i.test(message)) reason = '签名校验失败'
    else if (/登录|失效|过期|session|expired|login/i.test(message)) reason = '登录态无效或过期'
  }
  return `HTTP ${response.statusCode}${code ? `，错误码 ${code}` : ''}，${reason}`
}

async function createWebSession(account) {
  const app = account.app
  if (!app || !/^https:\/\/ccsp-egmas\.sf-express\.com\/cx-app-member\/member\/app\/user\/universalSign(?:\?|$)/.test(app.url)) {
    throw new Error('App 认证请求地址无效，请重新打开积分页')
  }
  // Native signatures cover the request: preserve the original body and headers.
  // Whether these signatures can be replayed long-term needs real-device testing.
  const response = await $task.fetch({
    url: app.url, method: 'POST', headers: app.headers, body: app.body,
    opts: { redirection: false, 'auto-cookie': false }
  })
  let data
  try { data = JSON.parse(response.body) } catch (_) { throw new Error(`App 换取会话返回非 JSON（HTTP ${response.statusCode}）`) }
  if (!data || data.success !== true || data.notSuccess === true || !data.obj || typeof data.obj.sign !== 'string' || !data.obj.sign) {
    const error = new Error(`App 换取会话失败（${authFailureDetail(response, data)}）；请先单独采集并运行此账号，再切换账号对比`)
    error.authRejected = true
    throw error
  }
  const cookies = {}
  // Public member-center route in the official download page configuration.
  const bizCode = '6@amVBcTNRL0R4TzJmeE5CNE96WHZFS3ZsS2dkSzB4Y3ZqVjBBblRtVHhiTT0='
  let url = `https://mcs-mimp-web.sf-express.com/mcs-mimp/share/app/shareRedirect?sign=${encodeURIComponent(data.obj.sign)}&source=SFAPP&bizCode=${encodeURIComponent(bizCode)}`
  const headers = {}
  const userAgent = headerValue(account.headers, 'user-agent') || headerValue(app.headers, 'user-agent')
  if (userAgent) headers['user-agent'] = userAgent
  for (let count = 0; count < 6; count++) {
    const result = await $task.fetch({
      url, method: 'GET', headers: { ...headers, cookie: Object.values(cookies).join('; ') },
      opts: { redirection: false, 'auto-cookie': false }
    })
    const setCookie = headerValue(result.headers, 'set-cookie')
    const values = Array.isArray(setCookie) ? setCookie : String(setCookie || '').split(/,(?=\s*[^\s;,=]+=)/)
    for (const value of values) {
      const pair = value.split(';')[0].trim()
      const index = pair.indexOf('=')
      if (index <= 0) continue
      const name = pair.slice(0, index)
      if (/;\s*max-age=0(?:;|$)/i.test(value) || !pair.slice(index + 1)) delete cookies[name]
      else cookies[name] = pair
    }
    const cookie = Object.values(cookies).join('; ')
    const id = accountId({ cookie })
    if (id) {
      if (id !== account.id) throw new Error('换取的会话账号不匹配，已停止该账号签到')
      return { ...(account.headers || {}), ...headers, cookie }
    }
    const location = headerValue(result.headers, 'location')
    if (result.statusCode < 300 || result.statusCode >= 400 || !location) break
    if (location.startsWith('/') && !location.startsWith('//')) url = 'https://mcs-mimp-web.sf-express.com' + location
    else if (/^https:\/\/mcs-mimp-web\.sf-express\.com\//.test(location)) url = location
    else throw new Error('登录跳转到了其他站点，未继续发送会话')
  }
  throw new Error('App 登录跳转未返回账号 Cookie，需检查手机上的实际跳转流程')
}

async function runAccount(account) {
  let headers = { ...account.headers }
  let renewed = false
  let authError
  if (account.app) {
    try {
      headers = await createWebSession(account)
      renewed = true
    } catch (error) {
      // A rejected native request must not block an otherwise valid captured Web session.
      // Never fall back after an identity mismatch or an unexpected login redirect.
      if (!error.authRejected || accountId(headers) !== account.id) throw error
      authError = error
    }
  }
  if (renewed) {
    for (const key of Object.keys(headers)) {
      if (/^(signature|timestamp)$/i.test(key) || /^cookie$/i.test(key) && key !== 'cookie') delete headers[key]
    }
  }
  const label = account.label || '账号'
  let today
  try {
    today = await request(signService + 'getTodaySign', {}, headers)
  } catch (error) {
    try {
      if (!headers.signature && !headers.timestamp) throw error
      delete headers.signature
      delete headers.timestamp
      today = await request(signService + 'getTodaySign', {}, headers)
    } catch (webError) {
      if (authError) throw new Error(`${authError.message}；已保存的 Web 会话也未通过登录验证`)
      throw webError
    }
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
  if (authError) summary += '（使用已保存的 Web 会话，App 换票失败）'
  return { summary, tasks }
}

async function main() {
  const accounts = loadAccounts()
  if (!accounts.length) throw new Error('缺少会话，请更新重写后在顺丰 App 打开积分签到页')
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
