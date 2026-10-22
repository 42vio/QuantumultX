# 重写与墨鱼去开屏重复检查

检查日期：2026-10-22。基准：仓库内 StartUpAds.downloaded.conf（文件标注 2026-08-29）。
输入：quantumult_20261021143541.conf 中除去开屏自身以外的 31 个已启用远程重写。以 Quantumult%20X User-Agent 下载。
比较时统一转义斜杠、空白和 GitHub refs/heads 路径。这里是文本及人工语义检查，不是完整正则包含关系证明，也未复现 QX opt-parser 最终转换结果。
本地 QuantumultX_JS.conf 已精简，但远程 main 仍返回旧版本；下表的自用脚本按手机当前远程订阅内容统计。

| 订阅 | 规则数 | 规范化后相同 | 同表达式不同动作 |
|---|---:|---:|---:|
| 大麦去广告@ddgksf2013 | 13 | 3 | 0 |
| 美柚去广告@ddgksf2013 | 5 | 0 | 0 |
| 中国联通去广告@ddgksf2013 | 10 | 0 | 0 |
| 微信小程序去广告@ddgksf2013 | 5 | 0 | 0 |
| 菜鸟裹裹去广告@ddgksf2013 | 13 | 0 | 0 |
| 淘票票去广告@ddgksf2013 | 9 | 0 | 0 |
| WeatherKit功能增强@NSRingo | 5 | 0 | 0 |
| Google人机功能增强@NobyDa | 1 | 0 | 0 |
| 🔰 重定向 | 60 | 0 | 0 |
| Emby Premiere | 1 | 0 | 0 |
| 哔哩广告净化Lite@ddgksf2013 | 8 | 0 | 0 |
| 🚫 去广告 | 1236 | 153 | 96 |
| BlockHTTPDNS | 21 | 0 | 0 |
| 🔰 自用脚本 | 7 | 0 | 1 |
| 🚫 起点去广告 | 1 | 0 | 0 |
| 🚫 番茄小说去广告 | 16 | 0 | 0 |
| 彩云天气净化@ddgksf2013 | 12 | 0 | 0 |
| 知乎净化助手@ddgksf2013 | 45 | 0 | 1 |
| 油管去广告@Maasea | 6 | 0 | 0 |
| 微博去广告@ddgksf2013 | 42 | 0 | 0 |
| 高德地图净化[卸载重装]@ddgksf2013 | 18 | 0 | 0 |
| 网易云净化@ddgksf2013 | 29 | 0 | 0 |
| 闲鱼净化[卸载重装]@ddgksf2013 | 14 | 1 | 0 |
| 小红书净化+去水印@ddgksf2013 | 25 | 0 | 0 |
| 百度网盘净化@ddgksf2013 | 15 | 2 | 0 |
| 微信解锁被屏蔽的URL@zZPiglet | 1 | 0 | 0 |
| 百度网盘倍速@ddgksf2013 | 2 | 0 | 0 |
| Safari超级搜索@ddgksf2013 | 83 | 0 | 0 |
| 豆瓣网页观影快捷跳转@ddgksf2013 | 1 | 0 | 0 |
| Google重定向@DivineEngine | 1 | 0 | 0 |
| 哔哩哔哩繁体CC字幕转中文简体 | 1 | 0 | 0 |

## 人工补充

- 微信小程序订阅中的公众号 getappmsgad 与去开屏第 799 行功能重复；表达式写法不同。其余小程序规则仍有独立功能。
- 大麦、闲鱼及菜鸟、淘票票、高德存在 amdc.js 引用复用；同脚本不同表达式不等于整个订阅重复。
- 微信解锁 weixin110.js 在去开屏第 794 行已注释，因此独立微信解锁订阅仍需要保留。
- AdvertisingLite 的 96 条同表达式不同动作中，84 条 reject 对 reject-200，10 条 reject-dict 对 reject-200，1 条 reject-img 对 reject-200，1 条 reject 对 response-body；不能当作完全相同的响应处理。
- 没有发现可仅凭完全重复就整份停用的订阅。

## 逐条命中

### 大麦去广告@ddgksf2013

配置行：180；来源：https://ddgksf2013.top/rewrite/DaMaiAds.conf

相同：订阅第 21 行 / 去开屏第 198 行

```text
^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.damai\.wireless\.home\.welcome url reject-200
```

相同：订阅第 23 行 / 去开屏第 199 行

```text
^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.damai\.mec\.popup\.get url reject-200
```

相同：订阅第 26 行 / 去开屏第 76 行

```text
^http:\/\/[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+){1,4}(:\d+)?\/amdc\/mobileDispatch url script-response-body https://raw.githubusercontent.com/ddgksf2013/Scripts/refs/heads/master/amdc.js
```

### 🚫 去广告

配置行：207；来源：https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rewrite/QuantumultX/AdvertisingLite/AdvertisingLite.conf

相同：订阅第 17 行 / 去开屏第 252 行

```text
^http:\/\/gateway2\.etnet\.com\.hk\/etnetApp\/theme\/seasonal\/v30\/theme.json url reject-200
```

相同：订阅第 19 行 / 去开屏第 116 行

```text
^http:\/\/m\.meitun\.com\/newapi\/router\/topic\/hometptf\/feedRecommend url reject-200
```

相同：订阅第 66 行 / 去开屏第 970 行

```text
^https:\/\/cn-app\.narwaltech\.com\/(operate\/(cactivity\/listByResourceIds|appPosition\/listSplash)|app-user-device-server\/v\d\/user-device\/getTips) url reject-200
```

相同：订阅第 103 行 / 去开屏第 522 行

```text
^https:\/\/mxsa\.mxbc\.net\/api\/v1\/adinfo\/limitedAds$ url reject-200
```

相同：订阅第 114 行 / 去开屏第 363 行

```text
^https:\/\/router-app-api\.jdcloud\.com\/v\d\/board\/routerAppSplash url reject-200
```

相同：订阅第 134 行 / 去开屏第 119 行

```text
^https?://advertise\.bczeducation\.cn\/rpc\/advertise url reject-200
```

相同：订阅第 152 行 / 去开屏第 631 行

```text
^https?:\/\/(commontgw|comapi)\.reader\.qq\.com\/(common\/adV|com-ad\/config) url reject-200
```

相同：订阅第 158 行 / 去开屏第 562 行

```text
^https?:\/\/3g\.csair\.com\/CSMBP\/bookProcess\/homepopup\/queryAdvertisement url reject-200
```

相同：订阅第 164 行 / 去开屏第 1019 行

```text
^https?:\/\/[a-zA-Z0-9_-]+\.admobile.top\/ url reject-200
```

相同：订阅第 165 行 / 去开屏第 1020 行

```text
^https?:\/\/[a-zA-Z0-9_-]+\.ranfenghd\.com\/ad url reject-200
```

相同：订阅第 166 行 / 去开屏第 1021 行

```text
^https?:\/\/[a-zA-Z0-9_-]+\.tianmu\.mobi\/ad url reject-200
```

相同：订阅第 167 行 / 去开屏第 1022 行

```text
^https?:\/\/[a-zA-Z0-9_-]+\.weathercn\.com\/(.*bypage|appindexicon) url reject-200
```

相同：订阅第 178 行 / 去开屏第 313 行

```text
^https?:\/\/acs-m\.freshippo\.com\/gw\/mtop\.wdk\.render\.querysinglepage url reject-200
```

相同：订阅第 180 行 / 去开屏第 546 行

```text
^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.alibaba\.mos\.app\.homepage\.launch url reject-200
```

相同：订阅第 183 行 / 去开屏第 199 行

```text
^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.damai\.mec\.popup\.get url reject-200
```

相同：订阅第 191 行 / 去开屏第 312 行

```text
^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.wdk\.render\.querysinglepage url reject-200
```

相同：订阅第 196 行 / 去开屏第 875 行

```text
^https?:\/\/ad\.cj\.sina\.cn\/(osa\/adpreload|fax\/impress) url reject-200
```

相同：订阅第 198 行 / 去开屏第 472 行

```text
^https?:\/\/ad\.lofter\.com\/.*yitou\/madr url reject-200
```

相同：订阅第 199 行 / 去开屏第 37 行

```text
^https?:\/\/ad\.mcloud\.139\.com\/advertapi url reject-200
```

相同：订阅第 207 行 / 去开屏第 741 行

```text
^https?:\/\/adm\.10jqka\.com\.cn\/interface\/ad\/recommend url reject-200
```

相同：订阅第 211 行 / 去开屏第 956 行

```text
^https?:\/\/ads\.closeli\.cn\/ url reject-200
```

相同：订阅第 216 行 / 去开屏第 387 行

```text
^https?:\/\/adv\.ccb\.com\/ebda\/ctm_adv url reject-200
```

相同：订阅第 217 行 / 去开屏第 1005 行

```text
^https?:\/\/adx-cn\.anythinktech\.com\/bid url reject-200
```

相同：订阅第 218 行 / 去开屏第 437 行

```text
^https?:\/\/adx\.zuoyebang\.com\/adxserver\/ url reject-200
```

相同：订阅第 223 行 / 去开屏第 548 行

```text
^https?:\/\/aikanvod\.miguvideo\.com\/video\/p\/i_adverseInterface\.jsp url reject-200
```

相同：订阅第 253 行 / 去开屏第 702 行

```text
^https?:\/\/api1\.34580\.com\/wx\/Home\/AdvertisementPhotoshootRequest url reject-200
```

相同：订阅第 255 行 / 去开屏第 635 行

```text
^https?:\/\/api2\.picooc\.com\/v\d\/api\/focus\/strategy\/execute url reject-200
```

相同：订阅第 261 行 / 去开屏第 445 行

```text
^https?:\/\/api\.00bang\.cn\/llb\/baseinfo\/advertise\/getAdvertiseByPageCode url reject-200
```

相同：订阅第 269 行 / 去开屏第 991 行

```text
^https?:\/\/api\.ahmobile\.cn:443\/eip\?eip_serv_id=app\.getAllNew url reject-200
```

相同：订阅第 283 行 / 去开屏第 720 行

```text
^https?:\/\/api\.cloud\.189\.cn\/guns\/getOpenscreenBanners url reject-200
```

相同：订阅第 285 行 / 去开屏第 411 行

```text
^https?:\/\/api\.coolapk\.com\/v6\/search\?.*type=hotSearch url reject-dict
```

相同：订阅第 288 行 / 去开屏第 761 行

```text
^https?:\/\/api\.dnurse\.com\/api\/boot\/get-latest-items url reject-200
```

相同：订阅第 296 行 / 去开屏第 180 行

```text
^https?:\/\/api\.gamer\.com\.tw\/mobile_app\/anime\/v\d\/anime_get_question\.php url reject-dict
```

相同：订阅第 313 行 / 去开屏第 1040 行

```text
^https?:\/\/api\.ireader\.mobi\/activity\/ad\/openScreen url reject-200
```

相同：订阅第 323 行 / 去开屏第 427 行

```text
^https?:\/\/api\.kmovie\.gifshow\.com\/rest\/n\/kmovie\/app\/(resource|banner) url reject-200
```

相同：订阅第 324 行 / 去开屏第 433 行

```text
^https?:\/\/api\.kurobbs\.com\/config\/getOpenScreen url reject-200
```

相同：订阅第 329 行 / 去开屏第 536 行

```text
^https?:\/\/api\.mcd\.cn\/bff\/portal\/(richpop|home\/splash) url reject-200
```

相同：订阅第 330 行 / 去开屏第 948 行

```text
^https?:\/\/api\.medlive\.cn\/promotion-api/adlist url reject-200
```

相同：订阅第 331 行 / 去开屏第 538 行

```text
^https?:\/\/api\.merach\.com\/app\/AppAdvertisingController\/getAdvert url reject-200
```

相同：订阅第 333 行 / 去开屏第 544 行

```text
^https?:\/\/api\.moomoo\.com(\/v\d)?\/ad url reject-200
```

相同：订阅第 343 行 / 去开屏第 639 行

```text
^https?:\/\/api\.qd-metro\.com\/ngstatic\/appScreenAds url reject-200
```

相同：订阅第 348 行 / 去开屏第 391 行

```text
^https?:\/\/api\.smart\.jd\.com\/c\/service\/getLoadingLinks url reject-200
```

相同：订阅第 350 行 / 去开屏第 517 行

```text
^https?:\/\/api\.taou\.com\/sdk\/global\/splash_ad url reject-200
```

相同：订阅第 352 行 / 去开屏第 310 行

```text
^https?:\/\/api\.touker\.com\/v2\/IAdvertisementAPI\.queryStartAdvertisement url reject-200
```

相同：订阅第 354 行 / 去开屏第 413 行

```text
^https?:\/\/api\.vistopia\.com\.cn\/api\/v\d\/home\/advertisement url reject
```

相同：订阅第 363 行 / 去开屏第 893 行

```text
^https?:\/\/api\.xiaoheihe\.cn\/.*get_ads_info url reject-200
```

相同：订阅第 374 行 / 去开屏第 925 行

```text
^https?:\/\/api\.yonghuivip\.com\/web\/shensuan\/ad\/getAd url reject-200
```

相同：订阅第 375 行 / 去开屏第 932 行

```text
^https?:\/\/api\.ys7\.com.*\/getAdvertising url reject-200
```

相同：订阅第 376 行 / 去开屏第 1050 行

```text
^https?:\/\/api\.zcool\.com\.cn\/.*common\/open-screen url reject-200
```

相同：订阅第 380 行 / 去开屏第 673 行

```text
^https?:\/\/api\d?\.musical\.ly\/api\/ad\/ url reject-img
```

相同：订阅第 389 行 / 去开屏第 540 行

```text
^https?:\/\/app-api\.medsci\.cn\/app-advertisement-space\/showAdList url reject-200
```

相同：订阅第 392 行 / 去开屏第 462 行

```text
^https?:\/\/app-gateway\.leisuapi\.com\/v\d\/app\/mobile\/(banners|ads) url reject-200
```

相同：订阅第 407 行 / 去开屏第 629 行

```text
^https?:\/\/app\.api\.qjjfin\.com\/publicize\/allList url reject-200
```

相同：订阅第 411 行 / 去开屏第 529 行

```text
^https?:\/\/app\.c\.nf\.migu\.cn\/.*column\/start(-)?up-pic url reject-200
```

相同：订阅第 418 行 / 去开屏第 218 行

```text
^https?:\/\/app\.duxiaoman\.com\/walletapp\/misc\/app_startup url reject-200
```

相同：订阅第 419 行 / 去开屏第 250 行

```text
^https?:\/\/app\.flymodem\.com\.cn\/Appapi\/Public\/welecome url reject-200
```

相同：订阅第 422 行 / 去开屏第 1038 行

```text
^https?:\/\/app\.ibuscloud\.com\/v\d\/(app\/getSkipAdvert|notice\/getNoticeWithAdvByCity) url reject-200
```

相同：订阅第 423 行 / 去开屏第 435 行

```text
^https?:\/\/app\.jiantou8\.com\/Home\/APP\/allAd url reject-200
```

相同：订阅第 450 行 / 去开屏第 95 行

```text
^https?:\/\/appwk\.baidu\.com\/xpage\/interface\/wknaad url reject-200
```

相同：订阅第 460 行 / 去开屏第 524 行

```text
^https?:\/\/bbs-api\.miyoushe\.com\/apihub\/api\/getAppSplash url reject-200
```

相同：订阅第 465 行 / 去开屏第 861 行

```text
^https?:\/\/bgw\.xinyue\.qq\.com\/xyapi\.PageService\/GetIndexPopFlash url reject-200
```

相同：订阅第 493 行 / 去开屏第 248 行

```text
^https?:\/\/carapp\.gtmc\.com\.cn\/api\/appgtmc\/homePage\/HomePageAction\/queryHomePageImg\.json url reject-200
```

相同：订阅第 494 行 / 去开屏第 586 行

```text
^https?:\/\/careapi\.oclean\.com\/mall\/v\d\/Temporary\/SafetyGetStartAdvert url reject-200
```

相同：订阅第 496 行 / 去开屏第 677 行

```text
^https?:\/\/ccsp-egmas\.sf-express\.com\/cx-app-base\/base\/app\/appVersion\/detectionUpgrade url reject-200
```

相同：订阅第 499 行 / 去开屏第 232 行

```text
^https?:\/\/cdn-evone-ceph\.echargenet\.com\/gw-emas-cdn url reject-200
```

相同：订阅第 500 行 / 去开屏第 230 行

```text
^https?:\/\/cdn-evone-ceph\.echargenet\.com\/gw-emas-cdn\/63c4e3b558bb610008969f89 url reject-200
```

相同：订阅第 522 行 / 去开屏第 962 行

```text
^https?:\/\/cdns\.chinastock\.com\.cn\/cdn\/omc\/app\/app\/(index_pop_banner|startup_banner) url reject-200
```

相同：订阅第 528 行 / 去开屏第 869 行

```text
^https?:\/\/client-api-v2\.oray\.com\/materials\/(SUNLOGIN_CLIENT_IOS_PROMOTION|SLCC_IOS_DEVICE|SLCC_IOS_STARTUP) url reject-200
```

相同：订阅第 531 行 / 去开屏第 859 行

```text
^https?:\/\/client-api\.oray\.com\/materials\/SLCC_IOS_STARTUP\?lang=zh-Hans-CN url reject-200
```

相同：订阅第 537 行 / 去开屏第 747 行

```text
^https?:\/\/client\.tujia\.com\/bnbapp-node\/app\/portal\/getStartPictureAdvertising url reject-200
```

相同：订阅第 544 行 / 去开屏第 885 行

```text
^https?:\/\/cmt\.comp\.360os\.com\/adv url reject-200
```

相同：订阅第 554 行 / 去开屏第 534 行

```text
^https?:\/\/comicapi\.manhuashe\.com\/v\d\/(ads\/adstrategys|public\/startupactivity) url reject-200
```

相同：订阅第 556 行 / 去开屏第 960 行

```text
^https?:\/\/compus\.xiaofubao\.com\/compus\/advertising url reject-200
```

相同：订阅第 560 行 / 去开屏第 325 行

```text
^https?:\/\/cq11344-app-https-api-1\.ictun\.com:443\/api\/app\/v\d\/appad url reject-200
```

相同：订阅第 561 行 / 去开屏第 520 行

```text
^https?:\/\/creditcardapp\.bankcomm\.cn\/mappweb_interface\/common\/(qryPopAds|qryLaunchAds)\.do url reject-200
```

相同：订阅第 563 行 / 去开屏第 554 行

```text
^https?:\/\/creditcardapp\.bankcomm\.com\/mappweb.*(Advert|Ads).do url reject-200
```

相同：订阅第 581 行 / 去开屏第 813 行

```text
^https?:\/\/device-box\.onethingpcs\.com\/.+\/adConf url reject-200
```

相同：订阅第 589 行 / 去开屏第 210 行

```text
^https?:\/\/dj\.palmestore\.com\/zybk\/api\/ad url reject-200
```

相同：订阅第 590 行 / 去开屏第 1007 行

```text
^https?:\/\/djcapp\.game\.qq\.com\/daoju\/igw\/main\/\?_service=welink\.ad\.list url reject-200
```

相同：订阅第 604 行 / 去开屏第 806 行

```text
^https?:\/\/easyreadfs\.nosdn\.127\.net\/ad-material\/ url reject-200
```

相同：订阅第 616 行 / 去开屏第 205 行

```text
^https?:\/\/entree-ws\.igetget\.com\/oms\/front\/start\/push url reject-200
```

相同：订阅第 617 行 / 去开屏第 944 行

```text
^https?:\/\/entry\.ubixioe\.com\/mob\/sdk\/v\d\/endpoint url reject-200
```

相同：订阅第 631 行 / 去开屏第 817 行

```text
^https?:\/\/file\.mylyg\.net\/banner\/(fc[a-f0-9]{30})\.jpg url reject-200
```

相同：订阅第 640 行 / 去开屏第 35 行

```text
^https?:\/\/ftapi\.10jqka\.com\.cn\/futgwapi\/api\/om\/v\d\/ad\/common\/transfer url reject-200
```

相同：订阅第 650 行 / 去开屏第 288 行

```text
^https?:\/\/games\.mobileapi\.hupu\.com\/interfaceAdMonitor url reject-img
```

相同：订阅第 656 行 / 去开屏第 1028 行

```text
^https?:\/\/gd\.10086\.cn\/gmccapp\/serv\/\?servicename=GMCCAPP_704_002_001_001 url reject-200
```

相同：订阅第 662 行 / 去开屏第 271 行

```text
^https?:\/\/gha\.ghac\.cn\:8081\/base\/app\/api\/ad\/query\?adType url reject-200
```

相同：订阅第 667 行 / 去开屏第 781 行

```text
^https?:\/\/god\.gameyw\.netease\.com\/v\d\/ad\/serving\/app-start url reject-200
```

相同：订阅第 669 行 / 去开屏第 954 行

```text
^https?:\/\/gorgon\.youdao\.com\/gorgon url reject-200
```

相同：订阅第 674 行 / 去开屏第 759 行

```text
^https?:\/\/gw-app-gateway\.gwmapp-w\.com\/app-api.*Type=APPSECONDAD url reject-200
```

相同：订阅第 685 行 / 去开屏第 989 行

```text
^https?:\/\/gx\.10086\.cn\/zt-portal\/gxhzg\/portal\/app\/api\/v url reject-200
```

相同：订阅第 691 行 / 去开屏第 425 行

```text
^https?:\/\/hc-ssp\.sm\.cn url reject-200
```

相同：订阅第 696 行 / 去开屏第 315 行

```text
^https?:\/\/hfapp-service\.qweather\.net\/.*\/ad\/ url reject-200
```

相同：订阅第 706 行 / 去开屏第 321 行

```text
^https?:\/\/hxqapi\.hiyun\.tv\/api\/notification\/plans url reject-200
```

相同：订阅第 710 行 / 去开屏第 1044 行

```text
^https?:\/\/i\.zhaojinapp\.com\/APPAD url reject-200
```

相同：订阅第 720 行 / 去开屏第 695 行

```text
^https?:\/\/igetcool-gateway\.igetcool\.com\/app-api-other-server\/white\/open\/ads.json url reject-200
```

相同：订阅第 722 行 / 去开屏第 1010 行

```text
^https?:\/\/ih2\.ireader\.com\/zyapi\/self\/screen\/ad url reject-200
```

相同：订阅第 773 行 / 去开屏第 141 行

```text
^https?:\/\/iyes\.youku\.com\/uts/v\d\/start url reject-200
```

相同：订阅第 781 行 / 去开屏第 349 行

```text
^https?:\/\/jdread-api\.jd\.com\/jdread\/api\/channel\/module\/opens url reject-200
```

相同：订阅第 782 行 / 去开屏第 350 行

```text
^https?:\/\/jdread-api\.jd\.com\/jdread\/api\/popup url reject-200
```

相同：订阅第 785 行 / 去开屏第 815 行

```text
^https?:\/\/jz\.wacaijizhang\.com\/api\/banners\/newSplash url reject-200
```

相同：订阅第 792 行 / 去开屏第 480 行

```text
^https?:\/\/lens\.leoao\.com\/lens\/.+(getUserScheme|queryAppBanners|Advert|popup) url reject-200
```

相同：订阅第 800 行 / 去开屏第 365 行

```text
^https?:\/\/lop-proxy\.jd\.com\/queryAppHomePageMarketingRecommendRuleConfigInfo url reject-200
```

相同：订阅第 802 行 / 去开屏第 706 行

```text
^https?:\/\/m-adphone\.wenhua\.com\.cn\/ url reject-200
```

相同：订阅第 809 行 / 去开屏第 964 行

```text
^https?:\/\/m\.api\.shaoxing\.com\.cn\/v\d\/start url reject-200
```

相同：订阅第 819 行 / 去开屏第 940 行

```text
^https?:\/\/m\.msyc\.cc\/app\/getBootPage\/v\d url reject-200
```

相同：订阅第 824 行 / 去开屏第 607 行

```text
^https?:\/\/m\.stock\.pingan\.com\/restapi\/rmd\/open\/O\/api\/openAd url reject-200
```

相同：订阅第 825 行 / 去开屏第 728 行

```text
^https?:\/\/m\.tuniu\.com\/api\/operation\/splash\/ url reject-200
```

相同：订阅第 841 行 / 去开屏第 208 行

```text
^https?:\/\/maicai\.api\.ddxq\.mobi\/advert\/startUpScreen url reject-200
```

相同：订阅第 847 行 / 去开屏第 193 行

```text
^https?:\/\/mama\.dxy\.com\/api\/cms\/client\/popup-window\/list url reject-200
```

相同：订阅第 849 行 / 去开屏第 776 行

```text
^https?:\/\/mapi\.appvipshop\.com\/vips-mobile\/rest\/activity\/advertisement\/get url reject-200
```

相同：订阅第 881 行 / 去开屏第 512 行

```text
^https?:\/\/mix-api\.camera360\.com\/v\d\/operational-positions url reject-200
```

相同：订阅第 890 行 / 去开屏第 506 行

```text
^https?:\/\/mob\.mddcloud\.com\.cn\/adApi\/advert url reject-200
```

相同：订阅第 899 行 / 去开屏第 889 行

```text
^https?:\/\/mobileapi\.xiamenair\.com\/mobile-starter\/.+\/getStartAD url reject-200
```

相同：订阅第 917 行 / 去开屏第 1036 行

```text
^https?:\/\/newapp2\.szsmk\.com\/app\/config\/queryMainAd url reject-200
```

相同：订阅第 920 行 / 去开屏第 968 行

```text
^https?:\/\/newsuperapp\.ftms\.com\.cn\/app-bff\/.*openScreenPicture url reject-200
```

相同：订阅第 924 行 / 去开屏第 118 行

```text
^https?:\/\/notify\.baicizhan\.com\/rpc\/notify\/get_latest_notify url reject-200
```

相同：订阅第 930 行 / 去开屏第 966 行

```text
^https?:\/\/oneapp-api\.faw-vw\.com\/content\/.*Code=VWAPP_ICE_OPEN_SCREEN_ADS url reject-200
```

相同：订阅第 934 行 / 去开屏第 58 行

```text
^https?:\/\/open\.78dm\.net\/v\d\/site\/ad\/ url reject-200
```

相同：订阅第 939 行 / 去开屏第 516 行

```text
^https?:\/\/open\.taou\.com\/maimai\/launch_ad url reject-200
```

相同：订阅第 970 行 / 去开屏第 393 行

```text
^https?:\/\/patientgate\.91160\.com\/advert-api\/v\d\/advert url reject-200
```

相同：订阅第 971 行 / 去开屏第 490 行

```text
^https?:\/\/peisongapi\.meituan\.com\/client\/getInitiateImage url reject-200
```

相同：订阅第 978 行 / 去开屏第 611 行

```text
^https?:\/\/pjlapi\.paojd\.cn\/na\/pjlNa url reject-200
```

相同：订阅第 987 行 / 去开屏第 594 行

```text
^https?:\/\/pss\.txffp\.com\/piaogen\/images\/launchScreen/ url reject-200
```

相同：订阅第 994 行 / 去开屏第 627 行

```text
^https?:\/\/qadx\.qinlinad\.com\/ad\/ url reject-200
```

相同：订阅第 995 行 / 去开屏第 877 行

```text
^https?:\/\/qcwx\.medproad\.com:8080\/ad\/ url reject-200
```

相同：订阅第 1000 行 / 去开屏第 1015 行

```text
^https?:\/\/quanguo\.mygolbs\.com:8081\/MyBusServer\/servlet\/MyGoServer\.HttpPool\.HttpHandlerServlet url reject-200
```

相同：订阅第 1010 行 / 去开屏第 466 行

```text
^https?:\/\/rengine-platform\.llsapp\.com\/auth\/api\/remoteResource\/darwin url reject-200
```

相同：订阅第 1036 行 / 去开屏第 164 行

```text
^https?:\/\/sdk\.alibaba\.com\.ailbaba\.me\/.*?\/v\d\/(version|top_notice\?|advert\?position=[^2]+) url reject-200
```

相同：订阅第 1038 行 / 去开屏第 657 行

```text
^https?:\/\/sdk\.tianmu\.mobi\/ad url reject-200
```

相同：订阅第 1048 行 / 去开屏第 855 行

```text
^https?:\/\/shopapi\.io\.mi\.com\/mtop\/mf\/resource\/homePage\/pageConfig url reject-200
```

相同：订阅第 1051 行 / 去开屏第 895 行

```text
^https?:\/\/siteapi\.zaixs\.com\/.*\/start_ad url reject-200
```

相同：订阅第 1054 行 / 去开屏第 38 行

```text
^https?:\/\/smsrebuild1\.mail\.10086\.cn\/together\/s url reject-200
```

相同：订阅第 1058 行 / 去开屏第 808 行

```text
^https?:\/\/sp\.kaola\.com\/api\/openad url reject-200
```

相同：订阅第 1087 行 / 去开屏第 383 行

```text
^https?:\/\/superapp\.xgimi\.com\/api/v1\/app\/ad\/configs\?_sort=createdAt:Adesc url reject-200
```

相同：订阅第 1089 行 / 去开屏第 789 行

```text
^https?:\/\/support\.you\.163\.com\/xhr\/boot\/getBootMedia\.json url reject-200
```

相同：订阅第 1100 行 / 去开屏第 749 行

```text
^https?:\/\/td\.cgmcare\.cn\/api\/ad url reject-200
```

相同：订阅第 1109 行 / 去开屏第 518 行

```text
^https?:\/\/track\.mm\.taou\.com/v\d\/track url reject-200
```

相同：订阅第 1129 行 / 去开屏第 704 行

```text
^https?:\/\/vidz\.3hxq\.cn\/api\/app\/(miscs\/mine\/extensions|announcements\/home) url reject-dict
```

相同：订阅第 1134 行 / 去开屏第 699 行

```text
^https?:\/\/wallpaper\.soutushenqi\.com\/v\d\/dateSignature\/random url reject-200
```

相同：订阅第 1135 行 / 去开屏第 700 行

```text
^https?:\/\/wallpaper\.soutushenqi\.com\/v\d\/home\/dialog url reject-200
```

相同：订阅第 1140 行 / 去开屏第 833 行

```text
^https?:\/\/wcprd\.hilton\.com\.cn\/app-middleware\/graphql\?type=splashAd url reject-200
```

相同：订阅第 1155 行 / 去开屏第 82 行

```text
^https?:\/\/www\.ahzs10000\.com\/palmhall\/client\/base\/newVerson_getStartUp\.action url reject-200
```

相同：订阅第 1161 行 / 去开屏第 147 行

```text
^https?:\/\/www\.ctm\.net\/crm_api\/.*advertise url reject-200
```

相同：订阅第 1170 行 / 去开屏第 429 行

```text
^https?:\/\/www\.kujiale\.com\/app\/queryOpenPage url reject-200
```

相同：订阅第 1176 行 / 去开屏第 605 行

```text
^https?:\/\/www\.pansearch\.me\/api\/adsite url reject-dict
```

相同：订阅第 1182 行 / 去开屏第 887 行

```text
^https?:\/\/www\.xqpark\.cn\/xqParkApp\/resource\/getResource url reject-200
```

相同：订阅第 1183 行 / 去开屏第 755 行

```text
^https?:\/\/www\.zjyilin\.com\/hykweb\/\/index\/openImg url reject-200
```

相同：订阅第 1187 行 / 去开屏第 883 行

```text
^https?:\/\/xapi\.xinmanhua\.net\/splashgroups\?include=splashs url reject-200
```

相同：订阅第 1200 行 / 去开屏第 327 行

```text
^https?:\/\/yyfapi\.huatu\.com\/common\/ad\/ url reject-200
```

相同：订阅第 1207 行 / 去开屏第 891 行

```text
^https?:\/\/zjh5api\.ott4china\.com:8091\/cp-api\/view\/config\/pos url reject-200
```

相同：订阅第 1208 行 / 去开屏第 1032 行

```text
^https?:\/\/zjmbank\.js96008\.com:8090\/gw\/advert\/oprAdvertQry url reject-200
```

相同：订阅第 1220 行 / 去开屏第 405 行

```text
https://dynamicad.kfc.com.cn/api/app5/homepage/ai/popup url reject-200
```

同表达式不同动作：订阅第 45 行 / 去开屏第 107 行

```text
订阅：^https:\/\/api\.sfacg\.com\/ioscfg url reject
去开屏：^https:\/\/api\.sfacg\.com\/ioscfg url reject-200
```

同表达式不同动作：订阅第 151 行 / 去开屏第 355 行

```text
订阅：^https?:\/\/(bdsp-x|dsp-x)\.jd\.com\/adx\/ url reject
去开屏：^https?:\/\/(bdsp-x|dsp-x)\.jd\.com\/adx\/ url reject-200
```

同表达式不同动作：订阅第 156 行 / 去开屏第 453 行

```text
订阅：^https?:\/\/(mobile|shop)\.laichon\.com\/api\/(v1\/goods\/goodsList|exposureAdvStatistics|getWebAdvList) url reject
去开屏：^https?:\/\/(mobile|shop)\.laichon\.com\/api\/(v1\/goods\/goodsList|exposureAdvStatistics|getWebAdvList) url reject-200
```

同表达式不同动作：订阅第 157 行 / 去开屏第 492 行

```text
订阅：^https?:\/\/(s3plus|flowplus)\.meituan\.net\/v\d\/\w+\/linglong\/\w+\.(gif|jpg|mp4) url reject
去开屏：^https?:\/\/(s3plus|flowplus)\.meituan\.net\/v\d\/\w+\/linglong\/\w+\.(gif|jpg|mp4) url reject-200
```

同表达式不同动作：订阅第 172 行 / 去开屏第 379 行

```text
订阅：^https?:\/\/\w+\.kakamobi\.cn\/api\/open\/v\d\/advert-sdk\/ url reject
去开屏：^https?:\/\/\w+\.kakamobi\.cn\/api\/open\/v\d\/advert-sdk\/ url reject-200
```

同表达式不同动作：订阅第 175 行 / 去开屏第 996 行

```text
订阅：^https?:\/\/a\.qiumibao\.com\/ios\/config\/\?version_code= url reject
去开屏：^https?:\/\/a\.qiumibao\.com\/ios\/config\/\?version_code= url reject-200
```

同表达式不同动作：订阅第 185 行 / 去开屏第 730 行

```text
订阅：^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.film\.mtopadvertiseapi\.queryadvertise\/ url reject-dict
去开屏：^https?:\/\/acs\.m\.taobao\.com\/gw\/mtop\.film\.mtopadvertiseapi\.queryadvertise\/ url reject-200
```

同表达式不同动作：订阅第 200 行 / 去开屏第 980 行

```text
订阅：^https?:\/\/ad\.mcloud\.139\.com\/advertapi\/adv-filter\/adv-filter\/AdInfoFilter\/getAdInfos$ url reject-dict
去开屏：^https?:\/\/ad\.mcloud\.139\.com\/advertapi\/adv-filter\/adv-filter\/AdInfoFilter\/getAdInfos$ url reject-200
```

同表达式不同动作：订阅第 205 行 / 去开屏第 1000 行

```text
订阅：^https?:\/\/adapi\.izuiyou\.com\/ url reject
去开屏：^https?:\/\/adapi\.izuiyou\.com\/ url reject-200
```

同表达式不同动作：订阅第 240 行 / 去开屏第 67 行

```text
订阅：^https?:\/\/api-new\.app\.acfun\.cn\/rest\/app\/flash\/screen\/ url reject
去开屏：^https?:\/\/api-new\.app\.acfun\.cn\/rest\/app\/flash\/screen\/ url reject-200
```

同表达式不同动作：订阅第 243 行 / 去开屏第 691 行

```text
订阅：^https?:\/\/api-sams\.walmartmobile\.cn\/api\/v1\/sams\/sams-user\/(window\/getGoUpPlus|screen_promotion\/get) url reject
去开屏：^https?:\/\/api-sams\.walmartmobile\.cn\/api\/v1\/sams\/sams-user\/(window\/getGoUpPlus|screen_promotion\/get) url reject-200
```

同表达式不同动作：订阅第 257 行 / 去开屏第 145 行

```text
订阅：^https?:\/\/api3\.cls\.cn\/v1\/boot\/ad url reject
去开屏：^https?:\/\/api3\.cls\.cn\/v1\/boot\/ad url reject-200
```

同表达式不同动作：订阅第 258 行 / 去开屏第 300 行

```text
订阅：^https?:\/\/api4\.bybutter\.com\/v\d\/app\/placements\/\d\/advertisements url reject
去开屏：^https?:\/\/api4\.bybutter\.com\/v\d\/app\/placements\/\d\/advertisements url reject-200
```

同表达式不同动作：订阅第 260 行 / 去开屏第 592 行

```text
订阅：^https?:\/\/api\.(pinduoduo|yangkeduo)\.com\/api\/cappuccino\/splash url reject
去开屏：^https?:\/\/api\.(pinduoduo|yangkeduo)\.com\/api\/cappuccino\/splash url reject-200
```

同表达式不同动作：订阅第 263 行 / 去开屏第 583 行

```text
订阅：^https?:\/\/api\.21ec74\.com\/v2\.5\/ad url reject
去开屏：^https?:\/\/api\.21ec74\.com\/v2\.5\/ad url reject-200
```

同表达式不同动作：订阅第 276 行 / 去开屏第 136 行

```text
订阅：^https?:\/\/api\.caijingmobile\.com\/(ad|advert)\/ url reject
去开屏：^https?:\/\/api\.caijingmobile\.com\/(ad|advert)\/ url reject-200
```

同表达式不同动作：订阅第 286 行 / 去开屏第 186 行

```text
订阅：^https?:\/\/api\.dangdang\.com\/mapi\d\/mobile\/init url reject
去开屏：^https?:\/\/api\.dangdang\.com\/mapi\d\/mobile\/init url reject-200
```

同表达式不同动作：订阅第 289 行 / 去开屏第 166 行

```text
订阅：^https?:\/\/api\.douban\.com\/v2\/app_ads\/splash url reject
去开屏：^https?:\/\/api\.douban\.com\/v2\/app_ads\/splash url reject-200
```

同表达式不同动作：订阅第 297 行 / 去开屏第 190 行

```text
订阅：^https?:\/\/api\.gaoqingdianshi\.com\/api\/v\d\/ad\/ url reject
去开屏：^https?:\/\/api\.gaoqingdianshi\.com\/api\/v\d\/ad\/ url reject-200
```

同表达式不同动作：订阅第 307 行 / 去开屏第 308 行

```text
订阅：^https?:\/\/api\.haohaozhu\.cn\/index\.php\/home\/AppInit\/getStartPhoto url reject
去开屏：^https?:\/\/api\.haohaozhu\.cn\/index\.php\/home\/AppInit\/getStartPhoto url reject-200
```

同表达式不同动作：订阅第 314 行 / 去开屏第 1001 行

```text
订阅：^https?:\/\/api\.izuiyou\.com\/ad\/ url reject
去开屏：^https?:\/\/api\.izuiyou\.com\/ad\/ url reject-200
```

同表达式不同动作：订阅第 317 行 / 去开屏第 377 行

```text
订阅：^https?:\/\/api\.jxedt\.com\/ad\/ url reject
去开屏：^https?:\/\/api\.jxedt\.com\/ad\/ url reject-200
```

同表达式不同动作：订阅第 327 行 / 去开屏第 946 行

```text
订阅：^https?:\/\/api\.m\.jd\.com\/client\.action\?functionId=home_launchConfig url reject
去开屏：^https?:\/\/api\.m\.jd\.com\/client\.action\?functionId=home_launchConfig url reject-200
```

同表达式不同动作：订阅第 342 行 / 去开屏第 633 行

```text
订阅：^https?:\/\/api\.qbb6\.com\/ad\/ url reject
去开屏：^https?:\/\/api\.qbb6\.com\/ad\/ url reject-200
```

同表达式不同动作：订阅第 351 行 / 去开屏第 367 行

```text
订阅：^https?:\/\/api\.tipsoon\.com\/api\/v\d\/top\/ad url reject-img
去开屏：^https?:\/\/api\.tipsoon\.com\/api\/v\d\/top\/ad url reject-200
```

同表达式不同动作：订阅第 358 行 / 去开屏第 801 行

```text
订阅：^https?:\/\/api\.wfdata\.club\/v2\/yesfeng\/(infoCenterAd|yesList) url reject
去开屏：^https?:\/\/api\.wfdata\.club\/v2\/yesfeng\/(infoCenterAd|yesList) url reject-200
```

同表达式不同动作：订阅第 360 行 / 去开屏第 811 行

```text
订阅：^https?:\/\/api\.wmpvp\.com\/api\/v\d\/config\/promote url reject
去开屏：^https?:\/\/api\.wmpvp\.com\/api\/v\d\/config\/promote url reject-200
```

同表达式不同动作：订阅第 368 行 / 去开屏第 863 行

```text
订阅：^https?:\/\/api\.xueqiu\.com\/snowpard\/launch_strategy\/query\.json url reject
去开屏：^https?:\/\/api\.xueqiu\.com\/snowpard\/launch_strategy\/query\.json url reject-200
```

同表达式不同动作：订阅第 370 行 / 去开屏第 916 行

```text
订阅：^https?:\/\/api\.yikaobang\.com\.cn\/client\/main\/homePageSmallAd url reject
去开屏：^https?:\/\/api\.yikaobang\.com\.cn\/client\/main\/homePageSmallAd url reject-200
```

同表达式不同动作：订阅第 371 行 / 去开屏第 917 行

```text
订阅：^https?:\/\/api\.yikaobang\.com\.cn\/index\.php\/Client\/main\/startPage url reject
去开屏：^https?:\/\/api\.yikaobang\.com\.cn\/index\.php\/Client\/main\/startPage url reject-200
```

同表达式不同动作：订阅第 394 行 / 去开屏第 143 行

```text
订阅：^https?:\/\/app-gw\.csdn\.net\/silkroad-api\/api\/v\d\/assemble\/list\/pub\/channel\/app_open_screen_ad url reject
去开屏：^https?:\/\/app-gw\.csdn\.net\/silkroad-api\/api\/v\d\/assemble\/list\/pub\/channel\/app_open_screen_ad url reject-200
```

同表达式不同动作：订阅第 420 行 / 去开屏第 138 行

```text
订阅：^https?:\/\/app\.hbooker\.com\/setting\/get_startpage_url_list url reject
去开屏：^https?:\/\/app\.hbooker\.com\/setting\/get_startpage_url_list url reject-200
```

同表达式不同动作：订阅第 421 行 / 去开屏第 697 行

```text
订阅：^https?:\/\/app\.homeinns\.com\/api\/landing url reject
去开屏：^https?:\/\/app\.homeinns\.com\/api\/landing url reject-200
```

同表达式不同动作：订阅第 433 行 / 去开屏第 923 行

```text
订阅：^https?:\/\/app\.yinxiang\.com\/ads\/ url reject
去开屏：^https?:\/\/app\.yinxiang\.com\/ads\/ url reject-200
```

同表达式不同动作：订阅第 439 行 / 去开屏第 732 行

```text
订阅：^https?:\/\/appactive\.1234567\.com\.cn\/AppoperationApi\/OperationService\/GetAppStartImg url reject
去开屏：^https?:\/\/appactive\.1234567\.com\.cn\/AppoperationApi\/OperationService\/GetAppStartImg url reject-200
```

同表达式不同动作：订阅第 442 行 / 去开屏第 284 行

```text
订阅：^https?:\/\/appapi\.huazhu\.com:\d{4}\/client\/app\/getAppStartPage\/ url reject
去开屏：^https?:\/\/appapi\.huazhu\.com:\d{4}\/client\/app\/getAppStartPage\/ url reject-200
```

同表达式不同动作：订阅第 449 行 / 去开屏第 105 行

```text
订阅：^https?:\/\/apps\.api\.ke\.com\/config\/config\/(bootpage|getactivityconfig) url reject
去开屏：^https?:\/\/apps\.api\.ke\.com\/config\/config\/(bootpage|getactivityconfig) url reject-200
```

同表达式不同动作：订阅第 455 行 / 去开屏第 526 行

```text
订阅：^https?:\/\/axxd\.xmseeyouyima\.com\/v\d\/getad url reject
去开屏：^https?:\/\/axxd\.xmseeyouyima\.com\/v\d\/getad url reject-200
```

同表达式不同动作：订阅第 473 行 / 去开屏第 121 行

```text
订阅：^https?:\/\/bp-api\.bestv\.com\.cn\/cms\/api\/free\/open\/advertisingV2 url reject
去开屏：^https?:\/\/bp-api\.bestv\.com\.cn\/cms\/api\/free\/open\/advertisingV2 url reject-200
```

同表达式不同动作：订阅第 509 行 / 去开屏第 912 行

```text
订阅：^https?:\/\/cdn\.cmgadx\.com\/sdk\/pool\/\w+\.json url reject
去开屏：^https?:\/\/cdn\.cmgadx\.com\/sdk\/pool\/\w+\.json url reject-200
```

同表达式不同动作：订阅第 511 行 / 去开屏第 191 行

```text
订阅：^https?:\/\/cdn\.dianshihome\.com\/static\/ad\/ url reject
去开屏：^https?:\/\/cdn\.dianshihome\.com\/static\/ad\/ url reject-200
```

同表达式不同动作：订阅第 534 行 / 去开屏第 620 行

```text
订阅：^https?:\/\/client\.qunar\.com\/pitcher-proxy\?qrt=p_splashAd url reject
去开屏：^https?:\/\/client\.qunar\.com\/pitcher-proxy\?qrt=p_splashAd url reject-200
```

同表达式不同动作：订阅第 547 行 / 去开屏第 140 行

```text
订阅：^https?:\/\/cn-acs\.m\.cainiao\.com\/gw\/mtop\.cainiao\.guoguo\.nbnetflow\.ads\.(show|mshow)\.cn\/ url reject-dict
去开屏：^https?:\/\/cn-acs\.m\.cainiao\.com\/gw\/mtop\.cainiao\.guoguo\.nbnetflow\.ads\.(show|mshow)\.cn\/ url reject-200
```

同表达式不同动作：订阅第 575 行 / 去开屏第 172 行

```text
订阅：^https?:\/\/daoyu\.sdo\.com\/api\/userCommon\/getAppStartAd url reject
去开屏：^https?:\/\/daoyu\.sdo\.com\/api\/userCommon\/getAppStartAd url reject-200
```

同表达式不同动作：订阅第 587 行 / 去开屏第 511 行

```text
订阅：^https?:\/\/dispatcher\.camera360\.com\/api\/v1\/list$ url reject
去开屏：^https?:\/\/dispatcher\.camera360\.com\/api\/v1\/list$ url reject-200
```

同表达式不同动作：订阅第 594 行 / 去开屏第 203 行

```text
订阅：^https?:\/\/dq\.dxy\.cn\/api\.php\?action=getpostbanners url reject
去开屏：^https?:\/\/dq\.dxy\.cn\/api\.php\?action=getpostbanners url reject-200
```

同表达式不同动作：订阅第 620 行 / 去开屏第 56 行

```text
订阅：^https?:\/\/evs\.500\.com\/esinfo\/loading\/loading url reject
去开屏：^https?:\/\/evs\.500\.com\/esinfo\/loading\/loading url reject-200
```

同表达式不同动作：订阅第 621 行 / 去开屏第 375 行

```text
订阅：^https?:\/\/explorer\.tratao\.com\/api\/client\/v4\/xtransfer\/ad\/ url reject
去开屏：^https?:\/\/explorer\.tratao\.com\/api\/client\/v4\/xtransfer\/ad\/ url reject-200
```

同表达式不同动作：订阅第 643 行 / 去开屏第 276 行

```text
订阅：^https?:\/\/fuwu\.nhsa\.gov\.cn\/ebus\/fuwu\/api\/base\/cms\/iep\/web\/cms\/hmpgcfg\/queryAppHmpgCfgByApp url reject
去开屏：^https?:\/\/fuwu\.nhsa\.gov\.cn\/ebus\/fuwu\/api\/base\/cms\/iep\/web\/cms\/hmpgcfg\/queryAppHmpgCfgByApp url reject-200
```

同表达式不同动作：订阅第 651 行 / 去开屏第 238 行

```text
订阅：^https?:\/\/gateway-api\.dushu365\.com\/chief-orch\/config\/config\/v100\/appConfig url reject
去开屏：^https?:\/\/gateway-api\.dushu365\.com\/chief-orch\/config\/config\/v100\/appConfig url reject-200
```

同表达式不同动作：订阅第 652 行 / 去开屏第 54 行

```text
订阅：^https?:\/\/gateway\.36kr\.com\/api\/adx\/ad\/show url reject
去开屏：^https?:\/\/gateway\.36kr\.com\/api\/adx\/ad\/show url reject-200
```

同表达式不同动作：订阅第 665 行 / 去开屏第 289 行

```text
订阅：^https?:\/\/goblin\.hupu\.com\/.+\/interfaceAd\/getOther url reject
去开屏：^https?:\/\/goblin\.hupu\.com\/.+\/interfaceAd\/getOther url reject-200
```

同表达式不同动作：订阅第 668 行 / 去开屏第 929 行

```text
订阅：^https?:\/\/gongdu\.youshu\.cc\/m\/open_screen\/list_by_udid url reject
去开屏：^https?:\/\/gongdu\.youshu\.cc\/m\/open_screen\/list_by_udid url reject-200
```

同表达式不同动作：订阅第 684 行 / 去开屏第 809 行

```text
订阅：^https?:\/\/gw\.kaola\.com\/gw\/dgmobile\/newOpenAd url reject
去开屏：^https?:\/\/gw\.kaola\.com\/gw\/dgmobile\/newOpenAd url reject-200
```

同表达式不同动作：订阅第 745 行 / 去开屏第 371 行

```text
订阅：^https?:\/\/img\.jiemian\.com\/ads\/ url reject
去开屏：^https?:\/\/img\.jiemian\.com\/ads\/ url reject-200
```

同表达式不同动作：订阅第 771 行 / 去开屏第 743 行

```text
订阅：^https?:\/\/iphone\.ac\.qq\.com\/.*\/Support\/(getSystemConf|bootScreen) url reject
去开屏：^https?:\/\/iphone\.ac\.qq\.com\/.*\/Support\/(getSystemConf|bootScreen) url reject-200
```

同表达式不同动作：订阅第 783 行 / 去开屏第 128 行

```text
订阅：^https?:\/\/js-ad\.ayximgs\.com\.ad-universe-cdn\.hzhcbkj\.cn\/xgapp\.php\/v2\/top_notice url reject
去开屏：^https?:\/\/js-ad\.ayximgs\.com\.ad-universe-cdn\.hzhcbkj\.cn\/xgapp\.php\/v2\/top_notice url reject-200
```

同表达式不同动作：订阅第 788 行 / 去开屏第 598 行

```text
订阅：^https?:\/\/lban\.spdb\.com\.cn\/mspmk-web-component\/(getAdvList|prefetchAdvList)\.ah url reject
去开屏：^https?:\/\/lban\.spdb\.com\.cn\/mspmk-web-component\/(getAdvList|prefetchAdvList)\.ah url reject-200
```

同表达式不同动作：订阅第 790 行 / 去开屏第 842 行

```text
订阅：^https?:\/\/lchttpapi\.xczim\.com\/1\.1\/functions\/getLaunchImageForIOS url reject
去开屏：^https?:\/\/lchttpapi\.xczim\.com\/1\.1\/functions\/getLaunchImageForIOS url reject-200
```

同表达式不同动作：订阅第 812 行 / 去开屏第 986 行

```text
订阅：^https?:\/\/m\.client\.10010\.com\/mobileService\/(activity|customer)\/(accountListData|get_client_adv|get_startadv) url reject
去开屏：^https?:\/\/m\.client\.10010\.com\/mobileService\/(activity|customer)\/(accountListData|get_client_adv|get_startadv) url reject-200
```

同表达式不同动作：订阅第 813 行 / 去开屏第 987 行

```text
订阅：^https?:\/\/m\.client\.10010\.com\/uniAdmsInterface\/(getHomePageAd|getWelcomeAd) url reject
去开屏：^https?:\/\/m\.client\.10010\.com\/uniAdmsInterface\/(getHomePageAd|getWelcomeAd) url reject-200
```

同表达式不同动作：订阅第 826 行 / 去开屏第 790 行

```text
订阅：^https?:\/\/m\.you\.163\.com\/activity\/popWindow url reject
去开屏：^https?:\/\/m\.you\.163\.com\/activity\/popWindow url reject-200
```

同表达式不同动作：订阅第 852 行 / 去开屏第 187 行

```text
订阅：^https?:\/\/mapi\.dangdang\.com\/index\.php\?action=init url reject
去开屏：^https?:\/\/mapi\.dangdang\.com\/index\.php\?action=init url reject-200
```

同表达式不同动作：订阅第 880 行 / 去开屏第 93 行

```text
订阅：^https?:\/\/mime\.baidu\.com\/v\d\/activity\/advertisement url reject
去开屏：^https?:\/\/mime\.baidu\.com\/v\d\/activity\/advertisement url reject-200
```

同表达式不同动作：订阅第 894 行 / 去开屏第 113 行

```text
订阅：^https?:\/\/mobads\.baidu\.com\/cpro\/ui\/mads.php url reject
去开屏：^https?:\/\/mobads\.baidu\.com\/cpro\/ui\/mads.php url reject-200
```

同表达式不同动作：订阅第 901 行 / 去开屏第 796 行

```text
订阅：^https?:\/\/mp\.weixin\.qq\.com\/mp\/cps_product_info url reject-dict
去开屏：^https?:\/\/mp\.weixin\.qq\.com\/mp\/cps_product_info url reject-200
```

同表达式不同动作：订阅第 902 行 / 去开屏第 689 行

```text
订阅：^https?:\/\/mpcs\.suning\.com\/mpcs\/dm\/getDmInfo url reject
去开屏：^https?:\/\/mpcs\.suning\.com\/mpcs\/dm\/getDmInfo url reject-200
```

同表达式不同动作：订阅第 903 行 / 去开屏第 849 行

```text
订阅：^https?:\/\/mpos-pic\.helipay\.com\/upload\/images\/advertisment url reject
去开屏：^https?:\/\/mpos-pic\.helipay\.com\/upload\/images\/advertisment url reject-200
```

同表达式不同动作：订阅第 910 行 / 去开屏第 358 行

```text
订阅：^https?:\/\/ms\.jr\.jd\.com\/gw\/generic\/aladdin\/(new)?na\/m\/getLoadingPicture url reject
去开屏：^https?:\/\/ms\.jr\.jd\.com\/gw\/generic\/aladdin\/(new)?na\/m\/getLoadingPicture url reject-200
```

同表达式不同动作：订阅第 955 行 / 去开屏第 493 行

```text
订阅：^https?:\/\/p\d\.meituan\.net\/(bizad|wmbanner)\/\w+\.jpg url reject
去开屏：^https?:\/\/p\d\.meituan\.net\/(bizad|wmbanner)\/\w+\.jpg url reject-200
```

同表达式不同动作：订阅第 957 行 / 去开屏第 494 行

```text
订阅：^https?:\/\/p\d\.meituan\.net\/movie\/\w+\.jpg\?may_covertWebp url reject
去开屏：^https?:\/\/p\d\.meituan\.net\/movie\/\w+\.jpg\?may_covertWebp url reject-200
```

同表达式不同动作：订阅第 962 行 / 去开屏第 99 行

```text
订阅：^https?:\/\/pan\.baidu\.com\/act\/api\/activityentry url reject
去开屏：^https?:\/\/pan\.baidu\.com\/act\/api\/activityentry url reject-200
```

同表达式不同动作：订阅第 963 行 / 去开屏第 97 行

```text
订阅：^https?:\/\/pan\.baidu\.com\/act\/v\d\/(bchannel|welfare)\/list url reject
去开屏：^https?:\/\/pan\.baidu\.com\/act\/v\d\/(bchannel|welfare)\/list url reject-200
```

同表达式不同动作：订阅第 968 行 / 去开屏第 98 行

```text
订阅：^https?:\/\/pan\.baidu\.com\/rest\/2\.0\/pcs\/ad url reject
去开屏：^https?:\/\/pan\.baidu\.com\/rest\/2\.0\/pcs\/ad url reject-200
```

同表达式不同动作：订阅第 977 行 / 去开屏第 910 行

```text
订阅：^https?:\/\/pipi\.4kya\.com\/\/xgapp\.php\/v3\/advert\.position=[^2]+ url reject
去开屏：^https?:\/\/pipi\.4kya\.com\/\/xgapp\.php\/v3\/advert\.position=[^2]+ url reject-200
```

同表达式不同动作：订阅第 993 行 / 去开屏第 857 行

```text
订阅：^https?:\/\/pzoap\.moedot\.net\/xgapp\.php\/v2\/top_notice url reject
去开屏：^https?:\/\/pzoap\.moedot\.net\/xgapp\.php\/v2\/top_notice url reject-200
```

同表达式不同动作：订阅第 1004 行 / 去开屏第 737 行

```text
订阅：^https?:\/\/r\.inews\.qq\.com\/(getBannerAds|getNewsRemoteConfig|getSplash|searchHotCatList|upLoadLoc) url reject
去开屏：^https?:\/\/r\.inews\.qq\.com\/(getBannerAds|getNewsRemoteConfig|getSplash|searchHotCatList|upLoadLoc) url reject-200
```

同表达式不同动作：订阅第 1017 行 / 去开屏第 103 行

```text
订阅：^https?:\/\/res\.pizzahut\.com\.cn\/CRM\/phad\/apphome\/apphome url reject
去开屏：^https?:\/\/res\.pizzahut\.com\.cn\/CRM\/phad\/apphome\/apphome url reject-200
```

同表达式不同动作：订阅第 1025 行 / 去开屏第 176 行

```text
订阅：^https?:\/\/rtbapi\.douyucdn\.cn\/japi\/sign\/app\/getinfo url reject-dict
去开屏：^https?:\/\/rtbapi\.douyucdn\.cn\/japi\/sign\/app\/getinfo url reject-200
```

同表达式不同动作：订阅第 1040 行 / 去开屏第 921 行

```text
订阅：^https?:\/\/service\.busi\.inke\.cn\/api\/flash\/screen url reject
去开屏：^https?:\/\/service\.busi\.inke\.cn\/api\/flash\/screen url reject-200
```

同表达式不同动作：订阅第 1045 行 / 去开屏第 683 行

```text
订阅：^https?:\/\/sh-gateway\.shihuo\.cn\/v\d\/services\/sh-adapi\/home\/screen url reject
去开屏：^https?:\/\/sh-gateway\.shihuo\.cn\/v\d\/services\/sh-adapi\/home\/screen url response-body egin_time":"\d{4} response-body egin_time":"2099
```

同表达式不同动作：订阅第 1047 行 / 去开屏第 881 行

```text
订阅：^https?:\/\/shop-api\.retail\.mi\.com\/mtop\/navi\/skywheel\/mishop\/splash url reject-dict
去开屏：^https?:\/\/shop-api\.retail\.mi\.com\/mtop\/navi\/skywheel\/mishop\/splash url reject-200
```

同表达式不同动作：订阅第 1049 行 / 去开屏第 680 行

```text
订阅：^https?:\/\/shopic\.sf-express\.com\/crm\/mobile\/common\/flashscreen url reject
去开屏：^https?:\/\/shopic\.sf-express\.com\/crm\/mobile\/common\/flashscreen url reject-200
```

同表达式不同动作：订阅第 1066 行 / 去开屏第 183 行

```text
订阅：^https?:\/\/ssp\.dzh\.com\.cn\/v2api\/adgroupjson url reject
去开屏：^https?://ssp\.dzh\.com\.cn/v2api/adgroupjson url reject-200
```

同表达式不同动作：订阅第 1070 行 / 去开屏第 651 行

```text
订阅：^https?:\/\/stat\.peopleapp\.com\/ url reject
去开屏：^https?:\/\/stat\.peopleapp\.com\/ url reject-200
```

同表达式不同动作：订阅第 1091 行 / 去开屏第 389 行

```text
订阅：^https?:\/\/switch\.jumpvg\.com\/jump\/(getlaunchad|recommend\/ad_conf) url reject
去开屏：^https?:\/\/switch\.jumpvg\.com\/jump\/(getlaunchad|recommend\/ad_conf) url reject-200
```

同表达式不同动作：订阅第 1092 行 / 去开屏第 998 行

```text
订阅：^https?:\/\/syh\.zybang\.com\/com\/adx\/ url reject
去开屏：^https?:\/\/syh\.zybang\.com\/com\/adx\/ url reject-200
```

同表达式不同动作：订阅第 1095 行 / 去开屏第 718 行

```text
订阅：^https?:\/\/t1\.market\.xiaomi\.com\/thumbnail\/webp\/w1170q100\/ url reject
去开屏：^https?:\/\/t1\.market\.xiaomi\.com\/thumbnail\/webp\/w1170q100\/ url reject-200
```

同表达式不同动作：订阅第 1099 行 / 去开屏第 745 行

```text
订阅：^https?:\/\/tcmobileapi\.17usoft\.com\/appindexnew\/index\/getappindexconfig url reject-dict
去开屏：^https?:\/\/tcmobileapi\.17usoft\.com\/appindexnew\/index\/getappindexconfig url reject-200
```

同表达式不同动作：订阅第 1104 行 / 去开屏第 460 行

```text
订阅：^https?:\/\/tk\.lanjiyin\.com\.cn\/ad\/getAdList url reject
去开屏：^https?:\/\/tk\.lanjiyin\.com\.cn\/ad\/getAdList url reject-200
```

同表达式不同动作：订阅第 1117 行 / 去开屏第 216 行

```text
订阅：^https?:\/\/ump\.sz\.creditcard\.ecitic\.com\/citiccard\/cm-ump\/ump-gateway\/ump-net-app\/ump-net-app\/adv url reject-dict
去开屏：^https?:\/\/ump\.sz\.creditcard\.ecitic\.com\/citiccard\/cm-ump\/ump-gateway\/ump-net-app\/ump-net-app\/adv url reject-200
```

同表达式不同动作：订阅第 1127 行 / 去开屏第 914 行

```text
订阅：^https?:\/\/venus\.yhd\.com\/memhome\/launchConfig url reject
去开屏：^https?:\/\/venus\.yhd\.com\/memhome\/launchConfig url reject-200
```

同表达式不同动作：订阅第 1194 行 / 去开屏第 792 行

```text
订阅：^https?:\/\/yanxuan\.nosdn\.127\.net\/.*\.mp4 url reject
去开屏：^https?:\/\/yanxuan\.nosdn\.127\.net\/.*\.mp4 url reject-200
```

同表达式不同动作：订阅第 1195 行 / 去开屏第 938 行

```text
订阅：^https?:\/\/ytmsout\.radio\.cn\/publish\/recScreen\/getLoadPage url reject-dict
去开屏：^https?:\/\/ytmsout\.radio\.cn\/publish\/recScreen\/getLoadPage url reject-200
```

同表达式不同动作：订阅第 1202 行 / 去开屏第 722 行

```text
订阅：^https?:\/\/zconfig\.alibabausercontent\.com\/zconfig url reject
去开屏：^https?:\/\/zconfig\.alibabausercontent\.com\/zconfig url reject-200
```

同表达式不同动作：订阅第 1213 行 / 去开屏第 1013 行

```text
订阅：^https?:\/\/ztoread\.ziroom\.com\/ymerApi\/v\d\/index\/open url reject-dict
去开屏：^https?:\/\/ztoread\.ziroom\.com\/ymerApi\/v\d\/index\/open url reject-200
```

### 🔰 自用脚本

配置行：210；来源：https://raw.githubusercontent.com/42vio/QuantumultX/main/QuantumultX_JS.conf

同表达式不同动作：订阅第 18 行 / 去开屏第 799 行

```text
订阅：^https?:\/\/mp\.weixin\.qq\.com\/mp\/getappmsgad url script-response-body https://raw.githubusercontent.com/NobyDa/Script/master/QuantumultX/File/Wechat.js
去开屏：^https?:\/\/mp\.weixin\.qq\.com\/mp\/getappmsgad url response-body advertisement response-body ddgksf2013
```

### 知乎净化助手@ddgksf2013

配置行：217；来源：https://ddgksf2013.top/scripts/zhihu.ads.js

同表达式不同动作：订阅第 22 行 / 去开屏第 1003 行

```text
订阅：^https?:\/\/api\.zhihu\.com\/commercial_api.*launch_v2 url script-response-body https://ddgksf2013.top/scripts/zhihu.ads.js
去开屏：^https?:\/\/api\.zhihu\.com\/commercial_api.*launch_v2 url script-response-body https://raw.githubusercontent.com/ddgksf2013/Scripts/refs/heads/master/zhihu_openads.js
```

### 闲鱼净化[卸载重装]@ddgksf2013

配置行：222；来源：https://github.com/ddgksf2013/Rewrite/raw/master/AdBlock/GoofishAds.conf

相同：订阅第 51 行 / 去开屏第 76 行

```text
^http:\/\/[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+){1,4}(:\d+)?\/amdc\/mobileDispatch url script-response-body https://raw.githubusercontent.com/ddgksf2013/Scripts/refs/heads/master/amdc.js
```

### 百度网盘净化@ddgksf2013

配置行：226；来源：https://ddgksf2013.top/scripts/bdpan.ads.js

相同：订阅第 16 行 / 去开屏第 97 行

```text
^https?:\/\/pan\.baidu\.com\/act\/v\d\/(bchannel|welfare)\/list url reject-200
```

相同：订阅第 20 行 / 去开屏第 99 行

```text
^https?:\/\/pan\.baidu\.com\/act\/api\/activityentry url reject-200
```
