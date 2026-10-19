/* Quantumult X request rewrite + scheduled task in one file. */
const URL = "https://hrmapp.hitrontech.com:9999/scsrwd/SCSService.asmx";
const USER_KEY = "hrm_attendance_user_id";
const SESSION_KEY = "hrm_attendance_session_guid";
const GUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

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
function captureRequest() {
  try {
    const body = unescapeXml(String($request.body || ""));
    if (body.includes("<SystemObjectRun") && body.includes("<Action>Login</Action>")) {
      const user = body.match(/<UserID>([0-9a-f-]{36})<\/UserID>/i);
      if (user && GUID.test(user[1])) $prefs.setValueForKey(user[1], USER_KEY);
    }
    if (body.includes("<BusinessObjectRun") && body.includes("<FuncID>GetAttendData</FuncID>")) {
      const session = body.match(/<SessionGuid>([0-9a-f-]{36})<\/SessionGuid>/i);
      if (session && GUID.test(session[1])) $prefs.setValueForKey(session[1], SESSION_KEY);
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
function loginInput(user) {
  return "<TLoginInputArgs><AppName>App</AppName><CompanyID /><UserID>" + escapeXml(user) +
    "</UserID><Password /><LanguageID>zh-TW</LanguageID><UserHostAddress />" +
    "<IsSaveSessionBuffer>true</IsSaveSessionBuffer><ValidateCode /><OAuthType>NotSet</OAuthType>" +
    "<IsValidateRegister>false</IsValidateRegister></TLoginInputArgs>";
}
function attendanceInput() {
  return '<TExecFuncInputArgs xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
    'xmlns:xsd="http://www.w3.org/2001/XMLSchema"><FuncID>GetAttendData</FuncID>' +
    '<Parameters><Parameter><Name>caller</Name><Value xsi:type="xsd:string">SCSAppForms</Value>' +
    '</Parameter></Parameters></TExecFuncInputArgs>';
}
async function post(body) {
  const response = await $task.fetch({
    url: URL, method: "POST", body,
    headers: {"Content-Type": "application/soap+xml; charset=utf-8", "Accept": "application/soap+xml"}
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
  const user = $prefs.valueForKey(USER_KEY);
  const previous = $prefs.valueForKey(SESSION_KEY);
  if (!GUID.test(user || "") || !GUID.test(previous || ""))
    throw new Error("请先用 QX 开启重写并在考勤 App 查看一次考勤");
  const login = await post(soap("SystemObjectRun", previous, loginInput(user)));
  if (field(login, "Result").toLowerCase() !== "true") throw new Error("考勤会话已失效");
  const session = field(login, "SessionGuid");
  if (!GUID.test(session)) throw new Error("续登未返回有效会话");
  if (!$prefs.setValueForKey(session, SESSION_KEY)) throw new Error("无法保存更新后的会话");
  const result = await post(soap("BusinessObjectRun", session, attendanceInput(), "EIP0080600"));
  const times = clockOut(result);
  $notify("下班打卡提醒", "今天 " + times.clockIn + " 上班",
    times.clockOut + (times.nextDay ? "（次日）" : "") + " 可打卡下班");
}
if (typeof $request !== "undefined") {
  captureRequest();
  $done({});
} else {
  main().catch(error => {
    const allowed = ["请先用 QX 开启重写并在考勤 App 查看一次考勤", "考勤服务连接失败",
      "考勤服务返回错误", "考勤会话已失效", "续登未返回有效会话",
      "无法保存更新后的会话", "考勤响应缺少数据", "考勤数据格式错误",
      "未找到今日唯一考勤记录", "今日上班时间为空"];
    const message = allowed.includes(error.message) ? error.message : "请手动查看考勤";
    $notify("下班打卡提醒", "查询失败", message);
  }).then(() => $done());
}
