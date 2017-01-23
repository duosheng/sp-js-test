(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

log("****************Debug model *******************");
dSpider("telecom_gd", function (session, env, $) {
    log("current page: " + location.href);

    if (location.href.indexOf("gd.189.cn/TS/login.htm") != -1) {
        session.setStartUrl();
        //        session.showProgress(false);
        return;
    } else if (location.href.indexOf("SSOLoginForCommNoPage") != -1) {
        console.log("SSOLoginForCommNoPage");
        return;
    } else if (location.href.indexOf("http://gd.189.cn/TS/index.htm") != -1 || location.href.indexOf("gd.189.cn/TS/?SESSIONID=") != -1) {

        session.showProgress();
        session.setProgressMax(100);
        session.autoLoadImg(false);
        session.setProgress(0);
        var thxd = session.get("thxd");
        if (!thxd) {
            thxd = {};
        }
        var userInfo = thxd["user_info"];
        if (!userInfo) {
            userInfo = {};
        }
        if (!userInfo["name"]) {
            var timeout = 10000;
            var t = setInterval(function () {
                timeout -= 10;
                var ob = $("#user_name");
                if (ob[0] && ob.text() != "--") {
                    session.setProgress(10);
                    clearInterval(t);
                    userInfo["name"] = ob.text();
                    console.log(JSON.stringify(userInfo));
                    thxd["user_info"] = userInfo;
                    session.set("thxd", thxd);
                    location.href = "http://gd.189.cn/transaction/taocanapply1.jsp?operCode=ChangeCustInfoNew";
                } else if (timeout == 0) {
                    session.setProgress(10);
                    clearInterval(t);
                    location.href = "http://gd.189.cn/transaction/taocanapply1.jsp?operCode=ChangeCustInfoNew";
                }
            }, 10);
        } else {
            session.setProgress(10);
            location.href = "http://gd.189.cn/transaction/taocanapply1.jsp?operCode=ChangeCustInfoNew";
        }
    } else if (location.href.indexOf("gd.189.cn/OperationInitAction2.do?OperCode=ChangeCustInfoNew") != -1) {

        waitDomAvailable("#cust_name_id", function (dom, timeSpan) {
            session.setProgress(20);
            log("wait cust_name_id success");
            var thxd = session.get("thxd");
            if (!thxd) {
                thxd = {};
            }
            var userInfo = thxd["user_info"];
            if (!userInfo) {
                userInfo = {};
            }
            if (!userInfo["name"]) {
                userInfo["name"] = $("#cust_name_id").val();
            }

            userInfo["idcard_no"] = $("#id_num_id").val();
            userInfo["contactNum"] = $("#moblie_id").val();
            var address = $("#post_addr_id").val();
            if (address.length == 0) {
                address = $("#id_addr_id").val();
            }
            userInfo["household_address"] = address;

            thxd["user_info"] = userInfo;
            session.set("thxd", thxd);

            location.href = "http://gd.189.cn/TS/cx/puk_chaxun.htm?cssid=wdwt-xgcx-puk_pincx";
            console.log(JSON.stringify(userInfo));
        }, function () {
            session.setProgress(20);
            log("wait cust_name_id fail");
            location.href = "http://gd.189.cn/TS/cx/puk_chaxun.htm?cssid=wdwt-xgcx-puk_pincx";
        });
    } else if (location.href.indexOf("gd.189.cn/TS/cx/puk_chaxun.htm?cssid=wdwt-xgcx-puk_pincx") != -1) {

        waitDomAvailable("#phone", function (dom, timeSpan) {
            session.setProgress(30);
            log("wait custName success");
            var thxd = session.get("thxd");
            if (!thxd) {
                thxd = {};
            }
            var userInfo = thxd["user_info"];
            if (!userInfo) {
                userInfo = {};
            }

            userInfo["mobile"] = $("#phone").text();

            thxd["user_info"] = userInfo;
            session.set("thxd", thxd);
            console.log(JSON.stringify(userInfo));
            //                location.href="http://gd.189.cn/TS/wode-wangting-sec.htm?cssid=sy-dh-top-wdwt";
            location.href = "http://gd.189.cn/TS/cx/xiangdan_chaxun.htm?cssid=sy-kscx-xdcx";
        }, function () {
            session.setProgress(30);
            log("wait phone fail");
            location.href = "http://gd.189.cn/TS/cx/xiangdan_chaxun.htm?cssid=sy-kscx-xdcx";
        });
    } else if (location.href.indexOf("gd.189.cn/TS/cx/xiangdan_chaxun.htm?cssid=sy-kscx-xdcx") != -1) {
        waitDomAvailable(".get_sms_code", function (dom, timeSpan) {
            session.setProgress(40);
            getLoginUserType(function () {
                // showMask(true);
            });
        }, function () {
            log("wait get_sms_code fail");
            setXd([]);
        });
    }

    var months = [];
    var curMonthIndex = 0;
    var phoneIndex = -1;
    var dateIndex = -1;
    var durationIndex = -1;
    var feeIndex = -1;
    var callTypeIndex = -1;
    var locationIndex = -1;
    var commuTypeIndex = -1;

    var details = [];
    var datas = [];
    var param = {};

    var loginUser = {};

    function loadXd() {

        $.each($(".rq_list").find("li"), function () {
            var month = {};
            month["month"] = $(this).attr("data-month");
            month["start"] = $(this).attr("data-start");
            month["end"] = $(this).attr("data-end");
            months.push(month);
        });
        console.log(JSON.stringify(months));
        curMonthIndex = 0;

        param = { "d.d01": "", "d.d02": "", "d.d03": "", "d.d04": "", "d.d05": "20", "d.d06": "1", "d.d07": "", "d.d08": "1" };
        param["d.d06"] = 1;
        param["d.d01"] = "call";
        // param["d.d02"]=$(".rq_list_on").attr("data-month");
        // param["d.d03"]=$(".rq_list_on").attr("data-start");
        // param["d.d04"]=$(".rq_list_on").attr("data-end");
        param["d.d02"] = months[curMonthIndex].month;
        param["d.d03"] = months[curMonthIndex].start;
        param["d.d04"] = months[curMonthIndex].end;
        var SearchVerifyCode = $("#input_code").val().trim();
        param["d.d07"] = SearchVerifyCode;

        loadXdByMonth();
    }

    function loadXdByMonth() {
        $.ajax({
            url: "/J/J10009.j?a.c=0&a.u=user&a.p=pass&a.s=ECSS",
            type: 'get',
            dataType: "json",
            data: param,
            beforeSend: function beforeSend() {
                console.log("beforeSend");
                console.log(param);
            },
            success: function success(result) {
                console.log(param);
                console.log(result);
                if (result && result.b && result.b.c === "00") {
                    //查询成功
                    switch (result.r.code) {
                        case "000":
                        case "009":
                            result = result.r || result;
                            var current_page = result.r06;
                            var total_page = result.r05;
                            current_page == 1 && $.each(result.r02, function (i) {
                                if (this.indexOf("通话类型") != -1) {
                                    commuTypeIndex = i;
                                } else if (this.indexOf("号码") != -1) {
                                    phoneIndex = i;
                                } else if (this.indexOf("日期") != -1) {
                                    dateIndex = i;
                                } else if (this.indexOf("时长") != -1) {
                                    durationIndex = i;
                                } else if (this.indexOf("费用") != -1) {
                                    feeIndex = i;
                                } else if (this.indexOf("呼叫类型") != -1) {
                                    callTypeIndex = i;
                                } else if (this.indexOf("通话地") != -1) {
                                    locationIndex = i;
                                }
                            });
                            $.each(result.r03, function () {
                                var data = {};
                                $.each(this, function (i) {
                                    var s = this + "";
                                    if (i == commuTypeIndex) {
                                        data["remoteType"] = s;
                                    } else if (i == phoneIndex) {
                                        data["otherNo"] = s;
                                    } else if (i == dateIndex) {
                                        data["callBeginTime"] = s;
                                    } else if (i == durationIndex) {
                                        data["callTime"] = s;
                                    } else if (i == feeIndex) {
                                        data["callFee"] = s;
                                    } else if (i == callTypeIndex) {
                                        data["callType"] = s;
                                    } else if (i == locationIndex) {
                                        data["callAddress"] = s;
                                    }
                                });
                                datas.push(data);
                            });

                            if (total_page > current_page) {
                                param["d.d06"] = parseInt(param["d.d06"]) + 1;
                                session.setProgress(45 + 55 / months.length * (curMonthIndex + current_page / total_page));
                                loadXdByMonth();
                            } else {
                                console.log("load success:" + months[curMonthIndex].month);
                                var detail = {};
                                detail["calldate"] = months[curMonthIndex].month;
                                detail["cid"] = parseInt(new Date().getTime() / 1000).toString();
                                detail["data"] = datas;
                                detail["status"] = 4;
                                details.push(detail);
                                // console.log(JSON.stringify(datas)||'<tr><td class="empty">'+(result.msg||"暂无数据")+'</td></tr>');
                                datas = [];
                                if (curMonthIndex < months.length - 1) {
                                    session.setProgress(45 + 55 * (curMonthIndex + 1) / months.length);
                                    curMonthIndex++;
                                    param["d.d02"] = months[curMonthIndex].month;
                                    param["d.d03"] = months[curMonthIndex].start;
                                    param["d.d04"] = months[curMonthIndex].end;
                                    param["d.d06"] = 1;
                                    console.log("curMonthIndex:" + curMonthIndex + "|" + months[curMonthIndex].month);
                                    loadXdByMonth();
                                } else {
                                    console.log("details");
                                    console.log(JSON.stringify(details));
                                    setXd(details);
                                }
                            }
                            break;
                        case "001":
                            //未登录
                            sessionStorage.setItem("gd_TS_login_url", location.pathname);
                            setTimeout(function () {
                                location.href = "https://gd.189.cn/TS/login.htm?redir=" + encodeURIComponent(location.pathname + location.search);
                            }, 1500);
                        default:
                            //其它
                            console.log(result.r.msg);
                            if (result.r.msg.indexOf("验证码") != -1) {
                                alert(result.r.msg);
                                showMask(true);
                            } else {
                                //                                alert(result.r.msg);
                                //                                location.href="https://gd.189.cn/TS/login.htm?redir="+encodeURIComponent(location.pathname+location.search);
                                setXd([]);
                            }
                    }
                } else {
                    alert("清单查询初始化，请重试！");
                    console.log("load fail:" + months[curMonthIndex].month);
                    var detail = {};
                    detail["calldate"] = months[curMonthIndex].month;
                    detail["cid"] = parseInt(new Date().getTime() / 1000).toString();
                    detail["data"] = datas;
                    if (datas.length > 0) {
                        detail["status"] = 5;
                    } else {
                        detail["status"] = 2;
                    }
                    details.push(detail);
                    // console.log(JSON.stringify(datas)||'<tr><td class="empty">'+(result.msg||"暂无数据")+'</td></tr>');
                    datas = [];
                    if (curMonthIndex < months.length - 1) {
                        session.setProgress(45 + 55 * (curMonthIndex + 1) / months.length);
                        curMonthIndex++;
                        param["d.d02"] = months[curMonthIndex].month;
                        param["d.d03"] = months[curMonthIndex].start;
                        param["d.d04"] = months[curMonthIndex].end;
                        param["d.d06"] = 1;
                        console.log("curMonthIndex:" + curMonthIndex + "|" + months[curMonthIndex].month);
                        loadXdByMonth();
                    } else {
                        console.log("details");
                        console.log(JSON.stringify(details));
                        setXd(details);
                    }
                }
            },
            error: function error(err, textStatus) {
                console.log("ajax请求失败!readyState:" + err.readyState + ",textStatus:" + textStatus);
                alert("清单查询初始化，请重试！");

                console.log("load error:" + months[curMonthIndex].month);
                var detail = {};
                detail["calldate"] = months[curMonthIndex].month;
                detail["cid"] = parseInt(new Date().getTime() / 1000).toString();
                detail["data"] = datas;
                if (datas.length > 0) {
                    detail["status"] = 5;
                } else {
                    detail["status"] = 2;
                }
                details.push(detail);
                // console.log(JSON.stringify(datas)||'<tr><td class="empty">'+(result.msg||"暂无数据")+'</td></tr>');
                datas = [];
                if (curMonthIndex < months.length - 1) {
                    session.setProgress(45 + 55 * (curMonthIndex + 1) / months.length);
                    curMonthIndex++;
                    param["d.d02"] = months[curMonthIndex].month;
                    param["d.d03"] = months[curMonthIndex].start;
                    param["d.d04"] = months[curMonthIndex].end;
                    param["d.d06"] = 1;
                    console.log("curMonthIndex:" + curMonthIndex + "|" + months[curMonthIndex].month);
                    loadXdByMonth();
                } else {
                    console.log("details");
                    console.log(JSON.stringify(details));
                    setXd(details);
                }
            },
            complete: function complete() {
                console.log("complete");
            }
        });
    }

    function setXd(xd) {
        var thxd = session.get("thxd");
        if (!thxd) {
            thxd = {};
        }
        thxd["month_status"] = xd;
        session.set("thxd", thxd);

        session.setProgress(100);

        log("爬取完毕----------" + JSON.stringify(thxd));
        session.upload(JSON.stringify(thxd));
        session.finish();
    }

    function getLoginUserType(callback) {
        $.ajax({
            url: "/J/J10036.j?a.c=0&a.u=user&a.p=pass&a.s=ECSS",
            type: 'get',
            dataType: "json",
            data: {},
            beforeSend: function beforeSend() {},
            success: function success(result) {
                if (result && result.b && result.b.c === "00") {
                    //查询成功
                    switch (result.r.code) {
                        case "000":
                            var r = result.r,
                                _numStr;
                            loginUser.account = r.r03 || r.r02; //当前号码
                            loginUser.currNumBusiType = r.r05 || r.r04; //当前号码业务类型
                            loginUser.payType = r.r07; //付费类型
                            loginUser.latnId = r.r14; //区号
                            session.setProgress(45);
                            // callback();
                            console.log(JSON.stringify(loginUser));
                            // getSmsCode(loginUser.latnId,loginUser.account);
                            //                            showMask(true);
                            xdInit();
                            break;
                        case "001": //未登录
                        default:
                            //其它
                            setXd([]);
                            showErr(result.r.msg);
                    }
                } else {
                    setXd([]);
                    console.log("详单查询初始化失败，请重试！");
                }
            },
            error: function error(err, textStatus) {
                setXd([]);
                console.log("ajax请求失败!readyState:" + err.readyState + ",textStatus:" + textStatus);
            },
            complete: function complete() {}
        });
    }

    /**
     * 获得短信验证码
     * @param lantId
     * @param phone
     */
    function getSmsCode() {
        console.log("getSmsCode:" + loginUser.latnId + "|" + loginUser.account);
        $.ajax({
            url: "/J/J20009.j?a.c=0&a.u=user&a.p=pass&a.s=ECSS",
            type: 'post',
            dataType: "json",
            data: { "d.d01": loginUser.latnId, "d.d02": loginUser.account, "d.d03": "CDMA" },
            success: function success(result) {
                if (result && result.b && result.b.c === "00") {
                    //查询成功
                    var r = result.r;
                    if (r.code === "000") {
                        settime();
                        console.log("短信验证码已经发送，请查收！");
                        alert("短信验证码已经发送，请查收！");
                    } else {
                        console.log(msg);
                        alert(msg);
                    }
                } else {
                    console.log("短信验证码已经发送失败，请重试！");
                    alert("短信验证码已经发送失败，请重试！");
                }
            },
            error: function error(err, textStatus) {
                console.log("ajax请求失败!readyState:" + err.readyState + ",textStatus:" + textStatus);
                alert("短信验证码已经发送失败，请重试！");
            }
        });
    }

    function showMask(isShow) {

        if (!isShow) {
            session.showProgress();
        } else {
            session.showProgress(false);
        }

        if (isShow) {
            if ($('#maskDiv').length == 0) {
                var maskDiv = $('<div id="maskDiv" style="opacity: 1;position: absolute;top: 0;left: 0;background-color: white;width: 100%;height: 100%;z-index: 10000"></div>'); //创建一个父div
                $("body").append(maskDiv);
                var button = $($('<li class="input-row" style="display:-webkit-box;display: -webkit-flex"><span class="lf" style="display: block;width: 90px;height: 50px;line-height: 50px;margin-left: 15px;text-align: left;color: #3c3c3c;font-size: 18px">验证码</span><div style="-webkit-box-flex: 1;-webkit-flex: 1;flex: 1;display: -webkit-box;display: -webkit-flex;height: 50px"><p style="-webkit-box-flex: 1;-webkit-flex: 1;flex: 1;display: -webkit-box;display: -webkit-flex;height: 50px;"><input id="inputSms" style="width: 100%;height: 50px;border: none;font-size: 18px" placeholder="验证码"></p><span id="sendSmsBtn" style="display: block;width: 100px;height: 30px;line-height: 30px;background: #fe6246;color:white;font-size: 14px;margin-top: 10px;margin-right: 15px;text-align: center;border-radius: 6px">发送验证码</span></div></li><li style="display:-webkit-box;display: -webkit-flex;margin-top: 20px;margin-left: 15px;margin-right: 15px"><div style="-webkit-box-flex: 1;-webkit-flex: 1;flex: 1;display: -webkit-box;display: -webkit-flex;height: 50px"><span id="certificateBtn" style="width:100%;height:50px;line-height:50px;background:#fe6246;font-size:20px;color:white;text-align: center;border-radius: 6px">确定</span></div></li>'));
                $("#maskDiv").append(button);
                $('#sendSmsBtn').click(getSmsCode);
                $('#certificateBtn').click(certificateBtnAction);
            } else {
                $('#maskDiv').show();
            }
        } else {
            if ($('#maskDiv').length != 0) {
                $('#maskDiv').hide();
            }
        }
    }

    function certificateBtnAction() {
        console.log('certificateBtnAction');

        if (!/^\d{6}$/.test($('#inputSms').val())) {
            alert('请输入6位短信验证码！');
            return;
        }

        showMask(false);

        $("#input_code").val($('#inputSms').val());

        loadXd();
        // verify_second_sms($('#inputSms').val());
    }

    window.countdown = 60;
    function settime() {
        console.log("time:" + window.countdown);
        var obj = $('#sendSmsBtn')[0];
        if (window.countdown == 0) {
            obj.removeAttribute("disabled");
            $('#sendSmsBtn').text("发送验证码");
            window.countdown = 60;
            return;
        } else {
            window.xd_pwd = $('#inputPwd').val();
            obj.setAttribute("disabled", true);
            $('#sendSmsBtn').text("重新发送(" + window.countdown + ")");
            window.countdown--;
        }
        setTimeout(function () {
            settime();
        }, 1000);
    }

    function xdInit() {
        $.ajax({
            url: "/J/J10008.j?a.c=0&a.u=user&a.p=pass&a.s=ECSS",
            type: 'get',
            dataType: "json",
            beforeSend: function beforeSend() {},
            success: function success(result) {
                if (result && result.b && result.b.c === "00") {
                    //查询成功
                    switch (result.r.code) {
                        case "000":
                            showMask(true);
                            break;
                        case "001": //未登录
                        default:
                            //其它
                            if (confirm(result.r.msg)) {
                                setXd([]);
                            } else {
                                setXd([]);
                            }
                        //                            location.href="https://gd.189.cn/TS/login.htm?";
                    }
                } else if (result && result.b && result.b.v && result.b.v == "999") {
                    if (confirm(result.b.m)) {
                        setXd([]);
                    } else {
                        setXd([]);
                    }
                    //                    location.href="https://gd.189.cn/TS/login.htm?";
                } else {
                    if (confirm("详单查询初始化失败，请重试！")) {
                        setXd([]);
                    } else {
                        setXd([]);
                    }
                    //                    location.href="https://gd.189.cn/TS/login.htm?";
                }
            },
            error: function error(err, textStatus) {
                console.log("ajax请求失败!readyState:" + err.readyState + ",textStatus:" + textStatus);
                if (confirm("详单查询初始化失败，请重试！")) {
                    setXd([]);
                } else {
                    setXd([]);
                }
                //                location.href="https://gd.189.cn/TS/login.htm?";
            },
            complete: function complete() {}
        });
    }
});
},{}]},{},[1])
//# sourceMappingURL=sources_maps/telecom_gd.js.map
