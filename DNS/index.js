/**
 * Created by liuyinglong on 2017/8/5.
 */
'use strict'
let yargs = require('yargs');

let AliCloudClient = require("../aliCloudClient");
let Req = require("../request");
let request = new Req();
let schedule = require("node-schedule");
const axios = require('axios');

let argv = yargs
    .option('c', { alias : 'config', demand: false, default: './config.json', describe: 'specify config file', type: 'string' })
    .argv;

let configFile = argv.c;
console.log('configFile:', configFile);
const config = require(configFile);

let aliClient = new AliCloudClient({
    AccessKeyId: config.accessKeyId,
    AccessKeySecret: config.accessKeySecret,
    serverUrl: "http://alidns.aliyuncs.com"
});

let ipBak;
    //recordIds,       //记录ID

function logTrace() {
    //console.log('');
}


function getMyIp() {
    //return Promise.resolve('1.2.3.4'); // for test
    return request.post("http://ip.taobao.com/service/getIpInfo2.php", {
        ip: "myip"
    }).then(function (data) {
        return data.body.data.ip;
    }).catch(function (err) {
        return Promise.reject(err);
    })
}

async function getMyIp2() {
    let ret = await axios.get('http://ipecho.net/plain');
    return ret.data;
}

// e.g. 
// { RR: 'www',
//   Status: 'ENABLE',
//   Value: '1.2.3.4',
//   Weight: 1,
//   RecordId: '5385283919868096',
//   Type: 'A',
//   DomainName: 'example.com',
//   Locked: false,
//   Line: 'default',
//   TTL: 600 }
function getDomainRecords() {
    return aliClient.get("/", {
        Action: "DescribeDomainRecords",
        DomainName: config.domain,
        TypeKeyWord: "A",
    }).then(function (data) {
        let body = data.body;
        //let record = body.DomainRecords.Record[0];
        let records = body.DomainRecords.Record;
        return records;
    }).catch(function (err) {
        console.log('err:', err);
        return Promise.reject(err);
    })
}

function upDateRecord(record, ip) {
    return aliClient.get("/", {
        Action: "UpdateDomainRecord",
        RecordId: record.RecordId,
        RR: record.RR,
        Type: "A",
        Value: ip,
    });
}

async function watchIpChange() {
    logTrace('getMyIp2');
    try {
        let myIp = await getMyIp2();
        logTrace('myIp:', myIp, 'ipBak:', ipBak);

        if (!myIp) {
            return;
        }
        if (ipBak == myIp) {
            return;
        }
        ipBak = myIp;

        // Should change IP records
        console.log('newIp:', ipBak, "-->", myIp, new Date());
        let records = await getDomainRecords();
        for (var i = 0; i < records.length; i++) {
            let record = records[i];
            logTrace('record:', record);
            if (record.Value != myIp) {
                console.log(`Update for RR: ${record.RR}, record IP: ${record.Value}, should change to ${myIp}`);
                await upDateRecord(record, myIp);
                console.log('   ', new Date() + `${record.RR}.${config.domain} change to ip: ${myIp}`);
            }
        }
    } catch(err) {
        console.log(err);
    }
    
    
}

watchIpChange();
setInterval(() => {
    watchIpChange();
}, 60 * 1000);


//Promise.all([getMyIp(), getDomainRecords()]).then(function (result) {
//    ip = result[0];
//    console.log('tempIp:', ip);
//    let domainValue = result[1];
//    if (ip !== domainValue) {
//        for (var i = 0; i < records.length; i++) {
//            upDateRecord(records[i]);
//        }
//    } else {
//        console.log('No need to change now');
//    }
//});
//
//schedule.scheduleJob("0 * * * * *", function () {
//    watchIpChange();
//});

