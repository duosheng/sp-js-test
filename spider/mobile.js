dSpider("mobile",function(session,env,$) {

    checkLogin_first();

    // -------------------------------------------
    function checkLogin_first() {

        var xd_phone = session.get("xd_phone");
        window.xd_phone = xd_phone;
        if (window.xd_phone) {
            session.autoLoadImg(false)
            checkLogin_second();
            return;
        }

        var cts = 'login.10086.cn';
        var cts2 = 'channelID';
        if (window.location.href.indexOf(cts) >= 0 && window.location.href.indexOf(cts2) >= 0) {

            if ($('#getSMSpwd').length) {
                $('#getSMSpwd').click(function () {
                    session.set("firstSMSTime",new Date().getTime() + '');
                });
            }

            if ($('#getPhoneSMSpwd').length) {
                $('#getPhoneSMSpwd').click(function () {
                    session.set("firstSMSTime",new Date().getTime() + '');
                });
            }

            $('#submit_bt').click(function () {

                //存储手机号
                if ($('#account_nav').attr('class') == 'on') {
                    session.set("xd_phone",$('#p_phone_account').val());
                } else {
                    session.set("xd_phone",$('#p_phone').val());
                }

                if ($('#p_sms').val() == '') {
                    session.set("firstSMSTime",'0');
                }
            });
        }
    }

    function checkLogin_second() {

        //手机号和密码未就绪的
        if (!window.xd_phone) return;
        var cts = 'shop.10086.cn/i/?f=billdetailqry&welcome=';
        if (window.location.href.indexOf(cts) >= 0) {
            var phone = window.xd_phone;
            //检测是否需要登陆短信
            session.showProgress()
            session.setProgressMax(7)
            window.xd_progressMax = 1;
            session.setProgress(window.xd_progressMax)
            window.xd_data = new Object();
            checkSec();
        }
    }

    function checkSec() {

        //检测是否需要二次验证 or 拿取数据
        (function () {
            require(["/i/service/model/fee_c3dfbd6.js", "/i/apps/serviceapps/billdetail/billdetailone_288e057.js", "/i/nresource/js/page/pages.js", "btncommit", "/i/apps/serviceapps/billdetail/billdetailtwo_00c3bc9.js"], function (fee, billdetailone, page, btn, billdetailtwo) {

                //req = ["18310346355", 1, 50, "201611", "02"];
                //["18310346355", 第1页, 请求50个, "201611", "02"]

                var today = new Date();//获得当前日期
                var nowMonth = today.getMonth() + 1;//此方法获得的月份是从0---11，所以要加1才是当前月份
                var nowYear = today.getFullYear();

                var parmMonth = (function zfill(num, size) {
                    var s = "000000000" + num;
                    return s.substr(s.length - size);
                }(nowMonth, 2));

                var req = [window.xd_phone, 1, 50, '' + nowYear + parmMonth, '02'];
                fee.getDetailInfo(req, function (data, total, start, end, time) {
                    //可以拿数据了
                    spiderData();
                }, function (code, msg, sOperTime) {
                    // log("fail");
                    if (code == "520001" || code == "3018") { //需要短信二次认证
                        // log('\n----需要验证码-----\n');
                        checkSmsTime();
                    } else {
                        // log('\n----未知错误-----\n');
                        session.finish(msg, '二次验证请求发生错误', code);
                    }
                }, function (code, msg, sOperTime) {
                    // log('\n----error-----\n');
                    session.finish(msg, '二次验证请求发生错误', code);
                });
            });
        }());
    }

    function monthArray() {
        var monthArray = new Array();
        var today = new Date();//获得当前日期
        for (var i = 0; i < 6; i++) {
            var nowMonth = today.getMonth() + 1;//此方法获得的月份是从0---11，所以要加1才是当前月份
            var nowYear = today.getFullYear();

            var mm = nowMonth - i;
            if (mm <= 0) {
                nowYear--;
                mm += 12;
            }

            var parmMonth = (function zfill(num, size) {
                var s = "000000000" + num;
                return s.substr(s.length - size);
            }(mm, 2));

            monthArray.push('' + nowYear + parmMonth);
        }
        return monthArray;
    }

    function getMyUserInfo(phone) {

        var url = 'http://shop.10086.cn/i/v1/cust/info/' + phone + '?time=' + new Date().getTime();
        $.get(url, function (result) {

            var data = result.data;

            var xd_user_info = {
                'mobile':window.xd_phone,
                'name': data.name,
                'household_address': data.address,
                'contactNum': data.contactNum,
                'registration_time': data.inNetDate,
            };

            window.xd_data['user_info'] = xd_user_info;
            window.xd_progressMax++;
            session.setProgress(window.xd_progressMax);
            xdProcessData();
        });
    }

    function spiderData() {

        //爬取用户信息
        getMyUserInfo(window.xd_phone);

        //爬取用户通话详单
        window.monthArray = monthArray();
        for (var i = 0; i < window.monthArray.length; i++) {
            window.xd_monthDataCount = 0;
            var month = window.monthArray[i];
            startSpiderMonthData(month);
        }
    }

    function startSpiderMonthData(month, index) {

        if (arguments.length == 1) {
            index = 1;
        }

        (function () {
            require(["/i/service/model/fee_c3dfbd6.js", "/i/apps/serviceapps/billdetail/billdetailone_288e057.js", "/i/nresource/js/page/pages.js", "btncommit", "/i/apps/serviceapps/billdetail/billdetailtwo_00c3bc9.js"], function (fee, billdetailone, page, btn, billdetailtwo) {

                //req = ["18310346355", 1, 50, "201611", "02"];
                //["18310346355", 第1页, 请求50个, "201611", "02"]

                req = [window.xd_phone, index, 50, month, "02"];
                fee.getDetailInfo(req, function (data, total, start, end, time) {

                    // log('\n----succ-----\n');
                    //详单数据
                    // log(data);

                    var key = month + '.' + index;

                    if (total != 0) {

                        var obj = new Object();
                        obj['month'] = month;
                        obj['value'] = data;
                        obj['total'] = total;
                        pushCallDetailData(obj);

                        if (index * 50 >= total) {
                            //此月爬完
                            window.xd_progressMax++;
                            session.setProgress(window.xd_progressMax);
                            window.xd_monthDataCount++;


                            if (window.xd_monthDataCount >= 6) {
                                xdProcessData();
                            }
                        } else {
                            index++;
                            startSpiderMonthData(month, index);
                        }

                    } else {

                        var value = '您选择的时间段内没有详单记录哦';
                        //此月爬完push
                        var obj = new Object();
                        obj['month'] = month;
                        obj['value'] = new Array();
                        obj['total'] = 0;
                        pushCallDetailData(obj);

                        window.xd_monthDataCount++;
                        window.xd_progressMax++;
                        session.setProgress(window.xd_progressMax);
                        if (window.xd_monthDataCount >= 6) {
                            xdProcessData();
                        }
                    }
                }, function (code, msg, sOperTime) {

                    //时间段内没有详单记录
                    if (code == '2039') {
                        var key = month + '.' + index;
                        var value = '您选择的时间段内没有详单记录哦';
                        //此月爬完push
                        var obj = new Object();
                        obj['month'] = month;
                        obj['value'] = new Array();
                        obj['total'] = 0;
                        pushCallDetailData(obj);

                        window.xd_monthDataCount++;
                        window.xd_progressMax++;
                        session.setProgress(window.xd_progressMax);
                        if (window.xd_monthDataCount >= 6) {
                            xdProcessData();
                        }

                    } else {
                        if (code == "520001" || code == "3018") { //需要短信二次认证
                            // log('\n----需要验证码-----\n');
                            checkSmsTime();
                        } else {
                            // log('\n----未知错误-----\n');

                            var obj = new Object();
                            obj['month'] = month;
                            obj['value'] = new Array();
                            obj['total'] = total;
                            obj['state'] = 2;

                            if (index == 1) {
                                //此月爬完
                                window.xd_progressMax++;
                                session.setProgress(window.xd_progressMax);
                                window.xd_monthDataCount++;
                            } else {
                                obj['state'] = 5;
                            }
                            pushCallDetailData(obj);

                            if (window.xd_monthDataCount >= 6) {
                                xdProcessData();
                            }
                        }
                    }
                }, function (code, msg, sOperTime) {

                    // log('\n----error-----\n');

                    var obj = new Object();
                    obj['month'] = month;
                    obj['value'] = new Array();
                    obj['total'] = 0;
                    obj['state'] = 2;

                    if (index == 1) {
                        //此月爬完
                        window.xd_progressMax++;
                        session.setProgress(window.xd_progressMax);
                        window.xd_monthDataCount++;
                    } else {
                        obj['state'] = 5;
                    }
                    pushCallDetailData(obj);

                    if (window.xd_monthDataCount >= 6) {
                        xdProcessData();
                    }
                });
            });
        }());
    }

    //整理详单数据
    function xdProcessData() {

        if (window.xd_data.user_info && window.xd_monthDataCount >= 6) {

            window.xd_data['month_status'] = window.xd_callBill;
            session.upload(window.xd_data);
            session.finish();
        }
    }

    //存储详单数据
    function pushCallDetailData(data) {

        if (!window.xd_callBill) {
            window.xd_callBill = new Array();
        }

        var monthData = null;
        if (window.xd_callBill.length > 0) {
            //查看是不是已经有此月份了
            for (var i = 0; i < window.xd_callBill.length; i++) {
                var obj = window.xd_callBill[i];
                if (obj.calldate.indexOf(data.month) >= 0) {
                    //有此月份
                    monthData = obj;
                    break;
                }
            }
        }

        //第一次添加月份
        if (monthData == null) {

            var time = new Date().getTime();
            var xd_cid = (function zfill(num, size) {
                var s = "000000000" + num;
                return s.substr(s.length - size);
            }(time, 10));

            monthData = new Object();
            monthData['data'] = new Array();
            monthData['calldate'] = data.month;
            monthData['totalCount'] = data.total;
            monthData['mobile'] = window.xd_phone;
            monthData['cid'] = xd_cid;
            monthData['status'] = 4;
            window.xd_callBill.push(monthData);
        }

        if (data.status){
            monthData['status'] = data.status;
        }

        if (data.value.length > 0) {
            for (var i = 0; i < data.value.length; i++) {

                var call = data.value[i];
                var wrapCall = new Object();
                wrapCall['callFee'] = call.commFee;
                wrapCall['remoteType'] = call.commType;
                wrapCall['callType'] = call.commMode;
                wrapCall['callTime'] = call.commTime;
                wrapCall['callAddress'] = call.commPlac;
                wrapCall['callBeginTime'] = call.startTime;
                wrapCall['otherNo'] = call.anotherNm;
                wrapCall['taocan'] = call.mealFavorable;
                monthData.data.push(wrapCall);
            }
        }
    }


    function checkSmsTime() {
        var time = session.get("firstSMSTime");

        window.firstSmsTm = parseInt(time);
        setTimeout(xd_check, 1000);
    }

    function xd_check() {

        if ((window.firstSmsTm + 30 * 1000) < new Date().getTime()) {

            showMask(true);
            $('#sendSmsBtn').click(function () {
                send_second_sms();
            });
        } else {
            setTimeout(xd_check, 1000);
        }
    };

    function send_second_sms() {
        //发送二次短信
        // alert('sec-send-' + window.firstSmsTm);
        var req1 = ["https://login.10086.cn", window.xd_phone];
        (function (req, succ, fail) {
            require(["stclog"], function (stclog) {
                var myDate = new Date();
                $.ajax({
                    type: 'POST',
                    url: req[0] + '/sendSMSpwd.action',
                    async: false,
                    timeout: 10,
                    dataType: 'jsonp',
                    jsonpCallback: "result",
                    data: {
                        userName: req[1]
                    },
                    success: function (data) {

                        if (data.resultCode == "error") {
                            // alert("系统异常！");
                            alert("发生未知错误，请稍后重试");
                        } else {
                            if (!window.fffirst) {
                                alert("短信已发送, 如果您未收到，请60秒后重试");
                                window.fffirst = true;
                            } else {
                                alert("短信已发送!");
                            }
                        }
                    },
                    error: function (request, strStatus, thrown) {
                        // alert("系统异常！");
                        alert("发生未知错误，请稍后重试");
                        return;
                    }
                });
            })
        }(req1, null, null));
    }

    function verify_second_sms(smscode) {

        //验证二次短信
        (function (_phone, but) {
            require(["/i/service/model/fee_c3dfbd6.js", "pluspop", "btncommit"], function (fee, poptool, btnCommit) {

                req = ["https://login.10086.cn"];
                req.push(window.xd_phone);
                req.push(window.xd_pwd);
                req.push(smscode);
                req.push("01", "", "12003", "01");
                fee.submitDetailVec(req, function (data) {
                    // log('\n----短信验证成功-----\n');

                    showMask(false);
                    spiderData();

                }, function (code, msg) {
                    alert(msg);
                });
            });
        }(window.xd_phone, null));
    }

    function showMask(isShow) {

        if (!isShow) {
            session.showProgress();
        } else {
            session.showProgress(false);

        }

        if (isShow) {
            if ($('#maskDiv').length == 0) {
                var maskDiv = $('<div></div>');        //创建一个父div
                maskDiv.attr('id', 'maskDiv');        //给父div设置id
                $("body").append(maskDiv);
                $("#maskDiv").css({
                    'opacity': 1,
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'background-color': '#AAAAAA',
                    'width': '200%',
                    'height': '200%',
                    'z-index': 10000
                });

                //提示1
                var title1 = $($('<p><p/>'));
                title1.text('请输入服务密码：');
                $("#maskDiv").append(title1);
                title1.css({
                    'position': 'absolute',
                    'left': '30px',
                    'top': '200px',
                    'height': '60px',
                    'width': '300px',
                    'font-size': '30px',
                });

                //密码输入框
                var inputPwd = $('<input type="text" id="inputPwd"/>');
                $("#maskDiv").append(inputPwd);

                var title1Left = title1.offset().left + 'px';
                var inputPwdTop = title1.offset().top + title1.height() + 10 + 'px';
                $('#inputPwd').css({
                    'position': 'absolute',
                    'left': title1Left,
                    'top': inputPwdTop,
                    'height': '60px',
                    'width': '300px',
                    'font-size': '20x',
                    'background-color': 'yellow',
                });

                //提示2
                var title2 = $($('<p><p/>'));
                title2.text('请输入短信验证码：');
                $("#maskDiv").append(title2);

                var title2Top = $('#inputPwd').offset().top + $('#inputPwd').height() + 50 + 'px';
                title2.css({
                    'position': 'absolute',
                    'left': title1Left,
                    'top': title2Top,
                    'height': '60px',
                    'width': '300px',
                    'font-size': '30px',
                });

                //短信输入框
                var inputSms = $('<input type="text" id="inputSms"/>');
                $("#maskDiv").append(inputSms);

                var inputSmsTop = title2.offset().top + title2.height() + 10 + 'px';
                $('#inputSms').css({
                    'position': 'absolute',
                    'left': title1Left,
                    'top': inputSmsTop,
                    'height': '60px',
                    'width': '300px',
                    'font-size': '30px',
                    'background-color': 'yellow',
                });

                //发送短信
                var input = $('<input type="button" id="sendSmsBtn" value="免费获取验证码"/>').click(settime);
                $("#maskDiv").append(input);

                $('#sendSmsBtn').css({
                    'position': 'absolute',
                    'left': $('#inputSms').offset().left + $('#inputSms').width() + 30 + 'px',
                    'top': $('#inputSms').offset().top + 'px',
                    'height': '60px',
                    'width': '200px',
                    'font-size': '30px',
                    'background-color': 'green',
                });

                //认证
                var certificateBtn = $('<input type="button" id="certificateBtn" value="去认证"/>').click(certificateBtnAction);
                $("#maskDiv").append(certificateBtn);

                $('#certificateBtn').css({
                    'position': 'absolute',
                    'left': title1Left,
                    'top': $('#inputSms').offset().top + $('#inputSms').height() + 50 + 'px',
                    'height': '60px',
                    'width': '300px',
                    'font-size': '30px',
                    'background-color': 'green',
                });

            } else {
                $('#maskDiv').show();
            }
        } else {
            if ($('#maskDiv').lensgth != 0) {
                $('#maskDiv').hide();
            }
        }
    }

    function certificateBtnAction() {
        window.xd_pwd = $('#inputPwd').val();

        if (!/^\d{6}$/.test(window.xd_pwd)) {
            alert('请输入6位服务密码！');
            return;
        }

        if (!/^\d{6}$/.test($('#inputSms').val())) {
            alert('请输入6位短信验证码！');
            return;
        }

        verify_second_sms($('#inputSms').val());
    }

    window.countdown = 60;
    function settime() {

        var obj = $('#sendSmsBtn')[0];
        if (window.countdown == 0) {
            obj.removeAttribute("disabled");
            obj.value = "免费获取验证码";
            window.countdown = 60;
            return;
        } else {
            window.xd_pwd = $('#inputPwd').val();
            obj.setAttribute("disabled", true);
            obj.value = "重新发送(" + window.countdown + ")";
            window.countdown--;
        }
        setTimeout(function () {
                settime()
            }
            , 1000);
    };
});