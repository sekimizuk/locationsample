var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var location = require('./function');

//mysql
var mysql = require('mysql');
var connection = mysql.createConnection({
        host: 'localhost',
        database: 'LOCATION',
        user: 'root',
        password: ''
});

//redis
var redis  = require('redis');
var redisClient = redis.createClient();

function getRulePoint (item_id,sub){
 var selectSql = "select X(local_center) AS lat ,Y(local_center) AS lng, local_distance from push_item where push_item_id = ?;";
 var getQuery = connection.query(selectSql,[item_id]);

  getQuery
   .on('error', function(err){
    console("DBERROR:",err);
   })

   .on('result',function(rows){
   console.log("---DB SELECT RULE ITEM:[", item_id, "]---");
   console.log("RULE_LAT:",rows.lat);
   console.log("RULE_LNG:",rows.lng);
   console.log("-------------------------------");
   var redisData = [];
   var redisLat = [];
   var redisLng = [];
   redisClient.sort(sub,"ALPHA","DESC","LIMIT", "0", "2", function (err, replies) {
   if (replies){
    console.log("---REDIS SELECT USER IS:[", sub, "]---");
    replies.forEach(function (reply,i){
     console.log(" REPLY[",i,"]",reply);
     redisData.push((reply).slice(26));
     redisLat.push(JSON.parse((reply).slice(26)).lat);
     redisLng.push(JSON.parse((reply).slice(26)).lng);
    });
    console.log("-------------------------------");
    var before = {
     lat: redisLat[1],
     lng: redisLng[1]
    };

    var after = {
     lat: redisLat[0],
     lng: redisLng[0]
    };

    var userLocation = {
     before: before,
     after: after
    };
    console.log("---CHECK USER LOCATION---");
    console.log("USER_BEFORE_GEO:",before);
    console.log("USER_AFTER _GEO:",after);

    console.log("USER_LAT:",after.lat);
    console.log("USER_LNG:",after.lng);
    console.log("-------------------------------");
    if(location.locationCheck(userLocation) == "Change") {
     var distance = getDistance(rows,after)
     console.log("DISTANCE:",distance);
     if (distance < rows.local_distance) {
      // 先ほど宣言したトランスポートオブジェクトでメールを送信
      smtpTransport.sendMail(mailOptions, function (error, response) {
       if (error) {
        console.log(error);
       }else {
         console.log("Message sent: " + response.message);
       }
      });
     }else{
      console.log("USER IS OUT OF RULE AREA");
     }
    }else{
     console.log("USER LOCATION IS NOT CHANGE");
    }
   }else if(replies = null){
    console.log("REDIS:0");
   }else if (err) {
    console.log("REDIS_ERR:",err);
   }
  });
 });
};

//node_mailer
var nodemailer = require("nodemailer");
var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "nttdmobilebu2014@gmail.com",
        pass: "sekimizukazunori"
    }
});

var mailOptions = {
    from: "Location Sample Test Accoount <mobilebu2014@gmail.com>", // sender address
    to: "tanakahdy@nttdata.co.jp",// list of receivers
    subject: "Location Sample Test Message", // Subject line
    text: "どうですかーーー！！！", // plaintext body
    html: "<h2>赤坂チェック（埋め込み）</h2><p>登録地点: AKASAKA K-TOWER (35.677709,139.734901)（埋め込み）</p><p>距離指定: 100m（以内（埋め込み））</p><p></p><p>上記ロケーションにKazunori Sekimizu（埋め込み）が立ち入りました</p>"
}

var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1, p2) {
  var R = 6371000; // Earth’s mean radius in meter
  var dLat = rad(p2.lat - p1.lat);
  var dLong = rad(p2.lng - p1.lng);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};


exports.getRulePoint = getRulePoint;