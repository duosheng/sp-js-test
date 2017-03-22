
//通话时长转换为妙
function parseToSecond(data) {
    var totalSecond = 0;

    var regHour = /(\d{1,2})时/;
    var regMin = /(\d{1,2})分/;
    var regSec = /(\d{1,2})秒/;

    var r = regHour.exec(data);
    if (r && r.length==2) {
        totalSecond += parseInt(r[1]) * 60 * 60;
    };
    r = regMin.exec(data);
    if (r && r.length==2) {
        totalSecond += parseInt(r[1]) * 60;
    };
        r = regSec.exec(data);
    if (r && r.length==2) {
        totalSecond += parseInt(r[1]);
    };
    return totalSecond;
}

dSpider("unicom", 60*5, function(session,env,$){
    log("************" + window.location.href);
    function parseThxd(msg) {
        $(msg).find("tr.tips_dial").each(function() {
            var monthData = session.get("curMonthData");

            var data = {}
            data["otherNo"] = $(this).find("label.telphone").text();
            var callTime = $(this).find("td:eq(1) p").first().text();
            data["callFee"] = $(this).find("p.time:eq(0)").text().replace(/[\n|\s]/g, "").replace();
            var beginTime = $(this).find("p.time:eq(1)").text().replace(/[\n|\s]/g, "").replace();
            data["callType"] = ($(this).find(".call_out").length == 1) ? "主叫" : "被叫";
            data["mobile"] = session.get("thxd").user_info["mobile"];

            if(callTime) {
                data["callTime"] = parseToSecond(callTime);
            }
            if(beginTime){
                data["callBeginTime"] = monthData.calldate.substring(0,4) + "-" +beginTime.replace("月", "-").replace("日", " ");
            }

            var datas = monthData["data"];
            if(!datas) {
                datas = [];
            }
            datas.push(data);
            monthData["data"] = datas;
            session.set("curMonthData", monthData);
            log("获取一条数据：" + JSON.stringify(data));
        })
    }

    function getThxdByAjax(year, month) {
        log("开始爬取【" + month + "】月份通话详单：");
        //session.upload("开始爬取【" + month + "】月份通话详单：")
        var curMonthData = {};
        curMonthData["calldate"] = year + "" + month;
        curMonthData["cid"] = parseInt(new Date().getTime()/1000).toString();
        session.set("curMonthData", curMonthData);
        $.ajax({
            url: '/mobileService/query/getPhoneByDetailContent.htm',
            type: 'post',
            data: 't=' + new Date().getTime() + '&YYYY=' + year + '&MM=' + month + '&DD=&queryMonthAndDay=month&menuId=',
            //dataType: 'html',
            //async: true,
            //cache: false,
            success: function(msg) {
                log("请求" + month + "月份数据成功....");
                parseThxd(msg);
                $('#pageNew').html(msg);
                //保存数据
                var data = session.get("curMonthData");
                data["totalCount"] = window.totalrow;
                data["status"] = 4;
                session.set("curMonthData", data);

                //是否需要加载更多
                if (window.endrow < window.totalrow) {
                    loadMore();
                } else {
                    var thxd = session.get("thxd");
                    if(!thxd["month_status"]) {
                        thxd["month_status"] = [];
                    }
                    thxd["month_status"].push(data);
                    session.set("thxd", thxd);
                    session.set("curMonthData", "");
                    log("爬取数据完成..." + JSON.stringify(data));
                    spide();
                }
            },
            error: function(xhr, msg){
                //保存数据
                var data = session.get("curMonthData");
                data["totalCount"] = 0;
                data["status"] = 2;
                data["data"] = [];
                var thxd = session.get("thxd");
                if(!thxd["month_status"]) {
                    thxd["month_status"] = [];
                }
                thxd["month_status"].push(data);
                session.set("thxd", thxd);
                session.set("curMonthData", "");

                log("爬取【" + month + "】月份通话详单失败！");
                spide();
            }
        });
    }

    function loadMore() {
        log("加载更多...")
        var _this = $(this);
        var beginrow = window.endrow;
        window.endrow = window.beginrow + window.perrow;
        if (window.endrow > window.totalrow) {
            window.endrow = window.totalrow;
        }
        _this.html('<img src="http://img.client.10010.com/mobileService/view/client/images/loading.gif" width="16">');
        var href = '/mobileService/view/client/query/xdcx/thxd_more_list.jsp?1=1&t=' + window.getrandom();
        var params = '&beginrow=' + beginrow + '&endrow=' + window.endrow + '&pagenum=' + (window.pagenum + 1);
        $('.moredetail' + window.pagenum).load(href + params, function(msg) {
            parseThxd(msg);
            var thxd = session.get("thxd");
            if(!thxd["month_status"]) {
                thxd["month_status"] = [];
            }
            thxd["month_status"].push(session.get("curMonthData"));
            session.set("thxd", thxd);
            session.set("curMonthData", "");
            //继续爬取
            spide();
        });
    }

    function preSpide() {
        //计算月份信息
        var curMonth, curYear;
        var date = new Date();
        curMonth = date.getMonth() + 1;
        curYear = date.getFullYear();
        var monthArr = []
        var max = 0;
        if (curMonth && curYear) {
            for (var i = 0; i < 6; i++) {
                var month = curMonth - i;
                var year = curYear;
                if (month < 1) {
                    month += 12;
                    year -= 1;
                }
                if (month < 10) {
                    month = "0" + month;
                }
                monthArr.push({ "year": year, "month": month });
            }
            max = monthArr.length + 1;
            log("获取时间成功..." + JSON.stringify(monthArr));
        } else {
            log("没有通话时间，可能刚开卡..");
        }
        //设置月份信息
        session.set("months", monthArr);
        session.set("max", max);
        session.setProgressMax(max);
        var thxd = session.get("thxd");
        if (!thxd) {
            session.set("thxd", {});
        };
    }

    function spide() {
        var monthArr = session.get("months");
        if (monthArr && monthArr.length > 0) {
            session.setProgress(session.get("max") - monthArr.length);
            var monthObj = monthArr.shift();
            session.set("months", monthArr);
            getThxdByAjax(monthObj.year, monthObj.month);
        } else {
            var thxd = session.get("thxd");
            endSpide(thxd);
        }
    }

    function endSpide(thxd) {
        log("爬取完毕----------" + JSON.stringify(thxd));
        session.upload(JSON.stringify(thxd));
        session.setProgress(session.get("max") - 0);
        session.finish();
        session.showProgress(false);
    }

    if(window.location.href.indexOf("/uac.10010.com/oauth2/new_auth") != -1) {
        var footer = $("div.footer:eq(0)");
        if (footer) {
            footer.css("visibility", "hidden");
        }
        var header = $("div.header");
        if(header) {
            header.css("display", "none");
        }
        var passFind = $("div.interval2:eq(0)");
        if(passFind) {
            passFind.css("visibility", "hidden");
        }
        //隐藏随机登录
        $(".random-box").css("display", "none");

        var loginBtn = $("a#login1:eq(0)");
        if(loginBtn) {
            loginBtn.click(function(){
                var unameInput = $("input#userName:eq(0)");
                if(unameInput) {
                    var userName = unameInput.val();
                    session.setLocal("userName", userName);
                }
                var passInput = $("input#userPwd:eq(0)");
                if(passInput) {
                    var pass = passInput.val();
                    session.setLocal("password", pass);
                }
            });
        }

        // 填充默认手机号
        var prePhone = null;
        prePhone = session.getArguments().phoneNo;
        log('默认手机号：' + prePhone);
        if (!prePhone) {
            prePhone = session.getLocal("userName");
        }
        $("input#userName:eq(0)").val(prePhone);
        $("input#userPwd:eq(0)").val(session.getLocal("password"));

        //禁用输入框
        if($("input#userName:eq(0)").val()) {
            $("input#userName:eq(0)").attr("disabled", "disabled");
        }
        var emObj = $("input#userName:eq(0)").next();
        if(emObj.is("em") && emObj.attr("class") == "sl-delect") {
            emObj.css("display", "none");
        }

        session.setStartUrl();
        session.showProgress(false);
     } else if(window.location.href.indexOf('mobileService/siteMap.htm') != -1){//服务界面，获取个人信息跳转
         var infoTag = "";
         $(".checklistcontainer.newmore").find("li").each(function(){
             if($(this).html().indexOf("基本信息") != -1) {
                 infoTag = $(this);
                 return;
             }
         });
         if(!infoTag) {
             $(".t1.div_nav").find("li").each(function(){
                 if($(this).html().indexOf("基本信息") != -1) {
                     infoTag = $(this);
                     return;
                 }
             });
         }
         if(!infoTag) {
             $("li").each(function(){
                 if($(this).html().indexOf("基本信息") != -1) {
                     infoTag = $(this);
                     return;
                 }
             });
         }
         if(infoTag) {
             //跳转到我的基本信息页面
             window.location.href = infoTag.attr("name");
         } else {
             log("用户信息获取失败.....");
             var thxd = session.get("thxd");
             thxd["user_info"] = {"mobile":session.getLocal("userName")};
             endSpide(thxd);
         }
    } else if(window.location.href.indexOf("operationservice/getUserinfo.htm") !=-1 ) {//获取个人信息
        //显示loading
        session.showProgress();
        log("开始爬取用户信息----------");
        var userInfo = {};
        try {
            userInfo["mobile"] = $(".clientInfo4_top").find("p:eq(0)").html().replace(/[\n|\s]/g, "").replace();
        } catch (e) {
        }
        if(!userInfo["mobile"]) {
            userInfo["mobile"] = session.getLocal("userName");
        }
        try{
            userInfo["name"] = $(".clientInfo4_list").find("li:eq(0)").find("span:eq(1)").html().replace(/[\n|\s]/g, "").replace();
        } catch (e) {
        }
        if(!userInfo["name"]) {
            userInfo["name"] = $(".tabCon_list.tab_bottom:eq(1)").find("div.font_16").html().replace(/[\n|\s]/g, "").replace("的个人信息", "");
        }
        try{
            userInfo["taocan"] = $(".clientInfo4_list").find("li:eq(1)").find("span:eq(1)").html().replace(/[\n|\s]/g, "").replace();
        } catch (e) {
        }
        if(!userInfo["taocan"]) {
            try{
                userInfo["taocan"] = $(".detail_con.con_ft:eq(0)").find("span:eq(1)").html().replace(/[\n|\s]/g, "").replace();
            } catch (e) {
            }
        }

        try{
            userInfo["registration_time"] = $(".detail_con.con_ft:eq(0)").find("p:eq(6)").find("span:eq(1)").text().replace(/[\n|\s]/g, "").replace();
        } catch (e) {
        }
        try{
            userInfo["idcard_no"] = $(".detail_con.con_ft:eq(1)").find("p:eq(4)").find("span:eq(1)").text().replace(/[\n|\s]/g, "").replace();
        } catch (e) {
        }
        try{
            userInfo["household_address"] = $(".detail_con.con_ft:eq(1)").find("p:eq(18)").find("span:eq(1)").text().replace(/[\n|\s]/g, "").replace();
        } catch (e) {
        }
        log("爬取用户信息结束-----" + JSON.stringify(userInfo));
        session.setProgress(1);
        preSpide();
        var thxd = session.get("thxd");
        thxd["user_info"] = userInfo;
        spide()
    } else {
        //如果以上都不能跳转，则跳转到服务页面，以防页面无响应
        window.location.href = "http://wap.10010.com/mobileService/siteMap.htm";
    }
})