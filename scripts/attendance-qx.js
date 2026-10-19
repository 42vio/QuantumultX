/* Quantumult X request rewrite + scheduled task in one file. */
const URL = "https://hrmapp.hitrontech.com:9999/scsrwd/SCSService.asmx";
const QUERY_BODY_KEY = "hrm_attendance_query_request";
const QUERY_UA_KEY = "hrm_attendance_query_user_agent";
const QUERY_LANG_KEY = "hrm_attendance_query_language";
const CAPTURE_NOTICE_DAY_KEY = "hrm_attendance_capture_notice_day_v3";
const GUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

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
    if (body.includes("<BusinessObjectRun") && body.includes("<FuncID>GetAttendData</FuncID>")) {
      const session = field(body, "SessionGuid");
      const userAgent = requestHeader("User-Agent");
      const language = requestHeader("Accept-Language") || "zh-CN";
      if (GUID.test(session) &&
          userAgent.includes("SCSAPPForms.iOS") &&
          $prefs.setValueForKey(original, QUERY_BODY_KEY) &&
          $prefs.setValueForKey(userAgent, QUERY_UA_KEY) &&
          $prefs.setValueForKey(language, QUERY_LANG_KEY)) {
        const today = todayChina();
        if ($prefs.valueForKey(CAPTURE_NOTICE_DAY_KEY) !== today) {
          $prefs.setValueForKey(today, CAPTURE_NOTICE_DAY_KEY);
          $notify("考勤重写成功", "已保存考勤查询请求", "可手动运行下班打卡提醒任务验证");
        }
      }
    }
  } catch (_) {
    // Never log request bodies or authentication values.
  }
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
  if (marker < 0) throw new Error("查询未返回考勤数据，请打开 App 刷新");
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
  const queryBody = $prefs.valueForKey(QUERY_BODY_KEY);
  const userAgent = $prefs.valueForKey(QUERY_UA_KEY);
  const language = $prefs.valueForKey(QUERY_LANG_KEY) || "zh-CN";
  const decoded = unescapeXml(String(queryBody || ""));
  if (!decoded.includes("<BusinessObjectRun") || !decoded.includes("<FuncID>GetAttendData</FuncID>") ||
      !GUID.test(field(decoded, "SessionGuid")) ||
      !String(userAgent || "").includes("SCSAPPForms.iOS"))
    throw new Error("请先用 QX 开启重写并在 App 查看一次当日考勤");
  const result = await post(queryBody, userAgent, language);
  const times = clockOut(result);
  $notify("下班打卡提醒", "今天 " + times.clockIn + " 上班",
    times.clockOut + (times.nextDay ? "（次日）" : "") + " 可打卡下班");
}
if (typeof $request !== "undefined") {
  captureRequest();
  $done({});
} else {
  main().catch(error => {
    const allowed = ["请先用 QX 开启重写并在 App 查看一次当日考勤", "考勤服务连接失败",
      "考勤服务返回错误", "查询未返回考勤数据，请打开 App 刷新", "考勤数据格式错误",
      "未找到今日唯一考勤记录", "今日上班时间为空"];
    const message = allowed.includes(error.message) ? error.message : "请手动查看考勤";
    $notify("下班打卡提醒", "查询失败", message);
  }).then(() => $done());
}
