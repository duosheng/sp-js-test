dSpider("mobile",function(session,env,$) {

    checkLogin_first();

    // -------------------------------------------
    function checkLogin_first() {

        var cts = 'login.10086.cn';
        var cts2 = 'channelID';
        // 登陆页
        if (window.location.href.indexOf(cts) >= 0 && window.location.href.indexOf(cts2) >= 0) {

            log('进入登陆页');

            // 隐藏其他跳转元素
            hideElement($('#submit_help_info'));
            hideElement($('#link_info'));
            hideElement($('#forget_btn'));
            hideElement($('#go_home'));
            hideElement($('.back_btn'));
            hideElement($('#chk'));
            hideElement($('#chk').parent().find('label'));

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

            // 填充默认手机号
            if (session.getLocal("xd_phone")) {
                $('#p_phone_account').val(session.getLocal("xd_phone"));
                $("#p_phone_account").attr({"disabled":true});

                $('#account_nav').click(function () {
                    if (session.getLocal("xd_phone")) {
                        if (!$('#p_pwd').val()) {
                            needVerifyCode();
                        }
                    }
                });

                $('#p_phone').val(session.getLocal("xd_phone"));
                $("#p_phone").attr({"disabled":true});
                needVerifyCode();
            }

            $('#submit_bt').click(function () {

                //存储手机号
                if ($('#account_nav').attr('class') == 'on') {
                    session.setLocal("xd_phone",$('#p_phone_account').val());
                } else {
                    session.setLocal("xd_phone",$('#p_phone').val());
                }

                if ($('#p_sms').val() == '') {
                    session.set("firstSMSTime",'0');
                }
            });
        } else {
            // 爬取页
            log('进入爬取页');
            var xd_phone = session.getLocal("xd_phone");
            window.xd_phone = xd_phone;
            if (window.xd_phone) {
                session.autoLoadImg(false);
                checkLogin_second();
                return;
            } else {
                //手机号未就绪
                log('手机号未就绪');
                return;
            }
        }
    }
    
    function hideElement(element) {
        if (element.length > 0) {
            element.hide();
        }
    }

    function checkLogin_second() {

        var cts = 'shop.10086.cn/i/?f=billdetailqry&welcome=';
        if (window.location.href.indexOf(cts) >= 0) {
            log('确定进入的是爬取页');
            var phone = window.xd_phone;
            //检测是否需要登陆短信
            session.showProgress();
            session.setProgressMax(8);
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

    function checkDataRepetition() {
        //标记上第一个，防止爬取重复
        if ($('#tbody').xd_spider == undefined) {
            // 新的，可以爬取
            $('#tbody').xd_spider = true;
            return true;
        } else {
            $('#month-data li').eq(month).click();
            //查看是不是已经有此月份了
            for (var i = 0; i < window.xd_callBill.length; i++) {
                var obj = window.xd_callBill[i];
                if (obj.calldate.indexOf(fixMonthValue) >= 0) {
                    //有此月份
                    window.xd_callBill.pop(obj);
                    break;
                }
            }
            return false;
        }
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

            var check = checkDataRepetition();
            if (check == false) {
                // 数据爬取重复
                setTimeout(function () {
                    startSpiderMonthData(month, 1);
                }, 3000);
                return;
            }

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

        var xd_startTriggerSecVertifiTime = session.get('xd_startTriggerSecVertifiTime');
        var xd_hasFitstSecReload = true;

        if (!xd_startTriggerSecVertifiTime) {
            xd_hasFitstSecReload = false;
            xd_startTriggerSecVertifiTime = (new Date).getTime();
            session.set('xd_startTriggerSecVertifiTime', xd_startTriggerSecVertifiTime);
        }

        if (xd_startTriggerSecVertifiTime < (new Date).getTime() - 60000) {
            if (!xd_hasFitstSecReload) {
                log('二次认证一直不出现，刷新一次试试');
                location.reload();
                return;
            }
        }

        if (window.xd_startTriggerSecVertifiTime < (new Date).getTime() - 90000) {
            session.finish("二次验证请求, 许久没有出现",3);
            return;
        }

        log('触发二次验证');
        setTimeout(function() {
            if ($('#show_vec_firstdiv').is(':visible')) {
                log('展示二次验证');
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

                !function(e){function t(a){if(i[a])return i[a].exports;
                    var n=i[a]={exports:{},id:a,loaded:!1};
                    return e[a].call(n.exports,n,n.exports,t),n.loaded=!0,n.exports}var i={};
                    return t.m=e,t.c=i,t.p="",t(0)}([function(e,t){"use strict";
                    Object.defineProperty(t,"__esModule",{value:!0});
                    var i=window;t["default"]=i.flex=function(e,t){
                    var a=e||100,n=t||1,r=i.document,o=navigator.userAgent;
                        var d=o.match(/Android[\S\s]+AppleWebkit\/(\d{3})/i),l=o.match(/U3\/((\d+|\.){5,})/i);
                        var c=l&&parseInt(l[1].split(".").join(""),10)>=80;
                        var p=navigator.appVersion.match(/(iphone|ipad|ipod)/gi),s=i.devicePixelRatio||1;
                    p||d&&d[1]>534||c||(s=1);
                    var u=1/s,m=r.querySelector('meta[name="viewport"]');
                    m||(m=r.createElement("meta"),m.setAttribute("name","viewport"),r.head.appendChild(m));
                        var sss = "width=device-width,user-scalable=no,initial-scale=";
                        m.setAttribute("content",sss+u+",maximum-scale="+u+",minimum-scale="+u);
                        r.documentElement.style.fontSize=a/2*s*n+"px"},e.exports=t["default"]}]);
                flex(200, 1);

                window.scrollTo(0,0);

                var leftGapFloat = .15;
                var leftGap = leftGapFloat + 'rem';
                var webViewWidthFloat = screen.width / 100.;
                var webViewWidth = webViewWidthFloat + 'rem';

                var maskDiv = $('<div></div>');        //创建一个父div
                maskDiv.attr('id', 'maskDiv');        //给父div设置id
                $("body").append(maskDiv);
                $("#maskDiv").css({
                    'opacity': 1,
                    'position': 'absolute',
                    'top': 0,
                    'left': 0,
                    'background-color': '#f0f1f3',
                    'width': $(document).width(),
                    'height': $(document).height(),
                    'z-index': 214748364,
                });

                // cell 背景
                var cellBackgroundDiv = $('<div><div/>');
                var cellStyle = {
                    'position': 'absolute',
                    'top': '.08rem',
                    'left': '0rem',
                    'width': webViewWidth,
                    'height': '1rem',
                    'background-color': '#ffffff',
                };
                cellBackgroundDiv.css(cellStyle);
                $("#maskDiv").append(cellBackgroundDiv);

                // cell 间隔线
                var cellSeparator = $('<div><div/>');
                cellSeparator.css({
                    'position': 'absolute',
                    'top': '.5rem',
                    'left': leftGap,
                    'width': (webViewWidthFloat - leftGapFloat) + 'rem',
                    'height':'0.015rem',
                    'background-color': '#e8e8e8',
                });
                cellBackgroundDiv.append(cellSeparator);

                //提示1
                var title1 = $($('<p><p/>'));
                title1.text('服务密码');
                title1.css({
                    'position': 'absolute',
                    'line-height':'.5rem',
                    'left': leftGap,
                    'top': 0,
                    'height': '.5rem',
                    'width': '.7rem',
                    'font-size': '.15rem',
                });
                cellBackgroundDiv.append(title1);

                var inputSmsWidth = 320. / 750. * webViewWidthFloat;
                var titleRightFloat = 0.85;
                //密码输入框
                var inputPwd = $('<input type="text" id="inputPwd"/>');
                inputPwd.css({
                    'position': 'absolute',
                    'left': titleRightFloat + 'rem',
                    'top': '.1rem',
                    'height': '.3rem',
                    'line-height':'.3rem',
                    'width': inputSmsWidth + 'rem',
                    'font-size': '.15rem',
                    'background-color': 'white',
                });
                inputPwd.attr('placeholder', '请输入服务密码');
                cellBackgroundDiv.append(inputPwd);

                //placeholder


                //提示2
                var title2 = $($('<p><p/>'));
                title2.text('验证码');
                title2.css({
                    'position': 'absolute',
                    'line-height':'.5rem',
                    'left': leftGap,
                    'top': '.5rem',
                    'height': '.5rem',
                    'width': '.7rem',
                    'font-size': '.15rem',
                });
                cellBackgroundDiv.append(title2);

                //短信输入框
                var inputSms = $('<input type="text" id="inputSms"/>');
                inputSms.css({
                    'position': 'absolute',
                    'left': titleRightFloat + 'rem',
                    'top': '.61rem',
                    'height': '.29rem',
                    'line-height':'.29rem',
                    'width': inputSmsWidth + 'rem',
                    'font-size': '.15rem',
                    'background-color': 'white',
                });
                inputSms.attr('placeholder', '请输入短信验证码');
                cellBackgroundDiv.append(inputSms);

                //发送短信
                var smssendwidthFloat = 194. / 750. * webViewWidthFloat;
                var smssendwidth = smssendwidthFloat + 'rem';
                var input = $('<input type="button" id="sendSmsBtn" value="获取验证码"/>');
                input.click(settime);
                var cssEnable = {
                    'position': 'absolute',
                    'border-radius':'0.025rem',
                    'border-style':'solid',
                    'border-color':'#5a7bd0',
                    'border-width':'0.01rem',
                    'left': webViewWidthFloat - leftGapFloat - smssendwidthFloat + 'rem',
                    'top': ((.50 - .28) / 2 + .5) + 'rem',
                    'height': '.28rem',
                    'width': smssendwidth,
                    'font-size': '.13rem',
                    'background-color':"white",
                    'color': '#5a7bd0',
                };

                var cssDisable = {
                    'position': 'absolute',
                    'border-radius':'0.025rem',
                    'border-style':'none',
                    'left': webViewWidthFloat - leftGapFloat - smssendwidthFloat + 'rem',
                    'top': ((.50 - .28) / 2 + .5) + 'rem',
                    'height': '.28rem',
                    'width': smssendwidth,
                    'font-size': '.13rem',
                    'background-color':"#bcc0c9",
                    'color': 'white',
                };

                input[0].cssEnable = cssEnable;
                input[0].cssDisable = cssDisable;
                input.css(cssEnable);
                cellBackgroundDiv.append(input);

                //错误提示
                var errorMessage = $($('<p id="xd_sec_errorMessage"><p/>'));
                $("#maskDiv").append(errorMessage);
                $('#xd_sec_errorMessage').css({
                                              'position': 'absolute',
                                              'left': leftGap,
                                              'top': 0.08 + 1 + 'rem',
                                              'height': '.2rem',
                                              'width': '3rem',
                                              'line-height':'.2rem',
                                              'font-size': '0.1rem',
                                              'color': 'red',
                                              });

                //认证
                var certificateBtn = $('<input type="button" id="certificateBtn" value="去认证"/>');
                certificateBtn.click(certificateBtnAction);
                $("#maskDiv").append(certificateBtn);

                $('#certificateBtn').css({
                    'position': 'absolute',
                    'border-radius':'0.025rem',
                    'left': leftGap,
                    'top': 0.08 + 1 + .2 + 'rem',
                    'height': '.5rem',
                    'width': (webViewWidthFloat - leftGapFloat * 2) + 'rem',
                    'font-size': '.17rem',
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
        if (window.countdown == 60) {
            $('#sendSmsBtn').css(obj.cssDisable);
        }
        if (window.countdown == 0) {
            obj.removeAttribute("disabled");
            $('#sendSmsBtn').css(obj.cssEnable);
            obj.value = "获取短信验证码";
            window.countdown = 60;
            return;
        } else {
            window.xd_pwd = $('#inputPwd').val();
            obj.setAttribute("disabled", true);
            obj.value = "重新发送(" + window.countdown + "s)";
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
