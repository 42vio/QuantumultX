# QuantumultX


## 下班打卡提醒（Quantumult X）

`scripts/attendance-qx.js` 同时负责从 App 登录请求获取用户标识，以及在 17:20 独立登录、查询考勤并通知。App 的登录请求使用全零会话 ID，任务按同样方式发起登录，不依赖之前的会话。`QuantumultX_Cookie.qxrewrite` 已包含该 App 的重写和 MitM 域名，`TaskGallery.json` 已加入 17:20 任务。推送后，在 iPhone QX 更新这两个现有订阅。

手机时区设为中国标准时间，开启 QX 隧道、MitM 和通知权限。打开考勤 App 一次，收到“考勤重写成功”通知后，在 QX 任务列表手动运行该任务，确认时间与 App 一致。重写通知只表示抓到了登录标识；任务通知才表示查询结果。若开启该域名的 MitM 后 App 卡在连接中，先移除新规则，保持 App 可用。脚本不包含凭据，也不执行打卡。
