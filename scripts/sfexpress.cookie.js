// Capture native member authentication requests and confirmed Web sessions per account.
const sessionsKey = 'sfexpress_web_sessions'
const legacyKey = 'sfexpress_web_session'
const appSessionsKey = 'sfexpress_app_sessions'
const taskContextsKey = 'sfexpress_task_contexts'
const requestHeaders = $request.headers || {}

function cookieValue(cookie, name) {
  const item = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${name}=`))
  return item ? item.slice(name.length + 1) : ''
}

function accountId(headers) {
  return cookieValue(headers.cookie || headers.Cookie || '', '_login_user_id_')
}

function accountLabel(headers, id) {
  const mobile = cookieValue(headers.cookie || headers.Cookie || '', '_login_mobile_')
  let digits = mobile
  try { digits = decodeURIComponent(mobile) } catch (_) {}
  digits = digits.replace(/\D/g, '')
  return `账号尾号 ${digits.slice(-4) || id.slice(-4)}`
}

function main() {
  if (/^https:\/\/mcs-mimp-web\.sf-express\.com\/mcs-mimp\/commonPost\/~memberNonactivity~integralTaskStrategyService~queryPointTaskAndSignFromES(?:\?|$)/.test($request.url || '')) {
    const body = JSON.parse($request.body || '{}')
    const id = accountId(requestHeaders)
    if (!id || typeof body.deviceId !== 'string' || !body.deviceId || !['1', '2', '3', '4'].includes(String(body.channelType))) return
    const raw = $prefs.valueForKey(taskContextsKey)
    const state = raw ? JSON.parse(raw) : { accounts: {} }
    if (!state.accounts || typeof state.accounts !== 'object' || Array.isArray(state.accounts)) throw new Error('每日任务设备信息格式错误')
    const context = { deviceId: body.deviceId, channelType: String(body.channelType) }
    const changed = JSON.stringify(state.accounts[id]) !== JSON.stringify(context)
    state.accounts[id] = context
    if (!$prefs.setValueForKey(JSON.stringify(state), taskContextsKey)) throw new Error('每日任务设备信息保存失败')
    if (changed) $notify('顺丰速运', `${accountLabel(requestHeaders, id)} 每日任务设备信息已保存`, '查询任务和领取积分将使用网页实际的设备标识')
    return
  }
  if (/^https:\/\/ccsp-egmas\.sf-express\.com\/cx-app-member\/member\/app\/user\/universalSign(?:\?|$)/.test($request.url || '')) {
    const body = JSON.parse($request.body || '{}')
    // This endpoint also signs other App features; capture only the member site.
    if (body.name !== 'mcs-mimp-web.sf-express.com') return
    if (!body.userId) throw new Error('原生认证请求缺少账号标识')
    const raw = $prefs.valueForKey(appSessionsKey)
    const state = raw ? JSON.parse(raw) : { accounts: {} }
    if (!state.accounts || typeof state.accounts !== 'object' || Array.isArray(state.accounts)) {
      throw new Error('已保存的 App 账号列表格式错误')
    }
    const headers = {}
    for (const name of Object.keys(requestHeaders)) {
      if (!/^(cookie|host|content-length|connection|accept-encoding|:.*)$/i.test(name)) headers[name] = requestHeaders[name]
    }
    const id = String(body.userId)
    const digits = String(body.mobile || '').replace(/\D/g, '')
    const label = `账号尾号 ${digits.slice(-4) || id.slice(-4)}`
    state.accounts[id] = { id, label, app: { url: $request.url, headers, body: $request.body } }
    if (!$prefs.setValueForKey(JSON.stringify(state), appSessionsKey)) throw new Error('App 认证请求保存失败')
    $notify('顺丰速运', `${label} App 认证请求已保存`, '请运行签到任务；还需间隔超过 15 分钟验证是否可持续换取会话')
    return
  }
  let response
  try { response = JSON.parse($response.body) } catch (_) {}
  if (!response || response.success !== true || !response.obj || typeof response.obj.signed !== 'boolean') {
    $notify('顺丰速运', '会话未更新', '签到页未返回有效登录状态，请退出并重新进入')
    return
  }

  const saved = {}
  for (const name of ['cookie', 'channel', 'deviceid', 'platform', 'syscode', 'user-agent', 'referer', 'signature', 'timestamp']) {
    const actual = Object.keys(requestHeaders).find(header => header.toLowerCase() === name)
    if (actual) saved[name] = requestHeaders[actual]
  }
  const id = accountId(saved)
  if (!id) {
    $notify('顺丰速运', '会话未更新', '请求中缺少账号标识，请重新登录后打开签到页')
    return
  }

  const raw = $prefs.valueForKey(sessionsKey)
  const state = raw ? JSON.parse(raw) : { accounts: {} }
  if (!state.accounts || typeof state.accounts !== 'object' || Array.isArray(state.accounts)) {
    throw new Error('已保存的账号列表格式错误')
  }
  const legacy = $prefs.valueForKey(legacyKey)
  if (legacy) {
    const oldHeaders = JSON.parse(legacy)
    const oldId = accountId(oldHeaders)
    if (oldId && !state.accounts[oldId]) {
      state.accounts[oldId] = { headers: oldHeaders, label: accountLabel(oldHeaders, oldId) }
    }
  }
  const label = accountLabel(saved, id)
  state.accounts[id] = { headers: saved, label }
  if ($prefs.setValueForKey(JSON.stringify(state), sessionsKey)) {
    $notify('顺丰速运', `${label} 会话已更新`, `已保存 ${Object.keys(state.accounts).length} 个账号`)
  } else {
    $notify('顺丰速运', `${label} 会话保存失败`, '请检查 Quantumult X 设置')
  }
}

try { main() } catch (error) {
  console.log(`顺丰速运会话保存失败：${error.message}`)
  $notify('顺丰速运', '会话保存失败', error.message)
}
$done({})
