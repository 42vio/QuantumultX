const base = 'https://mcs-mimp-web.sf-express.com/mcs-mimp/commonPost/'
const sessionKey = 'sfexpress_web_session'
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

async function main() {
  const session = $prefs.valueForKey(sessionKey)
  if (!session) throw new Error('缺少会话，请先在顺丰 App 打开签到页')
  const headers = JSON.parse(session)
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
        console.log(`每日任务 ${task.title || task.taskCode}：${error.message}`)
      }
    }
    tasks = `每日任务领取 ${claimed} 项，未完成 ${failed} 项`
  } catch (error) {
    tasks = `每日任务查询失败：${error.message}`
  }
  $notify('顺丰速运', summary, tasks)
}

main().catch(error => {
  console.log(`顺丰速运：${error.message}`)
  $notify('顺丰速运', '签到失败', `${error.message}；请重新打开签到页更新会话`)
}).finally(() => $done())
