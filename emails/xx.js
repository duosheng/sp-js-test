var gData={month_status:[],user_info:{}}
var data = {
    "data": {
        "remark": null,
        "name": "王*",
        "brand": "01",
        "level": "100",
        "status": "00",
        "inNetDate": "20120718183107",
        "netAge": "4年9个月",
        "email": null,
        "address": "内蒙古乌兰察布市兴和县鄂尔栋镇四十号村委会４０号自然村",
        "zipCode": "012000",
        "contactNum": "15754883274",
        "starLevel": "2",
        "starScore": null,
        "starTime": null,
        "realNameInfo": "3",
        "vipInfo": null
    }, "retCode": "000000", "retMsg": "success", "sOperTime": "20170419135635"
}

function formatTime(t){
   return  t.substr(0,4)+"-" +t.substr(4,2)+"-"+t.substr(6,2)+" "+ t.substr(8,2)+":"+ t.substr(10,2)+":"+ t.substr(12)
}

gData.user_info.mobile=PHONE;


var info={
    mobile:PHONE,
    name:data.name,
    registration_time:formatTime(data.inNetDate),
    household_address:data.address,
    contactNum: data.contactNum

};



var detail = {
    "data": [{
        "remark": null,
        "startTime": "2017-03-14 15:12:06",
        "commPlac": "[10]北京",
        "commMode": "[2]被叫",
        "anotherNm": "01062891282",
        "commTime": "00:03:11",
        "commType": "[4]省际漫出",
        "mealFavorable": "[40009204]8元话音资费",
        "commFee": "0.00"
    }, {
        "remark": null,
        "startTime": "2017-03-16 11:59:26",
        "commPlac": "[10]北京",
        "commMode": "[2]被叫",
        "anotherNm": "04712570357",
        "commTime": "00:00:22",
        "commType": "[4]省际漫出",
        "mealFavorable": "[40009204]8元话音资费[40000519]4G自选套餐",
        "commFee": "0.00"
    }, {
        "remark": null,
        "startTime": "2017-03-17 15:27:29",
        "commPlac": "[10]北京",
        "commMode": "[2]被叫",
        "anotherNm": "075595511",
        "commTime": "00:00:52",
        "commType": "[4]省际漫出",
        "mealFavorable": "[40009204]8元话音资费[40000519]4G自选套餐",
        "commFee": "0.00"
    }, {
        "remark": null,
        "startTime": "2017-03-18 12:22:10",
        "commPlac": "[10]北京",
        "commMode": "[2]被叫",
        "anotherNm": "18513056719",
        "commTime": "00:00:18",
        "commType": "[4]省际漫出",
        "mealFavorable": "[40009204]8元话音资费",
        "commFee": "0.00"
    }, {
        "remark": null,
        "startTime": "2017-03-23 17:49:42",
        "commPlac": "[10]北京",
        "commMode": "[2]被叫",
        "anotherNm": "075595511",
        "commTime": "00:02:01",
        "commType": "[4]省际漫出",
        "mealFavorable": "[40009204]8元话音资费[40000519]4G自选套餐",
        "commFee": "0.00"
    }, {
        "remark": null,
        "startTime": "2017-03-29 17:53:39",
        "commPlac": "[10]北京",
        "commMode": "[2]被叫",
        "anotherNm": "075595511",
        "commTime": "00:00:06",
        "commType": "[4]省际漫出",
        "mealFavorable": "[40009204]8元话音资费[40000519]4G自选套餐",
        "commFee": "0.00"
    }],
    "totalNum": 6,
    "startDate": "20170301",
    "endDate": "20170331",
    "curCuror": 1,
    "retCode": "000000",
    "retMsg": "get data from cache success",
    "sOperTime": "20170420142842"
}

//strip []
function strip(s){
    s=s||"";
    return s.substr(s.indexOf("]")+1);
}
// convert time to second
function second(t){
    var sum=0;
    $.each(t.split(":"),function(i,e){sum+=parseInt(e)*Math.pow(60,2-i)})
    return sum;
}

var gData={month_status:[],user_info:{}}
function parseDetail(data) {
    var md = {};
    md.calldate = "";
    md.status = 0;
    md.mobile = PHONE;
    if (data.retCode == "xxx") {
        md.totalCount = 0;
        md.status = 4;
        md.data = null;
    } else {
        md.totalCount = data.totalNum;
        md.data = [];
        $.each(data.data, function (_, e) {
            md.data.push({
                otherNo: e.anotherNm,
                callTime: "65",
                callFee: e.callFee,
                callBeginTime: e.startTime,
                callType: strip(e.commMode),
                callAddress: strip(e.commPlac),
                taocan: e.mealFavorable,
                remoteType: strip(e.commType),
            })
        })
    }
    gData.month_status.push(md);
}

