/* Quantumult X request rewrite + scheduled task in one file. */
const URL = "https://hrmapp.hitrontech.com:9999/scsrwd/SCSService.asmx";
const LOGIN_BODY_KEY = "hrm_attendance_login_request";
const LOGIN_UA_KEY = "hrm_attendance_login_user_agent";
const LOGIN_LANG_KEY = "hrm_attendance_login_language";
const CAPTURE_NOTICE_DAY_KEY = "hrm_attendance_capture_notice_day_v2";
const GUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const EMPTY_SESSION = "00000000-0000-0000-0000-000000000000";

function escapeXml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function unescapeXml(value) {
  let text = value;
  for (let i = 0; i < 3; i++) {
    const next = text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'").replace(/&amp;/g, "&");
    if (next === text) break;
    text = next;
  }
  return text;
}
function field(xml, name) {
  const match = xml.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">", "i"));
  return match ? match[1].trim() : "";
}
function requestHeader(name) {
  const headers = $request.headers || {};
  const key = Object.keys(headers).find(key => key.toLowerCase() === name.toLowerCase());
  return key ? String(headers[key]) : "";
}
function captureRequest() {
  try {
    const original = String($request.body || "");
    const body = unescapeXml(original);
    if (body.includes("<SystemObjectRun") && body.includes("<Action>Login</Action>")) {
      const user = body.match(/<UserID>([0-9a-f-]{36})<\/UserID>/i);
      const session = field(body, "SessionGuid");
      const userAgent = requestHeader("User-Agent");
      const language = requestHeader("Accept-Language") || "zh-CN";
      if (user && GUID.test(user[1]) && session === EMPTY_SESSION &&
          userAgent.includes("SCSAPPForms.iOS") &&
          $prefs.setValueForKey(original, LOGIN_BODY_KEY) &&
          $prefs.setValueForKey(userAgent, LOGIN_UA_KEY) &&
          $prefs.setValueForKey(language, LOGIN_LANG_KEY)) {
        const today = todayChina();
        if ($prefs.valueForKey(CAPTURE_NOTICE_DAY_KEY) !== today) {
          $prefs.setValueForKey(today, CAPTURE_NOTICE_DAY_KEY);
          $notify("考勤重写成功", "已保存 App 登录请求", "可手动运行下班打卡提醒任务验证");
        }
      }
    }
  } catch (_) {
    // Never log request bodies or authentication values.
  }
}
function soap(operation, session, inner, progId) {
  const fields = "<SessionGuid>" + escapeXml(session) + "</SessionGuid>" +
    (progId ? "<ProgID>" + progId + "</ProgID>" : "") +
    "<Action>" + (operation === "SystemObjectRun" ? "Login" : "ExecFunc") + "</Action>" +
    "<Format>Xml</Format><Bytes /><Value>" + escapeXml(inner) + "</Value>";
  return '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">' +
    '<soap12:Body><' + operation + ' xmlns="http://scsservices.net/"><args>' + fields +
    '</args></' + operation + '></soap12:Body></soap12:Envelope>';
}
function attendanceInput() {
  return '<?xml version="1.0" encoding="utf-16"?>' +
    '<TExecFuncInputArgs xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema"><FuncID>GetAttendData</FuncID>' +
    '<Parameters><Parameter><Name>caller</Name><Value xsi:type="xsd:string">SCSAppForms</Value>' +
    '</Parameter></Parameters></TExecFuncInputArgs>';
}
async function post(body, userAgent, language) {
  const response = await $task.fetch({
    url: URL, method: "POST", body,
    headers: {"Content-Type": "application/soap+xml; charset=utf-8", "Accept": "*/*",
      "User-Agent": userAgent, "Accept-Language": language},
    opts: {policy: "direct"}
  });
  if (response.statusCode !== 200 || !response.body) throw new Error("考勤服务连接失败");
  const xml = unescapeXml(response.body);
  if (xml.includes("<Fault")) throw new Error("考勤服务返回错误");
  return xml;
}
function todayChina() {
  return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, "/");
}
function clockOut(xml) {
  const marker = xml.indexOf("<Name>AttendData</Name>");
  if (marker < 0) throw new Error("考勤响应缺少数据");
  const value = field(xml.slice(marker), "Value");
  const rows = JSON.parse(unescapeXml(value)).Data;
  if (!Array.isArray(rows)) throw new Error("考勤数据格式错误");
  const matches = rows.filter(row => row.attendDate === todayChina());
  if (matches.length !== 1) throw new Error("未找到今日唯一考勤记录");
  const time = String((matches[0].AttendTime || {}).WorkTime || "");
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)) throw new Error("今日上班时间为空");
  const parts = time.split(":").map(Number);
  const minutes = parts[0] * 60 + parts[1] + 9 * 60;
  const hh = String(Math.floor((minutes % 1440) / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return {clockIn: time.slice(0, 5), clockOut: hh + ":" + mm,
          nextDay: minutes >= 1440};
}
async function main() {
  const loginBody = $prefs.valueForKey(LOGIN_BODY_KEY);
  const userAgent = $prefs.valueForKey(LOGIN_UA_KEY);
  const language = $prefs.valueForKey(LOGIN_LANG_KEY) || "zh-CN";
  const decoded = unescapeXml(String(loginBody || ""));
  const user = decoded.match(/<UserID>([0-9a-f-]{36})<\/UserID>/i);
  if (!user || !GUID.test(user[1]) || field(decoded, "SessionGuid") !== EMPTY_SESSION ||
      !String(userAgent || "").includes("SCSAPPForms.iOS"))
    throw new Error("请先用 QX 开启重写并打开一次考勤 App");
  const login = await post(loginBody, userAgent, language);
  if (field(login, "Result").toLowerCase() !== "true") throw new Error("考勤自动登录失败");
  const session = field(login, "SessionGuid");
  if (!GUID.test(session) || session === EMPTY_SESSION) throw new Error("登录未返回有效会话");
  const result = await post(soap("BusinessObjectRun", session, attendanceInput(), "EIP0080600"),
    userAgent, language);
  const times = clockOut(result);
  $notify("下班打卡提醒", "今天 " + times.clockIn + " 上班",
    times.clockOut + (times.nextDay ? "（次日）" : "") + " 可打卡下班");
}
if (typeof $request !== "undefined") {
  captureRequest();
  $done({});
} else {
  main().catch(error => {
    const allowed = ["请先用 QX 开启重写并打开一次考勤 App", "考勤服务连接失败",
      "考勤服务返回错误", "考勤自动登录失败", "登录未返回有效会话",
      "考勤响应缺少数据", "考勤数据格式错误",
      "未找到今日唯一考勤记录", "今日上班时间为空"];
    const message = allowed.includes(error.message) ? error.message : "请手动查看考勤";
    $notify("下班打卡提醒", "查询失败", message);
  }).then(() => $done());
}
