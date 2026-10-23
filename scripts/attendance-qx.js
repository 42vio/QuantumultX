/* Quantumult X request rewrite + scheduled task in one file. */
const URL = "https://hrmapp.hitrontech.com:9999/scsrwd/SCSService.asmx";
const LOGIN_BODY_KEY = "hrm_attendance_login_request";
const LOGIN_UA_KEY = "hrm_attendance_login_user_agent";
const LOGIN_LANG_KEY = "hrm_attendance_login_language";
const LOGIN_TOKEN_KEY = "hrm_attendance_login_token";
const QUERY_BODY_KEY = "hrm_attendance_query_request";
const QUERY_UA_KEY = "hrm_attendance_query_user_agent";
const QUERY_LANG_KEY = "hrm_attendance_query_language";
const LOGIN_NOTICE_DAY_KEY = "hrm_attendance_login_notice_day_v1";
const TOKEN_NOTICE_DAY_KEY = "hrm_attendance_token_notice_day_v1";
const QUERY_NOTICE_DAY_KEY = "hrm_attendance_query_notice_day_v1";
const GUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const EMPTY_SESSION = "00000000-0000-0000-0000-000000000000";

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
    const userAgent = requestHeader("User-Agent");
    const language = requestHeader("Accept-Language") || "zh-CN";
    if (body.includes("<SystemObjectRun") && body.includes("<Action>Login</Action>")) {
      const user = field(body, "UserID");
      if (GUID.test(user) && user !== EMPTY_SESSION &&
          field(body, "SessionGuid") === EMPTY_SESSION &&
          userAgent.includes("SCSAPPForms.iOS")) {
        $prefs.setValueForKey(original, LOGIN_BODY_KEY);
        $prefs.setValueForKey(userAgent, LOGIN_UA_KEY);
        $prefs.setValueForKey(language, LOGIN_LANG_KEY);
        const today = todayChina();
        if ($prefs.valueForKey(LOGIN_NOTICE_DAY_KEY) !== today) {
          $prefs.setValueForKey(today, LOGIN_NOTICE_DAY_KEY);
          $notify("考勤登录请求已抓取", "已保存 App 登录请求", "任务查询时将使用这份请求尝试登录");
        }
      }
    }
    if (body.includes("<BusinessObjectRun") && body.includes("<FuncID>GetAttendData</FuncID>")) {
      const session = field(body, "SessionGuid");
      if (GUID.test(session) &&
          userAgent.includes("SCSAPPForms.iOS") &&
          $prefs.setValueForKey(original.replace(/<SessionGuid>[0-9a-f-]{36}<\/SessionGuid>/i,
            "<SessionGuid>" + EMPTY_SESSION + "</SessionGuid>"), QUERY_BODY_KEY) &&
          $prefs.setValueForKey(userAgent, QUERY_UA_KEY) &&
          $prefs.setValueForKey(language, QUERY_LANG_KEY) &&
          $prefs.valueForKey(LOGIN_BODY_KEY)) {
        const today = todayChina();
        if ($prefs.valueForKey(QUERY_NOTICE_DAY_KEY) !== today) {
          $prefs.setValueForKey(today, QUERY_NOTICE_DAY_KEY);
          $notify("考勤查询请求已抓取", "已保存当日考勤查询模板", "可手动运行下班打卡提醒任务验证");
        }
      }
    }
  } catch (_) {
    // Never log request bodies or authentication values.
  }
}
function captureResponse() {
  try {
    const response = unescapeXml(String($response.body || ""));
    if (!response.includes("<SystemObjectRunResponse") ||
        !response.includes("<TLoginOutputResult")) return;
    if (field(response, "Result").toLowerCase() !== "true") return;
    const token = field(response, "SessionGuid");
    if (!GUID.test(token) || token === EMPTY_SESSION) return;
    if (!$prefs.setValueForKey(token, LOGIN_TOKEN_KEY)) return;
    const today = todayChina();
    if ($prefs.valueForKey(TOKEN_NOTICE_DAY_KEY) !== today) {
      $prefs.setValueForKey(today, TOKEN_NOTICE_DAY_KEY);
      $notify("考勤登录会话已保存", "已取得下次自动登录所需令牌", "可手动运行下班打卡提醒任务验证");
    }
  } catch (_) {
    // Never log response bodies or authentication values.
  }
}
async function post(body, userAgent, language) {
  const response = await $task.fetch({
    url: URL, method: "POST", body,
    headers: {"Content-Type": "application/soap+xml; charset=utf-8", "Accept": "*/*",
      "User-Agent": userAgent, "Accept-Language": language}
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
  if (marker < 0) throw new Error("查询未返回考勤数据，请打开 App 刷新");
  const value = field(xml.slice(marker), "Value");
  const rows = JSON.parse(unescapeXml(value)).Data;
  if (!Array.isArray(rows)) throw new Error("考勤数据格式错误");
  const matches = rows.filter(row => row.attendDate === todayChina());
  if (matches.length !== 1) throw new Error("未找到今日唯一考勤记录");
  const time = String((matches[0].AttendTime || {}).WorkTime || "");
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(time)) throw new Error("今日上班时间为空");
  const parts = time.split(":").map(Number);
  const minutes = Math.max(parts[0] * 60 + parts[1] + 9 * 60, 17 * 60 + 30);
  const hh = String(Math.floor((minutes % 1440) / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return {clockIn: time.slice(0, 5), clockOut: hh + ":" + mm,
          nextDay: minutes >= 1440};
}
async function main() {
  const loginBody = $prefs.valueForKey(LOGIN_BODY_KEY);
  const loginToken = $prefs.valueForKey(LOGIN_TOKEN_KEY);
  const loginUserAgent = $prefs.valueForKey(LOGIN_UA_KEY);
  const loginLanguage = $prefs.valueForKey(LOGIN_LANG_KEY) || "zh-CN";
  const queryBody = $prefs.valueForKey(QUERY_BODY_KEY);
  const queryUserAgent = $prefs.valueForKey(QUERY_UA_KEY);
  const queryLanguage = $prefs.valueForKey(QUERY_LANG_KEY) || "zh-CN";
  const login = unescapeXml(String(loginBody || ""));
  const query = unescapeXml(String(queryBody || ""));
  if (!GUID.test(String(loginToken || "")) || loginToken === EMPTY_SESSION ||
      !login.includes("<SystemObjectRun") || !login.includes("<Action>Login</Action>") ||
      !GUID.test(field(login, "UserID")) || field(login, "UserID") === EMPTY_SESSION ||
      field(login, "SessionGuid") !== EMPTY_SESSION ||
      !String(loginUserAgent || "").includes("SCSAPPForms.iOS") ||
      !query.includes("<BusinessObjectRun") || !query.includes("<FuncID>GetAttendData</FuncID>") ||
      !GUID.test(field(query, "SessionGuid")) ||
      !String(queryUserAgent || "").includes("SCSAPPForms.iOS"))
    throw new Error("请先用 QX 开启重写并在 App 查看一次当日考勤");
  const tokenField = /(&lt;UserID&gt;)[0-9a-f-]{36}(&lt;\/UserID&gt;)/i;
  if (!tokenField.test(loginBody)) throw new Error("App 登录请求格式错误");
  const currentLogin = loginBody.replace(tokenField,
    (_, start, end) => start + loginToken + end);
  const loginResult = await post(currentLogin, loginUserAgent, loginLanguage);
  if (field(loginResult, "Result").toLowerCase() !== "true")
    throw new Error("考勤自动登录失败");
  const session = field(loginResult, "SessionGuid");
  if (!GUID.test(session) || session === EMPTY_SESSION)
    throw new Error("登录未返回有效会话");
  if (!$prefs.setValueForKey(session, LOGIN_TOKEN_KEY))
    throw new Error("无法保存更新后的登录会话");
  const querySession = /<SessionGuid>[0-9a-f-]{36}<\/SessionGuid>/i;
  if (!querySession.test(queryBody)) throw new Error("考勤请求格式错误");
  const currentQuery = queryBody.replace(querySession,
    "<SessionGuid>" + session + "</SessionGuid>");
  const result = await post(currentQuery, queryUserAgent, queryLanguage);
  const times = clockOut(result);
  $notify("下班打卡提醒",
    times.clockOut + (times.nextDay ? "（次日）" : "") + " 可打卡下班",
    "今日上班时间：" + times.clockIn);
}
if (typeof $response !== "undefined") {
  captureResponse();
  $done({});
} else if (typeof $request !== "undefined") {
  captureRequest();
  $done({});
} else {
  main().catch(error => {
    const allowed = ["请先用 QX 开启重写并在 App 查看一次当日考勤", "考勤服务连接失败",
      "考勤服务返回错误", "App 登录请求格式错误", "考勤自动登录失败",
      "登录未返回有效会话", "无法保存更新后的登录会话", "考勤请求格式错误",
      "查询未返回考勤数据，请打开 App 刷新", "考勤数据格式错误",
      "未找到今日唯一考勤记录", "今日上班时间为空"];
    const message = allowed.includes(error.message) ? error.message : "请手动查看考勤";
    $notify("下班打卡提醒", "查询失败", message);
  }).then(() => $done());
}
