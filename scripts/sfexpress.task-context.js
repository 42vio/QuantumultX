// Capture only H5 task device context, associated with the Web cookie's account ID.
try {
  if (/^https:\/\/mcs-mimp-web\.sf-express\.com\/mcs-mimp\/commonPost\/~memberNonactivity~integralTaskStrategyService~queryPointTaskAndSignFromES(?:\?[^#]*)?$/.test($request.url)) {
    const headers = $request.headers || {}
    const cookieKey = Object.keys(headers).find(key => key.toLowerCase() === 'cookie')
    const cookie = cookieKey ? headers[cookieKey] : ''
    const item = cookie.split(';').map(part => part.trim()).find(part => part.startsWith('_login_user_id_='))
    const id = item && item.slice('_login_user_id_='.length)
    const body = JSON.parse($request.body)
    if (id && typeof body.deviceId === 'string' && body.deviceId && body.deviceId.length <= 256) {
      let state
      try { state = JSON.parse($prefs.valueForKey('sfexpress_task_contexts')) } catch (_) {}
      if (!state || !state.accounts || typeof state.accounts !== 'object' || Array.isArray(state.accounts)) state = { accounts: {} }
      const previous = state.accounts[id]
      state.accounts[id] = { deviceId: body.deviceId, channelType: String(body.channelType || '1'), at: Date.now() }
      const saved = $prefs.setValueForKey(JSON.stringify(state), 'sfexpress_task_contexts')
      if (!saved) $notify('顺丰速运', '任务上下文保存失败', '未输出任何凭据')
      else if (!previous || previous.deviceId !== body.deviceId) $notify('顺丰速运', '积分页任务上下文已保存', '已按账号保存网页设备标识；不会记录 Cookie 或 token')
    }
  }
} catch (_) {
  console.log('顺丰任务上下文未保存：未获得有效的任务查询数据')
}
$done({})
