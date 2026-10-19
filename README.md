# QuantumultX


## 下班打卡提醒（Quantumult X）

`scripts/attendance-qx.js` 同时负责抓取 App 会话与 17:20 查询。`QuantumultX_Cookie.qxrewrite` 已包含该 App 的重写和 MitM 域名，`TaskGallery.json` 已加入 17:20 任务。推送后，在 iPhone QX 更新这两个现有订阅。

手机时区设为中国标准时间，开启 QX 隧道、MitM 和通知权限。打开考勤 App 的当日考勤页面一次，随后在 QX 任务列表手动运行该任务，确认时间与 App 一致。若开启该域名的 MitM 后 App 卡在连接中，先移除新规则，保持 App 可用。脚本不包含凭据，也不执行打卡。
