/**
 * Created by liuyinglong on 2017/8/5.
 */
'use strict'

let AliCloudClient = require("../aliCloudClient");
let Req = require("../request");
let request = new Req();
let schedule = require("node-schedule");
const config = require('./config.json');

let aliClient = new AliCloudClient({
    AccessKeyId: config.accessKeyId,
    AccessKeySecret: config.accessKeySecret,
    serverUrl: "http://alidns.aliyuncs.com"
});

let domainNameValue = "www";
let records, ip;
    //recordIds,       //记录ID


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
        Action: "DescribeDomainRecords",
        DomainName: config.domain,
        TypeKeyWord: "A",
    }).then(function (data) {
        let body = data.body;
        //let record = body.DomainRecords.Record[0];
        //recordIds = body.DomainRecords.Record.map((r) => r.RecordId);
        records = body.DomainRecords.Record;
        return record.Value;
    }).catch(function (err) {
        console.log('err:', err);
        return Promise.reject(err);
    })
}

function upDateRecords(record) {
    return aliClient.get("/", {
        Action: "UpdateDomainRecord",
        RecordId: record.RecordId,
        RR: record.RR,
        Type: "A",
        Value: ip,
    }).then(function (data) {
        console.log(new Date() + ip + " 修改成功");
    }).catch(function (err) {
        console.log(err)
    })
}

function watchIpChange() {
    return getMyIp().then(function (tempIp) {
        console.log('tempIp:', tempIp);
        if (ip === tempIp) {
            return;
        }
        if (!ip) {
            return;
        }
        console.log(new Date()+ '  ' + ip + "  =>  "+ tempIp);
        ip = tempIp;
        for (var i = 0; i < records.length; i++) {
            upDateRecords(records[i]);
        }
    }).catch(function(err){
        console.log(err);
    })
}


Promise.all([getMyIp(), getDomainRecords()]).then(function (result) {
    ip = result[0];
    console.log('tempIp:', ip);
    let domainValue = result[1];
    if (ip !== domainValue) {
        upDateRecords();
    } else {
        console.log('No need to change now');
    }
});

schedule.scheduleJob("0 * * * * *", function () {
    watchIpChange();
});

