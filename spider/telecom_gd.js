log("****************Debug model *******************")
dSpider("telecom_gd", function(session,env,$){
    log("current page: "+location.href)


    if(location.href.indexOf("gd.189.cn/TS/login.htm") != -1) {
        session.setStartUrl();
        return;
    } else if(location.href.indexOf("SSOLoginForCommNoPage") != -1) {
        console.log("SSOLoginForCommNoPage");
        return;
    } else if(location.href.indexOf("http://gd.189.cn/TS/index.htm") != -1 || location.href.indexOf("gd.189.cn/TS/?SESSIONID=") != -1) {

        session.showProgress();
        session.setProgress(0);
        var thxd = session.get("thxd")
        if(!thxd) {
            thxd = {};
        }
        var userInfo = thxd["user_info"];
        if(!userInfo) {
            userInfo = {};
        }
        if(!userInfo["name"]) {
            var timeout = 10000;
            var t = setInterval(function () {
                timeout -= 10;
                var ob = $("#user_name")
                if (ob[0] && ob.text() != "--") {
                    session.setProgress(10);
                    clearInterval(t)
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
        }
    } else if (location.href.indexOf("gd.189.cn/OperationInitAction2.do?OperCode=ChangeCustInfoNew") != -1) {

        waitDomAvailable("#cust_name_id", function(dom,timeSpan) {
            session.setProgress(20);
            log("wait cust_name_id success");
            var thxd = session.get("thxd")
            if(!thxd) {
                thxd = {};
            }
            var userInfo = thxd["user_info"];
            if(!userInfo) {
                userInfo = {};
            }
            if(!userInfo["name"]) {
                userInfo["name"]=$("#cust_name_id").val();
            }

            userInfo["idcard_no"]=$("#id_num_id").val();
            userInfo["contactNum"]=$("#moblie_id").val();
            var address = $("#post_addr_id").val();
            if(address.length == 0) {
                address = $("#id_addr_id").val();
            }
            userInfo["household_address"] = address;

            thxd["user_info"] = userInfo;
            session.set("thxd", thxd);

            location.href = "http://gd.189.cn/TS/cx/puk_chaxun.htm?cssid=wdwt-xgcx-puk_pincx";
            console.log(JSON.stringify(userInfo));
        },function() {
            session.setProgress(20);
            log("wait cust_name_id fail");
            location.href = "http://gd.189.cn/TS/cx/puk_chaxun.htm?cssid=wdwt-xgcx-puk_pincx";
        });


    } else if (location.href.indexOf("gd.189.cn/TS/cx/puk_chaxun.htm?cssid=wdwt-xgcx-puk_pincx") != -1) {

        waitDomAvailable("#phone", function(dom,timeSpan) {
            session.setProgress(30);
            log("wait custName success");
            var thxd = session.get("thxd")
            if(!thxd) {
                thxd = {};
            }
            var userInfo = thxd["user_info"];
            if(!userInfo) {
                userInfo = {};
            }

            userInfo["mobile"]=$("#phone").text();

            thxd["user_info"] = userInfo;
            session.set("thxd", thxd);
            console.log(JSON.stringify(userInfo));
//                location.href="http://gd.189.cn/TS/wode-wangting-sec.htm?cssid=sy-dh-top-wdwt";
            location.href="http://gd.189.cn/TS/cx/xiangdan_chaxun.htm?cssid=sy-kscx-xdcx";
        },function() {
            session.setProgress(30);
            log("wait phone fail");
            location.href="http://gd.189.cn/TS/cx/xiangdan_chaxun.htm?cssid=sy-kscx-xdcx";
        });

    } else if (location.href.indexOf("gd.189.cn/TS/cx/xiangdan_chaxun.htm?cssid=sy-kscx-xdcx") != -1) {
        waitDomAvailable(".get_sms_code", function(dom,timeSpan) {
            session.setProgress(40);
            getLoginUserType(function () {
                // showMask(true);
            })
        },function() {
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


    var details=[];
    var datas=[];
    var param={};

    var loginUser={};

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

        param={"d.d01":"","d.d02":"","d.d03":"","d.d04":"","d.d05":"20","d.d06":"1","d.d07":"","d.d08":"1"};
        param["d.d06"]=1;
        param["d.d01"]="call";
        // param["d.d02"]=$(".rq_list_on").attr("data-month");
        // param["d.d03"]=$(".rq_list_on").attr("data-start");
        // param["d.d04"]=$(".rq_list_on").attr("data-end");
        param["d.d02"]=months[curMonthIndex].month;
        param["d.d03"]=months[curMonthIndex].start;
        param["d.d04"]=months[curMonthIndex].end;
        var SearchVerifyCode=$("#input_code").val().trim();
        param["d.d07"]=SearchVerifyCode;


        loadXdByMonth();
    }

    function loadXdByMonth() {
        $.ajax({
            url:"/J/J10009.j?a.c=0&a.u=user&a.p=pass&a.s=ECSS",
            type:'get',
            dataType:"json",
            data:param,
            beforeSend:function(){
                console.log("beforeSend");
                console.log(param);
            },
            success:function(result){
                console.log(param);
                console.log(result);
                if(result&&result.b&&result.b.c==="00"){//查询成功
                    switch(result.r.code){
                        case "000":
                        case "009":
                            result=result.r||result;
                            var current_page=result.r06;
                            var total_page=result.r05;
                            current_page==1&&$.each(result.r02,function(i){
                                if(this.indexOf("通话类型") != -1) {
                                    commuTypeIndex = i;
                                } else if(this.indexOf("号码") != -1) {
                                    phoneIndex = i;
                                } else if(this.indexOf("日期") != -1) {
                                    dateIndex = i;
                                } else if(this.indexOf("时长") != -1) {
                                    durationIndex = i;
                                } else if(this.indexOf("费用") != -1) {
                                    feeIndex = i;
                                } else if(this.indexOf("呼叫类型") != -1) {
                                    callTypeIndex = i;
                                } else if(this.indexOf("通话地") != -1) {
                                    locationIndex = i;
                                }
                            });
                            $.each(result.r03,function(){
                                var data = {}
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

                            if(total_page>current_page) {
                                param["d.d06"]=parseInt(param["d.d06"])+1;
                                session.setProgress(45+(55/months.length)*(curMonthIndex+current_page/total_page));
                                loadXdByMonth();
                            } else {
                                console.log("load success:" + months[curMonthIndex].month);
                                var detail = {};
                                detail["calldate"] = months[curMonthIndex].month;
                                detail["cid"] = parseInt(new Date().getTime()/1000).toString();
                                detail["data"] = datas;
                                detail["status"] = 4;
                                details.push(detail);
                                // console.log(JSON.stringify(datas)||'<tr><td class="empty">'+(result.msg||"暂无数据")+'</td></tr>');
                                datas = [];
                                if(curMonthIndex < months.length-1) {
                                    session.setProgress(45+55*(curMonthIndex+1)/months.length);
                                    curMonthIndex++;
                                    param["d.d02"]=months[curMonthIndex].month;
                                    param["d.d03"]=months[curMonthIndex].start;
                                    param["d.d04"]=months[curMonthIndex].end;
                                    param["d.d06"]=1;
                                    console.log("curMonthIndex:" + curMonthIndex + "|" + months[curMonthIndex].month);
                                    loadXdByMonth();
                                } else {
                                    console.log("details");
                                    console.log(JSON.stringify(details));
                                    setXd(details);
                                }
                            }
                            break;
                        case "001"://未登录
                            sessionStorage.setItem("gd_TS_login_url",location.pathname);
                            setTimeout(function(){
                                location.href="https://gd.189.cn/TS/login.htm?redir="+encodeURIComponent(location.pathname+location.search)
                            },1500);
                        default://其它
                            console.log(result.r.msg);
                            if(result.r.msg.indexOf("验证码") != -1) {
                                alert(result.r.msg);
                                showMask(true);
                            }
                    }
                }else{
                    alert("清单查询初始化，请重试！");
                    console.log("load fail:" + months[curMonthIndex].month);
                    var detail = {};
                    detail["calldate"] = months[curMonthIndex].month;
                    detail["cid"] = parseInt(new Date().getTime()/1000).toString();
                    detail["data"] = datas;
                    if(datas.length > 0) {
                        detail["status"] = 5;
                    } else {
                        detail["status"] = 2;
                    }
                    details.push(detail);
                    // console.log(JSON.stringify(datas)||'<tr><td class="empty">'+(result.msg||"暂无数据")+'</td></tr>');
                    datas = [];
                    if(curMonthIndex < months.length-1) {
                        session.setProgress(45+55*(curMonthIndex+1)/months.length);
                        curMonthIndex++;
                        param["d.d02"]=months[curMonthIndex].month;
                        param["d.d03"]=months[curMonthIndex].start;
                        param["d.d04"]=months[curMonthIndex].end;
                        param["d.d06"]=1;
                        console.log("curMonthIndex:" + curMonthIndex + "|" + months[curMonthIndex].month);
                        loadXdByMonth();
                    } else {
                        console.log("details");
                        console.log(JSON.stringify(details));
                        setXd(details);
                    }
                }
            },
            error:function(err,textStatus){
                console.log("ajax请求失败!readyState:"+err.readyState+",textStatus:"+textStatus);
                alert("清单查询初始化，请重试！");

                console.log("load error:" + months[curMonthIndex].month);
                var detail = {};
                detail["calldate"] = months[curMonthIndex].month;
                detail["cid"] = parseInt(new Date().getTime()/1000).toString();
                detail["data"] = datas;
                if(datas.length > 0) {
                    detail["status"] = 5;
                } else {
                    detail["status"] = 2;
                }
                details.push(detail);
                // console.log(JSON.stringify(datas)||'<tr><td class="empty">'+(result.msg||"暂无数据")+'</td></tr>');
                datas = [];
                if(curMonthIndex < months.length-1) {
                    session.setProgress(45+55*(curMonthIndex+1)/months.length);
                    curMonthIndex++;
                    param["d.d02"]=months[curMonthIndex].month;
                    param["d.d03"]=months[curMonthIndex].start;
                    param["d.d04"]=months[curMonthIndex].end;
                    param["d.d06"]=1;
                    console.log("curMonthIndex:" + curMonthIndex + "|" + months[curMonthIndex].month);
                    loadXdByMonth();
                } else {
                    console.log("details");
                    console.log(JSON.stringify(details));
                    setXd(details);
                }
            },
            complete:function(){
                console.log("complete");
            }
        });
    }

    function setXd(xd) {
        var thxd = session.get("thxd")
        if(!thxd) {
            thxd = {};
        }
        thxd["month_status"] = xd;
        session.set("thxd", thxd);

        session.setProgress(100);

        log("爬取完毕----------" + JSON.stringify(thxd));
        session.upload(JSON.stringify(thxd));
        session.finish();
    }


    function getLoginUserType(callback){
        $.ajax({
            url:"/J/J10036.j?a.c=0&a.u=user&a.p=pass&a.s=ECSS",
            type:'get',
            dataType:"json",
            data:{},
            beforeSend:function(){
            },
            success:function(result){
                if(result&&result.b&&result.b.c==="00"){//查询成功
                    switch(result.r.code){
                        case "000":
                            var r=result.r,_numStr;
                            loginUser.account= r.r03||r.r02;//当前号码
                            loginUser.currNumBusiType = r.r05||r.r04;//当前号码业务类型
                            loginUser.payType = r.r07;//付费类型
                            loginUser.latnId= r.r14;//区号
                            session.setProgress(45);
                            // callback();
                            console.log(JSON.stringify(loginUser));
                            // getSmsCode(loginUser.latnId,loginUser.account);
                            showMask(true);
                            break;
                        case "001"://未登录
                        default://其它
                            showErr(result.r.msg);
                    }
                }else{
                    setXd([]);
                    console.log("详单查询初始化失败，请重试！");
                }
            },
            error:function(err,textStatus){
                setXd([]);
                console.log("ajax请求失败!readyState:"+err.readyState+",textStatus:"+textStatus);
            },
            complete:function(){
            }
        });
    }

    /**
     * 获得短信验证码
     * @param lantId
     * @param phone
     */
    function getSmsCode(lantId,phone){
        $.ajax({
            url:"/J/J20009.j?a.c=0&a.u=user&a.p=pass&a.s=ECSS",
            type:'post',
            dataType:"json",
            data:{"d.d01":lantId,"d.d02":phone,"d.d03":"CDMA"},
            success:function(result){
                if(result&&result.b&&result.b.c==="00"){//查询成功
                    var r=result.r;
                    if(r.code==="000"){
                        settime();
                        console.log("短信验证码已经发送，请查收！");
                        alert("短信验证码已经发送，请查收！");
                    }else{
                        console.log(msg);
                        alert(msg);
                    }
                }else{
                    console.log("短信验证码已经发送失败，请重试！");
                    alert("短信验证码已经发送失败，请重试！");
                }

            },
            error:function(err,textStatus){
                console.log("ajax请求失败!readyState:"+err.readyState+",textStatus:"+textStatus);
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

                //提示2
                var title2 = $($('<p><p/>'));
                title2.text('请输入短信验证码：');
                $("#maskDiv").append(title2);

                title2.css({
                    'position': 'absolute',
                    'left': '30px',
                    'top': '200px',
                    'height': '60px',
                    'width': '300px',
                    'font-size': '30px',
                });

                //短信输入框
                var inputSms = $('<input type="text" id="inputSms"/>');
                $("#maskDiv").append(inputSms);

                var title1Left = title2.offset().left + 'px';
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
                var sendSms = $('<input type="button" id="sendSmsBtn" value="免费获取验证码"/>').click(getSmsCode(loginUser.latnId,loginUser.account));
                $("#maskDiv").append(sendSms);

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
    }

})