// Save the web session only after the sign-in page confirms it is valid.
const key = 'sfexpress_web_session'
const headers = $request.headers || {}
const cookie = Object.keys(headers).find(name => name.toLowerCase() === 'cookie')
let response
try {
  response = JSON.parse($response.body)
} catch (_) {
  response = null
}

if (response && response.success === true && response.obj && typeof response.obj.signed === 'boolean' && cookie && headers[cookie]) {
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
  $notify('顺丰速运', '会话未更新', '签到页未返回有效登录状态，请退出并重新进入')
}

$done({})
