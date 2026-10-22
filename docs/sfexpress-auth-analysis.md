# 顺丰 App 签到认证分析

日期：2026-10-22。结论状态：已完成官方 APK 下载、静态分析和候选脚本实现；未完成真实账号的长期有效性验证。

## 下载来源与文件

- [顺丰官网下载页](https://www.sf-express.com/chn/sc/support-more/sf_Tool_Client)
- [官网二维码图片](https://www.sf-express.com/uploads/sf_app_Q_Rcode_04178a25ed.png)
- 二维码内容：`https://ucmp.sf-express.com/middlepage/sfapp/index.html?channel=GW&scene=download`
- 使用 Android 14 / Pixel 8 浏览器 User-Agent 请求下载页，追踪新版下载模块，获得官方接口：`https://ccsp-egmas.sf-express.com/cx-app-base/base/app/appVersion/downloadAndroidApk?channelTag=GW`
- 实际文件来自 `ccsp-egmas-static.sf-express.com/sfoss/download/AndroidML/CCMAS/`，文件名 `顺丰速运-1099520-2026091115504330620687806.apk`。文件名中的数字不作为已核实的显示版本号。
- 大小：126,348,740 字节；SHA-256：`bf6e34d71752051718c96de089206b5125ea7851a1f2659fe0cbfb1c351b15bf`。
- ZIP 完整性检查通过。未安装或运行 APK；未独立核对发布者证书指纹。
- 临时原始文件：`/tmp/sf-official.apk`；Hermes 反汇编：`/tmp/sf-app.hasm`；伪代码：`/tmp/sf-app-decompiled.js`；原生 Java 声明：`/tmp/sf-native-20261022/sources/`。临时目录可能被系统清理，文件不加入 Git。

## 静态证据

1. `assets/index.android.bundle` 为 Hermes 96 字节码。使用 hermes-dec 反汇编与伪代码输出，关键结论同时对照字节码；伪代码不是可直接执行的源码。
2. `classes.dex` 含嵌套 DEX，单独提取后用 JADX 得到原生桥接和网络类。部分 Java 方法实现被转换成 native，JADX 不能恢复其算法。
3. `loginSuccessFun`（Hermes function 15066）从登录结果读取 `token` 和 `salt`，分别调用 `NativeHelper.setToken` / `setSalt`。这两个值与 Web Cookie、页面 `sign` 是不同层次的数据。
4. `analyzeGeneralAuthenticationUrl`（function 27602）组织 `mobile`、`memNo`、`userId`、目标域名 `name`、`needReqTime` 等参数，调用 `cx-app-member/member/app/user/universalSign`。返回 `sign` 后，App URL 编码该值并拼接到目标 Web URL。
5. 官网当前下载模块中的会员中心配置使用 `mcs-mimp-web.sf-express.com/mcs-mimp/share/app/shareRedirect`，附带 `source=SFAPP` 和公开 `bizCode`。候选脚本沿用该配置，不假设任意网页 Cookie 能自动续期。
6. `SYTHttpRNRequest` 桥接对应 `com.sf.modules.HttpModule`；`createHeaderByString` 调用 `HeaderInterceptor.generateHeaderMap`。
7. `HeaderInterceptor` 对请求体生成请求头；`HeaderCXInterceptor` 还将 URL query 纳入待签名内容，GET 时进行 URL 解码。不能随意改写已捕获请求的 body。
8. `HeaderInterceptor.generateHeaderMap`、`getSytTokenMd5` 及 `SYTTokenManager` 的主要方法为 native，实现位于 `libnllvm.so`。该库还引用 `saltEncryption`、`sytHttpEncryption`、`requestSign` 和 `SfGeneratedWorkflows.executeWorkflow`，后者加载 `libKeyProvider.so`。**尚未还原完整签名算法，也没有证据证明只算一个 MD5 就能生成当前版本的全部认证头。**
9. App 也有 `proxy/esgcempcore/memberNonactivity/integralSignV2Service/getTodaySign` 原生查询接口；这只证明存在另一入口，不能证明不需要认证或可以替代 Web 签到。
10. 搜到的 `refreshToken` 出现在微信/微博授权、绑定等流程，不能据此认定存在通用的顺丰 token 刷新接口。

## 对现有脚本的判断与改动

旧实现只保存已登录签到页的 Web Cookie 和请求头，没有 `universalSign → shareRedirect` 步骤。用户报告约 15 分钟失效；本次静态分析没有确认具体是哪一个字段由服务端按 15 分钟过期。

候选实现补上以下流程：

1. QX 捕获指向会员域名的原生 `universalSign` 请求，按 `userId` 保存原始 body 和认证头；移除传输层头与 Cookie。请求及个人信息只存在 QX 本地偏好设置，不输出到日志。
2. 每次定时运行，重放原生请求，要求服务端返回新的 `obj.sign`。
3. 使用新的 `sign` 访问官方 `shareRedirect`，手动接收 Cookie，仅跟随会员站点同域跳转。
4. 检查 `_login_user_id_` 是否匹配，使用该账号的新 Cookie 调用当前签到/任务接口。
5. 原生认证失败时报告失败，不继续使用该账号的旧 Cookie；不同账号独立处理，通知仍合并。

这是换取新 Web 会话的候选方案，**不是对原生 token 的刷新实现**。它保留捕获时的原生签名，未自行伪造新时间戳。原生认证头是否允许长期重放，尤其 iOS 当前版本是否与 Android 实现一致，仍需实测。如果原生签名本身也有短期有效期，则此方案仍会失败，后续必须继续还原签名或借助已登录 App 执行认证。

公开原作者脚本也采用“原生换 sign → Web 登录”结构，可交叉核对其设计，但其旧签到接口不作为当前可用性的依据：[chavyleung 原始脚本](https://github.com/chavyleung/scripts/blob/master/sfexpress/sfexpress.js)。

## 验证

- `node --test tests/sfexpress.test.cjs`：4 组通过。覆盖原始签名请求保持、隐私日志、多账号隔离、新 Cookie 替换、原生认证失败、账号不匹配、跨域跳转阻断、旧账号兼容。
- 两个脚本的 `node --check` 以及 `git diff --check` 通过。
- 没有使用真实账号请求接口、执行签到或验证 15 分钟/隔天有效期。模拟测试只验证脚本逻辑。
- QX 使用 `opts: { 'auto-cookie': false }` 隔离 Cookie；需 build 934+。官方参数说明见 [sample-task.js](https://github.com/crossutility/Quantumult-X/blob/master/sample-task.js)。

仅有 iPhone 时的验收：更新本地改动对应的重写/脚本后，打开积分签到页，确认“App 认证请求已保存”和“会话已更新”；立即运行一次，关闭 App 后超过 15 分钟运行一次，次日再运行。只需反馈通知的阶段和错误文本，不需要把 token、salt、Cookie 或完整认证请求粘贴到聊天中。若没有捕获原生请求，应先确认 iOS 当前接口域名和请求结构；不能将旧 Web 会话运行成功视为换票已生效。
