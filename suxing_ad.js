let url = $request.url;
let method = $request.method;
let body = JSON.parse($response.body);

const noticeTitle = "苏e行App脚本错误";
const getMethod = "GET";
const postMethod = "POST";

if (!body.Data) {
    console.log("body:" + $response.body);
    $notification.post(noticeTitle, "苏e行", "Data为空");
} else if (url.indexOf("/bas/ad/v1/advertisement/getAds") !== -1 && method === postMethod) ){
        console.log('苏e行-开屏页');
        body='';
    } else if (url.indexOf("bff/app/index/recommend") !== -1 && method === postMethod) {
        console.log('首页商品推荐');

        let newDataList = fruits.body.result.dataList(0,3);
        body.result.dataList = newDataList;
        
    } else {
        $notification.post(noticeTitle, "App路径/请求方法匹配错误:", method + "," + url);
    }
}
body = JSON.stringify(body);

$done({
    body
});
