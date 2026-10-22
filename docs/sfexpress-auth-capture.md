# 顺丰 App 临时鉴权采集（Quantumult X）

用于研究原生登录态与积分页换票的有效期。原签到、每日任务及账号存储保持原样；采集工具不执行签到、不重放请求、不生成签名。另有手动换票重放脚本，见下文。

## 安装

1. 在 Quantumult X 的重写资源中添加独立资源：
   `https://raw.githubusercontent.com/42vio/QuantumultX/main/SFExpress_Auth_Diagnostic.qxrewrite`
2. 开启该资源和 HTTPS 解密，确认 Quantumult X 的证书已安装并受信任。资源只增加 `ccsp-egmas.sf-express.com`；保留原签到资源。
3. 手动运行报告脚本（可在「脚本编辑器」粘贴代码后运行，或添加为手动任务）：
   `https://raw.githubusercontent.com/42vio/QuantumultX/main/scripts/sfexpress.auth-report.js`

如需手动任务，可临时在 `[task_local]` 添加，之后在任务列表点运行：

```ini
0 0 1 1 * https://raw.githubusercontent.com/42vio/QuantumultX/main/scripts/sfexpress.auth-report.js, tag=顺丰鉴权诊断报告, enabled=false
0 0 1 1 * https://raw.githubusercontent.com/42vio/QuantumultX/main/scripts/sfexpress.auth-clear.js, tag=清除顺丰鉴权诊断样本, enabled=false
```

`enabled=false` 用于避免自动运行，具体界面操作以当前 QX 版本为准。也可直接在脚本编辑器运行这两个文件。

## 第一轮采集

1. 保持当前账号登录，不退出、不切号。记录此时运行原签到任务的结果。
2. 打开顺丰 App → 积分页；应看到 `universalSign request/response 已采集` 通知。没有通知时先反馈“未采集到”，不代表 token 已失效。代理解密是否可用、App 是否实际重新请求都需要确认。
3. 等待 16～20 分钟，期间不退出登录、不切号。先运行原签到任务，记下结果；然后关闭并重新打开积分页，确认收到新的采集通知。
4. 手动运行「顺丰鉴权诊断报告」，把**报告摘要**和上述两次签到结果反馈。摘要只包含数量、时间、HTTP 状态、成功标志、字段是否存在/变化，不含凭据。
5. 如果正常使用时恰好重新登录，可以顺便采集登录响应的 token/salt；不要为了采集主动退出当前账号。登录响应并非这轮采集的前提。

这轮只比较 App 正常发出的流量，不能单凭新请求成功证明旧原生请求可以重放，也不能由字段变化推出签名算法。需要结合样本决定下一步验证。

## 第二轮：手动验证旧签名

有同一账号、同一设备相隔至少 16 分钟的采集样本后，可手动运行：

`https://raw.githubusercontent.com/42vio/QuantumultX/main/scripts/sfexpress.auth-replay.js`

1. 保持当前账号登录，重新进入积分页，确认刚采集到一份新的换票请求。
2. 暂时禁用独立诊断重写，避免把重放流量混入 App 样本；不要运行清理脚本。
3. 立即（最好两分钟内）手动运行上述脚本一次，把通知摘要反馈。

脚本选择最近 24 小时内、与最新请求具有相同 token/deviceId 的最早旧样本，以及最新样本，各发送一次原始 `universalSign` 换票请求。保留原签名、时间戳和正文，不刷新签名；传输层的 Host、Content-Length 等由网络库管理。关闭重定向和自动 Cookie（相关选项是否生效受 QX 版本影响），不会访问签到、完成任务、领奖或退出登录接口，也不会更新原签到账号存储。

较早样本失败而最新样本成功，才支持“旧请求整体不能长期重放”的判断；仍不能单独确定哪个签名字段或时间戳导致拒绝。两份都失败时不能直接归因于过期，还需排查重放方式；两份都成功则表明该旧样本当时仍可换票。最新样本也已较旧时，不能充当即时对照。脚本只输出状态和有限的错误分类，不输出服务端原文或凭据。

## 数据范围与清理

- 独立本地键：`sfexpress_auth_diagnostics_v1`，不会写入 `sfexpress_web_sessions` 或 `sfexpress_web_session`。
- `universalSign` 请求保存原 URL、方法、请求头、正文；响应另存 HTTP 状态及正文。包含敏感鉴权数据，**不要复制原始存储到聊天、日志、公开仓库或网盘**。
- 登录仅记录 `signInAndSignUp` / `loginOrRegister` 响应中的 token/salt 字段，不记录登录请求、密码、验证码或整份登录响应。
- 请求和响应独立记录，不推测并发请求的配对。单条上限 128K 字符，最多保留最近 24 条；下一次采集时淘汰超过 24 小时的旧记录。这不是后台定时删除。
- 完成后先禁用独立重写资源，再手动运行 `sfexpress.auth-clear.js` 清除诊断样本。原签到账号仍保留。
- 全部捕获脚本以 `$done({})` 放行，不修改请求或响应；采集错误不会打印原始异常。

目前仅经过本地模拟验证，仍需真机确认能否拦截到上述接口。若 App 在开启解密后无法联网，先禁用本诊断资源，不改写 App 的 TLS 校验。
