// Manual diagnostic only: at most two universalSign requests, no sign-in/tasks.
const endpoint = /^https:\/\/ccsp-egmas\.sf-express\.com\/cx-app-member\/member\/app\/user\/universalSign(?:\?[^#]*)?$/
const notify = message => {
  console.log(message)
  $notify('顺丰旧签名验证', '仅换票，不执行签到任务', message)
}

function header(event, name) {
  const headers = event.request.headers || {}
  const key = Object.keys(headers).find(key => key.toLowerCase() === name)
  return key === undefined ? undefined : headers[key]
}

async function probe(event, label) {
  const headers = {}
  Object.keys(event.request.headers || {}).forEach(key => {
    // Let the HTTP stack manage transport fields; retain native signing fields.
    if (!/^(host|content-length|connection|accept-encoding|transfer-encoding|:.*)$/i.test(key)) {
      headers[key] = event.request.headers[key]
    }
  })
  const age = Math.floor((Date.now() - event.at) / 60000)
  try {
    const response = await $task.fetch({
      url: event.request.url,
      method: 'POST',
      headers,
      body: event.request.body,
      opts: { redirection: false, 'auto-cookie': false },
    })
    let body
    try { body = JSON.parse(response.body) } catch (_) {}
    const status = String(response.statusCode || '').match(/\b[1-5][0-9]{2}\b/)
    const success = body && typeof body.success === 'boolean' ? String(body.success) : '未知'
    const hasSign = !!(body && body.obj && typeof body.obj.sign === 'string' && body.obj.sign)
    // Classify known error themes without printing arbitrary server strings.
    const message = body && [body.errorMessage, body.message, body.msg].filter(item => typeof item === 'string').join(' ')
    const reason = /签名|signature|requestsign|syttoken/i.test(message || '') ? '；提示涉及签名' :
      /登录|登陆|token|session|会话/i.test(message || '') ? '；提示涉及登录态' : ''
    return `${label}（采集于 ${new Date(event.at).toISOString()}，约 ${age} 分钟前）：HTTP ${status ? status[0] : '未知'}，success=${success}，sign=${hasSign ? '有' : '无'}${reason}`
  } catch (_) {
    return `${label}（约 ${age} 分钟前）：网络请求失败，未输出原始异常`
  }
}

async function main() {
  const raw = $prefs.valueForKey('sfexpress_auth_diagnostics_v1')
  const state = raw ? JSON.parse(raw) : { events: [] }
  const requests = (state.events || []).filter(event => event.route === 'universalSign' && event.phase === 'request' &&
    event.at >= Date.now() - 86400000 && event.at <= Date.now() && event.request &&
    endpoint.test(event.request.url) && event.request.method === 'POST' && typeof event.request.body === 'string')
    .sort((a, b) => a.at - b.at)
  const latest = requests[requests.length - 1]
  if (!latest || !header(latest, 'token') || !header(latest, 'deviceid')) {
    notify('缺少可验证样本，请先在 App 打开积分页并确认采集到换票请求。')
    return
  }
  const old = requests.find(event => event !== latest && Date.now() - event.at >= 16 * 60000 &&
    header(event, 'token') === header(latest, 'token') && header(event, 'deviceid') === header(latest, 'deviceid'))
  if (!old) {
    notify('需要同一 token/deviceId 下两份样本，较早一份至少已保存 16 分钟。保持登录，稍后重新打开积分页采集一份新样本。')
    return
  }
  const lines = [await probe(old, '较早样本'), await probe(latest, '最新样本')]
  if (Date.now() - latest.at > 2 * 60000) lines.push('最新样本也超过 2 分钟；若均失败，需要刚采集的新样本作对照。')
  lines.push('保留原签名和正文，未生成新签名；结果不等同于 Web 会话有效期。')
  notify(lines.join('\n'))
}

main().catch(() => notify('无法读取本地样本；未输出凭据或原始异常')).finally(() => $done())
