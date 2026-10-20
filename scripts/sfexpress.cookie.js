// Capture the current web session when the SF Express points page loads.
const key = 'sfexpress_web_session'
const headers = $request.headers || {}
const cookie = Object.keys(headers).find(name => name.toLowerCase() === 'cookie')

if (cookie && headers[cookie]) {
  const saved = {}
  for (const name of ['cookie', 'channel', 'deviceid', 'platform', 'syscode', 'user-agent', 'referer', 'signature', 'timestamp']) {
    const actual = Object.keys(headers).find(header => header.toLowerCase() === name)
    if (actual) saved[name] = headers[actual]
  }
  if ($prefs.setValueForKey(JSON.stringify(saved), key)) {
    $notify('顺丰速运', '会话已更新', '可运行签到任务')
  } else {
    $notify('顺丰速运', '会话保存失败', '请检查 Quantumult X 设置')
  }
} else {
  $notify('顺丰速运', '会话获取失败', '请打开顺丰 App 的签到页重试')
}

$done({})
