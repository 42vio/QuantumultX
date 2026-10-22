// Safe summary only. Does not export token, salt, signatures, cookies or bodies.
try {
  const raw = $prefs.valueForKey('sfexpress_auth_diagnostics_v1')
  const state = raw ? JSON.parse(raw) : { events: [] }
  const events = (state.events || []).filter(event => event.at >= Date.now() - 86400000)
  const requests = events.filter(event => event.route === 'universalSign' && event.phase === 'request')
  const lines = [`24 小时内：换票请求 ${requests.length} 个，响应 ${events.filter(event => event.route === 'universalSign' && event.phase === 'response').length} 个`]
  const names = ['token', 'salt', 'sytToken', 'requestSign', 'timeInterval', 'deviceId']
  function header(headers, name) {
    const key = Object.keys(headers).find(key => key.toLowerCase() === name.toLowerCase())
    return key === undefined ? undefined : headers[key]
  }
  requests.forEach((event, index) => {
    const headers = event.request.headers || {}
    const present = names.filter(name => header(headers, name) !== undefined)
    const previous = index ? requests[index - 1] : null
    const changed = previous ? names.filter(name => header(headers, name) !== header(previous.request.headers || {}, name)) : []
    lines.push(`请求 ${index + 1} ${new Date(event.at).toISOString()}：字段 ${present.join(', ') || '未识别'}`)
    if (previous) lines.push(`间隔 ${Math.round((event.at - previous.at) / 1000)} 秒；变化字段 ${changed.join(', ') || '无'}`)
  })
  events.filter(event => event.phase === 'response').forEach(event => {
    if (event.route !== 'universalSign') {
      lines.push(`登录响应：token ${Object.keys(event.login || {}).some(key => /\.token$/i.test(key)) ? '有' : '无'}，salt ${Object.keys(event.login || {}).some(key => /\.salt$/i.test(key)) ? '有' : '无'}`)
      return
    }
    let body
    try { body = JSON.parse(event.response.body) } catch (_) {}
    const status = String(event.response.statusCode || '').match(/\b[1-5][0-9]{2}\b/)
    const success = body && typeof body.success === 'boolean' ? String(body.success) : '未知'
    const hasSign = !!(body && body.obj && typeof body.obj.sign === 'string' && body.obj.sign)
    lines.push(`响应 ${new Date(event.at).toISOString()}：HTTP ${status ? status[0] : '未知'}，success=${success}，sign=${hasSign ? '有' : '无'}`)
  })
  lines.push('请求/响应独立记录，未自动配对。此摘要不包含凭据。')
  const report = lines.join('\n')
  console.log(report)
  $notify('顺丰诊断报告', '可复制本摘要反馈', report)
} catch (_) {
  $notify('顺丰诊断报告', '无法读取', '本地样本格式异常；未输出原始数据')
}
$done()
