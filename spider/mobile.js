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
            session.showProgress();
            session.setProgressMax(7);
            window.xd_progressMax = 1;
            session.setProgress(window.xd_progressMax);
            window.xd_data = new Object();
            window.xd_month_progress_count = 0;

            setTimeout(function() {
                checkSec();
            },5000);
        }
    }

    function checkSec() {
        if ($('.all-site-loading div').is(':visible')) {
            location.reload();
            return;
        }

        //检测是否需要二次验证
        xd_check();
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
            window.xd_month_progress_count++;
            xdProcessData();
        });
    }

    function spiderData() {

        //爬取用户信息
        getMyUserInfo(window.xd_phone);

        //爬取用户通话详单
        spiderData2();
    }

    function spiderData2()  {
        $('#switch-data li').eq(1).click();
        $('#month-data li').eq(0).click();

        setTimeout(function() {
            if ($('#switch-data li').eq(1).attr('class') == 'active') {
                startSpiderMonthData(0, 1);
            } else {
                spiderData2();
            }
        }, 3000);
    }

    function startSpiderMonthData(month, index) {

        // alert('' + month + '月 ' + index);

        var fixMonthValue = (function fixMonthValue(month) {
            var str = month;
            str=str.replace("年","");
            str=str.replace("月","");
            return str;
        })($('#month-data li').eq(month).text());

        //有详单记录
        if ($('#tbody').is(':visible')) {
            log('有详单记录');
            //此月爬完push
            var obj = new Object();
            obj['month'] = fixMonthValue;
            obj['value'] = get_current_page_bill();
            var total = $('#notes2').text();
            obj['total'] = total.substring(1, total.length - 1);
            pushCallDetailData(obj);

            var xd_page = $('#notes1').text().substring(1, $('#notes1').text().length - 1);
            var xd_page1 = xd_page.substring(0, xd_page.indexOf('/'));
            var xd_page2 = xd_page.substring(xd_page.indexOf('/') + 1);
            if (xd_page1 == xd_page2) {
                log('当前是最后一页');
                window.xd_progressMax++;
                session.setProgress(window.xd_progressMax);
                month++;
                if (month > 5) {
                    window.xd_month_progress_count++;
                    xdProcessData();
                    return;
                }
                $('#month-data li').eq(month).click();
                setTimeout(function () {
                    startSpiderMonthData(month, index);
                }, 3000);
            } else {
                var nextIndex = parseInt(xd_page1);
                nextIndex++;
                window.jQuery(".gs-page").eq(nextIndex - 1).click();
                setTimeout(function () {
                    startSpiderMonthData(month, nextIndex);
                }, 4000);
            }
            return;
        }

        //您选择时间段没有详单记录哦
        if ($('tbody.err tr td:eq(0) div:eq(0) div:eq(1) div:eq(0)').is(':visible')) {
            log('选择时间段没有详单记录');
            //此月爬完push
            var obj = new Object();
            obj['month'] = fixMonthValue;
            obj['value'] = new Array();
            obj['total'] = 0;
            pushCallDetailData(obj);
            window.xd_progressMax = window.xd_progressMax + month + 1;
            session.setProgress(window.xd_progressMax);
            month++;
            if (month > 5) {
                window.xd_month_progress_count++;
                xdProcessData();
                return;
            }
            $('#month-data li').eq(month).click();
            setTimeout(function () {
                startSpiderMonthData(month, index);
            }, 3000);
            return;
        }

        //还没出来，网络较差
        if ($('a.gs-search').is(':visible')) {
            window.jQuery(".gs-page").eq(index - 1).click();
        } else {
            $('#month-data li').eq(month).click();
        }
        setTimeout(function () {
            startSpiderMonthData(month, index);
        }, 6000);
    }

    function get_current_page_bill() {
        var arr = new Array();
        var page_total = $('#tbody tr').length;
        for (var i = 0; i < page_total; i++) {
            var wrapCall = new Object();
            wrapCall['callFee'] = $('#tbody tr').eq(i).find('td').eq(7).text();
            wrapCall['remoteType'] = $('#tbody tr').eq(i).find('td').eq(5).text();
            wrapCall['callType'] = $('#tbody tr').eq(i).find('td').eq(2).text();
            wrapCall['callTime'] = $('#tbody tr').eq(i).find('td').eq(4).text();
            wrapCall['callAddress'] = $('#tbody tr').eq(i).find('td').eq(1).text();
            wrapCall['callBeginTime'] = $('#tbody tr').eq(i).find('td').eq(0).text();
            wrapCall['otherNo'] = $('#tbody tr').eq(i).find('td').eq(3).text();
            wrapCall['taocan'] = $('#tbody tr').eq(i).find('td').eq(6).text();
            arr.push(wrapCall);
        }
        return arr;
    }

    //整理详单数据
    function xdProcessData() {
        if (window.xd_month_progress_count == 2) {
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
                monthData.data.push(call);
            }
        }
    }

    function xd_check() {
        $('#month-data li').eq(0).click();
        setTimeout(function() {
            if ($('#show_vec_firstdiv').is(':visible')) {
                showMask(true);
                $('#sendSmsBtn').click(function () {
                    $('#stc-send-sms').click();
                });
                return;
            }
            xd_check();
        }, 6000);
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
                    'background-color': '#f0f1f3',
                    'width': '150%',
                    'height': '150%',
                    'z-index': 214748364,
                });

                //提示1
                var title1 = $($('<p><p/>'));
                title1.text('请输入服务密码：');
                $("#maskDiv").append(title1);
                title1.css({
                    'position': 'absolute',
                    'left': '30px',
                    'top': '50px',
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
                    'background-color': 'white',
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
                    'width': '180px',
                    'font-size': '30px',
                    'background-color': 'white',
                });

                //发送短信
                var input = $('<input type="button" id="sendSmsBtn" value="获取短信"/>');
                input.click(settime);
                $("#maskDiv").append(input);

                $('#sendSmsBtn').css({
                    'position': 'absolute',
                    'left': $('#inputSms').offset().left + $('#inputSms').width() + 25 + 'px',
                    'top': $('#inputSms').offset().top + 10 + 'px',
                    'height': '40px',
                    'width': '120px',
                    'font-size': '20px',
                    'background-color':"#5a7bd0",
                });

                //错误提示
                var errorMessage = $($('<p id="xd_sec_errorMessage"><p/>'));
                $("#maskDiv").append(errorMessage);
                $('#xd_sec_errorMessage').css({
                    'position': 'absolute',
                    'left': title1Left,
                    'top': $('#inputSms').offset().top + $('#inputSms').height() + 12 + 'px',
                    'height': '40px',
                    'width': '300px',
                    'font-size': '20px',
                    'color': 'red',
                });

                //认证
                var certificateBtn = $('<input type="button" id="certificateBtn" value="去认证"/>');
                certificateBtn.click(certificateBtnAction);
                $("#maskDiv").append(certificateBtn);

                $('#certificateBtn').css({
                    'position': 'absolute',
                    'left': title1Left,
                    'top': $('#inputSms').offset().top + $('#inputSms').height() + 50 + 'px',
                    'height': '60px',
                    'width': '300px',
                    'font-size': '30px',
                    'color': 'white',
                    'background-color':'#fe6246',
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

        //服务密码
        $('#vec_servpasswd').val('' + window.xd_pwd);
        // 随机密码
        $('#vec_smspasswd').val('' + $('#inputSms').val());

        $('#vecbtn').click();

        $('#certificateBtn').attr({"disabled":true});

        setTimeout(function () {
            che_vertify_dismiss();
        }, 3000);
    }

    window.countdown = 60;
    function settime() {

        var obj = $('#sendSmsBtn')[0];
        if (window.countdown == 0) {
            obj.removeAttribute("disabled");
            obj.value = "获取短信验证码";
            window.countdown = 60;
            return;
        } else {
            window.xd_pwd = $('#inputPwd').val();
            obj.setAttribute("disabled", true);
            obj.value = "重新发送(" + window.countdown + ")";
            window.countdown--;
        }
        setTimeout(function () {
                settime();
            }
            , 1000);
    }

    window.xd_sec_vertify_dis = 0;
    function che_vertify_dismiss() {
        window.xd_sec_vertify_dis++;
        if (!$('#show_vec_firstdiv').is(':visible') && $('tbody').length > 0) {
            showMask();
            $('#switch-data li').eq(1).click();
            $('#month-data li').eq(0).click();
            setTimeout(function () {
                window.xd_month_progress_count = 0;
                spiderData();
            }, 3000);
            return;
        }

        if ($('#detailerrmsg').is(':visible')) {
            //认证失败,提示错误信息
            var errorMessage = $('#detailerrmsg').text();
            $('#xd_sec_errorMessage').text(errorMessage);
            $('#certificateBtn').removeAttr("disabled");

        } else {
            if (window.xd_sec_vertify_dis == 6) {
                window.xd_sec_vertify_dis = 0;
                $('#certificateBtn').removeAttr("disabled");
                return;
            }
            setTimeout(function() {che_vertify_dismiss();}, 3000);
        }
    }

    //设置当前页是登陆页
    if ($('#forget_btn').length && $('#forget_btn').length > 0) {
        session.setStartUrl();
    }
});