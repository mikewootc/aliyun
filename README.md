# Fork版说明

Forked from: https://github.com/liuyinglong/aliyun . And changed DDNS example.

Fork后的变更: DNS例程, 在此改为一个稍微正式点的工具来用, 具体修改如下:
1. 原本的例子是获取SubDomain, 此处改为DomainName.
2. 原本对于记录列表只取index 0, 此处改为遍历修改所有A记录(改为同一个IP, 即本机公网IP).
3. 原本的RR默认取www, 此处改为保持原RR字段值不变.
4. 原本在DNS例程中修改配置信息, 此处改为在config.json中设置.

本DDNS工具使用:

## 安装

    git clone https://github.com/mikewootc/aliyun.git
    yarn install 

## 配置

    修改DNS/config.json文件

## 运行

    cd DNS
    node ./index.js


以下为Fork前的原版README:


# 阿里云 API 签名

> github:[https://github.com/liuyinglong/aliyun](https://github.com/liuyinglong/aliyun);  
> npm :[https://www.npmjs.com/package/aliyun-apisign](https://www.npmjs.com/package/aliyun-apisign)

## 阿里云已开放的API
[https://develop.aliyun.com/tools/openapilist](https://develop.aliyun.com/tools/openapilist)

## install
``
npm install aliyun-apisign --save
``

## use
```js
let AliCloudClient = require("../aliCloudClient");

let aliClient=new AliCloudClient({
    AccessKeyId:"your AccessKeyId",
    AccessKeySecret:"your AccessKeySecret",
    serverUrl:"http://alidns.aliyuncs.com"
});

//获取解析列表
aliClient.get("/",{
    Action:"DescribeDomainRecords",
    DomainName:"yourDomain.cn"
}).then(function(data){
    console.log(data.body)
}).catch(function(err){
    console.log(err);
});
```


## 小案例-》利用阿里云开放api进行动态域名解析

> 每分钟获取一次公网 IP，如果检测到公网IP发生了变化，则调用aliyun的开放接口进行更新

```js
let AliCloudClient = require("../aliCloudClient");
let Req = require("../request");
let request = new Req();
let schedule = require("node-schedule");

let aliClient = new AliCloudClient({
    AccessKeyId: "your AccessKeyId",
    AccessKeySecret: "your AccessKeySecret",
    serverUrl: "http://alidns.aliyuncs.com"
});

let domainNameValue = "www";
let recordId,       //记录ID
    ip;


function getMyIp() {
    return request.post("http://ip.taobao.com/service/getIpInfo2.php", {
        ip: "myip"
    }).then(function (data) {
        return data.body.data.ip;
    }).catch(function (err) {
        return Promise.reject(err);
    })
}

function getDomainRecords() {
    return aliClient.get("/", {
        Action: "DescribeSubDomainRecords",
        SubDomain: "www.yourDomain.cn"
    }).then(function (data) {
        let body = data.body;
        let record = body.DomainRecords.Record[0];
        recordId = record.RecordId;
        return record.Value;
    }).catch(function (err) {
        return Promise.reject(err);
    })
}

function upDateRecords() {
    return aliClient.get("/", {
        Action: "UpdateDomainRecord",
        RecordId: recordId,
        RR: domainNameValue,
        Type: "A",
        Value: ip
    }).then(function (data) {
        console.log(new Date() + ip + " 修改成功");
    }).catch(function (err) {
        console.log(err)
    })
}

function watchIpChange() {
    return getMyIp().then(function (tempIp) {
        if (ip === tempIp) {
            return;
        }
        if (!ip) {
            return;
        }
        console.log(new Date()+ ip + "=>"+ tempIp);
        ip = tempIp;
        upDateRecords();
    }).catch(function(err){
        console.log(err);
    })
}


Promise.all([getMyIp(), getDomainRecords()]).then(function (result) {
    ip = result[0];
    let domainValue = result[1];
    if (ip !== domainValue) {
        upDateRecords();
    }
});

schedule.scheduleJob("0 * * * * *", function () {
    watchIpChange();
});

```
