// Temporary, passive Quantumult X diagnostic. Secrets stay in local $prefs.
// Never attach this storage value to a public issue or commit.
const storageKey = 'sfexpress_auth_diagnostics_v1'
const endpoint = /^https:\/\/ccsp-egmas\.sf-express\.com\/cx-app-member\/member\/app\/user\/(universalSign|signInAndSignUp|loginOrRegister)(?:\?|$)/
const now = Date.now()

function parse(value) {
  try { return JSON.parse(value) } catch (_) { return null }
}

// Login requests can contain passwords/OTP: never retain them or their headers.
// Only the token/salt fields needed for native signing are retained locally.
function loginFields(value, path, depth, result) {
  if (!value || typeof value !== 'object' || depth > 5) return
  Object.keys(value).forEach(key => {
    const item = value[key]
    if (/^(token|salt)$/i.test(key) && typeof item === 'string') {
      result[`${path}.${key}`] = item
    } else if (item && typeof item === 'object') {
      loginFields(item, `${path}.${key}`, depth + 1, result)
    }
  })
}

function main() {
  const match = endpoint.exec($request.url || '')
  if (!match) return
  const route = match[1]
  const responsePhase = typeof $response !== 'undefined'
  if (route !== 'universalSign' && !responsePhase) return
  let state = parse($prefs.valueForKey(storageKey))
  if (!state || state.version !== 1 || !Array.isArray(state.events)) {
    state = { version: 1, events: [] }
  }
  state.events = state.events.filter(event => event.at >= now - 24 * 60 * 60 * 1000)
  const event = { at: now, route, phase: responsePhase ? 'response' : 'request' }
  if (route === 'universalSign') {
    // Keep request/response events separately; do not guess pairing for concurrent traffic.
    event.request = { url: $request.url, method: $request.method, headers: $request.headers || {} }
    if (!responsePhase) event.request.body = $request.body || ''
    if (responsePhase) {
      event.response = { statusCode: $response.statusCode, body: $response.body || '' }
    }
  } else {
    const fields = {}
    loginFields(parse($response.body), '$', 0, fields)
    event.login = fields
    event.statusCode = $response.statusCode
  }
  // Bound storage and avoid retaining unexpectedly large server responses.
  if (JSON.stringify(event).length > 128 * 1024) {
    $notify('顺丰诊断', '样本过大，未保存', '原请求和响应已原样放行')
    return
  }
  state.events.push(event)
  state.events = state.events.slice(-24)
  if (!$prefs.setValueForKey(JSON.stringify(state), storageKey)) {
    $notify('顺丰诊断', '本地保存失败', '请检查 Quantumult X 存储')
    return
  }
  const count = state.events.filter(item => item.route === 'universalSign' && item.phase === 'request').length
  $notify('顺丰诊断', `${route} ${event.phase} 已采集`, `本地共 ${count} 个换票请求；不含凭据的摘要请运行报告脚本`)
}

try { main() } catch (_) {
  // Error text may include credentials. Never print exception objects or payloads.
  $notify('顺丰诊断', '采集失败', '未输出凭据；原流量继续放行')
}
$done({})
