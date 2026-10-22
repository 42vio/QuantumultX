// Run manually after disabling SFExpress_Auth_Diagnostic.qxrewrite.
const removed = $prefs.removeValueForKey('sfexpress_auth_diagnostics_v1')
$notify('顺丰诊断', removed ? '本地诊断样本已清除' : '清除失败或无样本', '原签到账号存储不受影响')
$done()
