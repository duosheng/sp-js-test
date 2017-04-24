dSpider("mobile", 60 * 5, function (session, env, $) {
    var SUCCESS = "000000";
    var PHONE = session.getArguments().phoneNo || session.getLocal("xd_phone");
    var cts = 'login.10086.cn';
    var cts2 = 'channelID';
    var loginUrl = "https://login.10086.cn/login.html?channelID=12003&backUrl=http://shop.10086.cn/i/?f=billdetailqry";
    if (location.href.indexOf('shop.10086.cn/i/?f=billdetailqry&welcome=') >= 0) {
        var gData = session.get("gData") || {month_status: []};
        var TOTAL = 4;
        var MONTH = session.get("lastMonth")
        MONTH = MONTH === undefined ? TOTAL : MONTH;
        var offset = session.get("lastOffset") || 0;
        var callback; //验证成功后的回调
        var verifyCount = 0;
        var inNetDate;
        var beyondDateTimes=0;
        //strip []
        function strip(s) {
            s = s || "";
            return s.substr(s.indexOf("]") + 1);
        }

        // convert time to second
        function second(t) {
            if (t.indexOf("秒") != -1) {
                // 1小时5分14秒
                var totalTime = 0;

                var h_index = t.indexOf('小时');
                if (h_index >= 0) {
                    var h_str = t.substring(0, h_index);
                    var h = parseInt(h_str);
                    totalTime += h * 60 * 60;
                    t = t.substr(h_index + 2);
                }

                var m_index = t.indexOf('分');
                if (m_index >= 0) {
                    var m_str = t.substring(0, m_index);
                    var m = parseInt(m_str);
                    totalTime += m * 60;
                    t = t.substr(m_index + 1);
                }

                var s_index = t.indexOf('秒');
                if (s_index >= 0) {
                    var s_str = t.substring(0, s_index);
                    var s = parseInt(s_str);
                    totalTime += s;
                }
                return totalTime;
            } else if (t.indexOf(":") != -1) {
                var sum = 0;
                $.each(t.split(":"), function (i, e) {
                    sum += parseInt(e) * Math.pow(60, 2 - i)
                })
                return sum;
            } else {
                return t;
            }
        }

        function genCid(size) {
            var s = "000000000" + Date.now();
            return s.substr(s.length - size);
        }

        function parseDetail(data, date) {
            var md = {};
            md.calldate = date;
            var year = date.substr(0, 4);
            md.status = 0;
            md.mobile = PHONE;
            md.cid = genCid(10);
            if (data.retCode == "2039") {
                md.totalCount = 0;
                md.status = 4;
                md.data = null;
            } else {
                md.totalCount = data.totalNum;
                md.data = [];
                $.each(data.data, function (_, e) {
                    //md.data.push(e);
                    md.data.push({
                        otherNo: e.anotherNm,
                        callTime: second(e.commTime),
                        rawCallTime: e.commTime,
                        callFee: e.callFee,
                        callBeginTime: e.startTime.indexOf(year) == 0 ? e.startTime : (year + "-" + e.startTime),
                        rawCallBeginTime: e.startTime,
                        callType: strip(e.commMode),
                        callAddress: strip(e.commPlac),
                        taocan: e.mealFavorable,
                        remoteType: strip(e.commType),
                    })
                })
            }
            gData.month_status.push(md);
        }

        function refreshImg() {
            $(".ds-img").attr("src", "authImg?t=" + Math.random())
        }

        //显示验证窗口
        function showVc(f) {
            callback = f;
            if (++verifyCount == 3) {
                if (confirm("登录身份失效,手机验证需要重新登录后方能继续")) {
                    session.set("lastMonth", MONTH);
                    session.set("lastOffset", offset);
                    session.set("gData", gData);
                    window.jQuery("#logout").click()
                    return;
                } else {
                    session.finish("验证次数过多", "放弃登录", 3)
                }
            }
            log("第" + verifyCount + "次认证")
            $("#ds").show()
            session.showProgress(false);
            refreshImg()
            $(".ds-vc,.ds-sms").val("")
        }

        //适用于12个以内的时间
        function getDate(offset) {
            var date = new Date;
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            if (offset) {
                month = month + offset;
                if (month < 1) {
                    month = 12 + month;
                    year--;
                }
            }
            if (month < 10) {
                month = "0" + month;
            }
            return year + "" + month;
        }

        function getRecords() {
            var url = "https://shop.10086.cn/i/v1/fee/detailbillinfojsonp/" + PHONE + "?callback=?&curCuror=1&step=1000&qryMonth=%s&billType=02&_=%s";
            if (MONTH == 0) {
                session.upload(gData)
                session.finish();
            }
            session.setProgress((TOTAL - MONTH + 2)*10);
            var date = getDate(offset);
            if(date<inNetDate){
               return session.finish("入网时间不足"+TOTAL+"个月",JSON.stringify(gData),3)
            }
            $.getJSON(url.dsFormat(date, Date.now())).done(function (data) {
                if (data.retCode == "000000" || data.retCode == "2039") {
                    --offset;
                    --MONTH;
                    parseDetail(data, date)
                    getRecords()
                } else if (data.retCode == "520001" || data.retCode == "3018") {
                    log(data.retMsg)
                    showVc(getRecords)
                } else if(data.retCode=="3035"){
                    log("超出查询范围"+date);
                    if(++beyondDateTimes==3){
                      return session.finish("连续三个月爬取超出范围"+date,JSON.stringify(gData),3) ;
                    }
                    --offset;
                    getRecords();
                }
                else {
                    session.finish(date + "爬取失败", JSON.stringify(data), 3)
                }
            })
        }

        if (!window.flex) {
            !function (e) {
                function t(a) {
                    if (i[a])return i[a].exports;
                    var n = i[a] = {exports: {}, id: a, loaded: !1};
                    return e[a].call(n.exports, n, n.exports, t), n.loaded = !0, n.exports
                }

                var i = {};
                return t.m = e, t.c = i, t.p = "", t(0)
            }([function (e, t) {
                "use strict";
                Object.defineProperty(t, "__esModule", {value: !0});
                var i = window;
                t["default"] = i.flex = function (e, t) {
                    var a = e || 100, n = t || 1, r = i.document, o = navigator.userAgent;
                    var d = o.match(/Android[\S\s]+AppleWebkit\/(\d{3})/i), l = o.match(/U3\/((\d+|\.){5,})/i);
                    var c = l && parseInt(l[1].split(".").join(""), 10) >= 80;
                    var p = navigator.appVersion.match(/(iphone|ipad|ipod)/gi), s = i.devicePixelRatio || 1;
                    p || d && d[1] > 534 || c || (s = 1);
                    var u = 1 / s, m = r.querySelector('meta[name="viewport"]');
                    m || (m = r.createElement("meta"), m.setAttribute("name", "viewport"), r.head.appendChild(m));
                    var sss = "width=device-width,user-scalable=no,initial-scale=";
                    m.setAttribute("content", sss + u + ",maximum-scale=" + u + ",minimum-scale=" + u);
                    r.documentElement.style.fontSize = a / 2 * s * n + "px"
                }, e.exports = t["default"]
            }]);
            flex(10, 1);
        }

        var style = "<style>#ds{padding:3.2rem;font-size:2.6rem;color:#555;position:fixed;width:100%;height:100%;top:0;left:0;z-index:10002;background:#fff}#ds>div{border-bottom:#efefef 1px solid;margin-top:2rem;padding-bottom:1.2rem}#ds .ds-label{padding-left:2rem;display:inline-block;text-align:left;position:relative;top:9px}#ds input{padding:1rem 0 0 4rem;border:none;display:inline-block;font-size:2.6rem;outline:0;color:#888}#ds .ds-button{display:inline-block;border:#eee 1px solid;font-size:.75em;margin-left:.5rem;padding:2rem;background:#f8f8f8;border-radius:2px}#ds .ds-submit:active{opacity:.8} #ds .ds-submit{padding:3.6rem;background:#0085d0;border-radius:1rem;color:#fff;text-align:center;margin:4rem 1rem} </style>"
        $(style).appendTo("head")
        var screenWidth = $(window).width();
        $('<div id="ds"><div><span class="ds-label">服务密码</span><input  placeholder="输入服务密码"  type="number" class="ds-sc"/></div><div><span class="ds-label">短信随机码</span><input placeholder="短信验证码" type="number"  class="ds-sms"/><div class="ds-button">点击获取</div></div><div><span class="ds-label">验证码</span><input placeholder="验证码" class="ds-vc"/><img  class="ds-img"/></div><div class="ds-submit">验证</div> </div>').appendTo("body")
        $("#ds").css({width: screenWidth - 60, height: $(window).height()}).hide().appendTo("body")
        $(".ds-label,#ds input").css("width", screenWidth * .25)
        $(".ds-img").click(refreshImg).css("width", screenWidth * .22);
        var smsDisable = false;
        $(".ds-button").click(function () {
            log("点击获取验证码按钮")
            var btn = $(this);
            if (smsDisable) return;
            smsDisable = true;
            if (Date.now() - session.get("firstSMSTime") < 1000 * 60) {
                alert("验证码请求频繁,请一分钟后重试")
            }else {
                $.getJSON("https://shop.10086.cn/i/v1/fee/detbillrandomcodejsonp/" + PHONE + "?callback=?&_=" + Date.now())
                    .done(function (data) {
                        if (data.retCode == SUCCESS) {
                            alert("获取验证码成功")
                        } else {
                            log(data)
                            confirm(data.retMsg)
                            session.finish("获取验证码失败", JSON.stringify(data), 3)
                        }
                    })
            }
            var t = 60;
            var timer = setInterval(function () {
                if (--t == 0) {
                    smsDisable = false
                    btn.text("点击获取")
                    clearInterval(timer);
                } else {
                    btn.text(t + "秒后重新获取")
                }
            }, 1000);

            //获取短信验证码
        });

        var submit = $(".ds-submit");
        submit.click(function () {
            var vc = $(".ds-vc").val();
            var sc = $(".ds-sc").val();
            var sms = $(".ds-sms").val()

            submit.css("background","#777")
            $.get("http://shop.10086.cn/i/v1/res/precheck/%s?captchaVal=%s&_=%s".dsFormat(PHONE, vc, Date.now()))
                .then(function (data) {
                    return (data.retCode == SUCCESS);
                })
                .then(function (c) {
                    if (c) {
                        log("图片验证码正确");
                        var url = "https://shop.10086.cn/i/v1/fee/detailbilltempidentjsonp/" + PHONE + "?callback=?" + "&pwdTempSerCode=%s&pwdTempRandCode=%s&captchaVal=%s&_=" + Date.now();
                        url = url.dsFormat(base64encode(sc), base64encode(sms), vc)
                       return $.getJSON(url, function (data) {
                            if (data.retCode != SUCCESS) {
                                log(data)
                                alert(data.retMsg);
                            } else {
                                session.showProgress();
                                $("#ds").hide()
                                callback && callback()
                            }
                            submit.text("验证");
                            submit.css("background","#0085d0")
                        }).fail(function (xhr) {
                            session.finish("临时身份认证失败",JSON.stringify(xhr),3)
                        })
                    } else {
                        alert("图片验证码错误");
                        log("图片验证码错误");
                        refreshImg()
                        submit.text("验证");
                        submit.css("background","#0085d0")
                    }
                })
             .fail(function (xhr) {
                log("验证失败")
                session.finish("验证失败", xhr, 3);
            })
        })


        //爬取开始

        session.log('进入爬取页');
        //检测是否需要登陆短信
        session.showProgress();
        session.setProgressMsg('认证过程大约需要1分钟，请耐心等待');
        session.setProgressMax((TOTAL + 1)*10);
        session.setProgress((TOTAL - MONTH)*10);
        function formatTime(t) {
            return t.substr(0, 4) + "-" + t.substr(4, 2) + "-" + t.substr(6, 2) + " " + t.substr(8, 2) + ":" + t.substr(10, 2) + ":" + t.substr(12)
        }

        function getUserInfo() {
            log("http://shop.10086.cn/i/v1/cust/info/%s?time=%s".dsFormat(PHONE, Date.now()))
            $.get("http://shop.10086.cn/i/v1/cust/info/%s?time=%s".dsFormat(PHONE, Date.now())).done(function (ret) {
                if (ret.retCode == SUCCESS) {
                    log("获取用户信息成功")
                    session.setProgress((TOTAL - MONTH+1)*10);
                    var data = ret.data;
                    inNetDate=data.inNetDate.substr(0,6);
                    gData.user_info = {
                        mobile: PHONE,
                        name: data.name,
                        registration_time: formatTime(data.inNetDate),
                        household_address: data.address,
                        contactNum: data.contactNum
                    }
                    showVc(getRecords)

                } else {
                    session.finish("获取用户信息失败", ret, 3)
                }
            }).fail(function (xhr) {
                session.finish("获取用户信息失败,ajax fail", JSON.stringify(xhr), 3);
            })
        }

        $.onload(function () {
            getUserInfo()
        })

    } else if (location.href.indexOf(cts) >= 0 && location.href.indexOf(cts2) >= 0) {
        //退出时重定向
        if (location.href.indexOf("&backUrl=http://shop.10086.cn/i/?f=billdetailqry") == -1) {
            location.href = loginUrl;
        }
        log('进入登陆页');
        log("移动爬取协议版");
        $("#submit_help_info,#link_info,#forget_btn,#go_home,.back_btn,#chk").hide()
        $('#chk').parent().find('label').hide()
        $('#getSMSpwd,#getPhoneSMSpwd').click(function () {
            session.set("firstSMSTime", Date.now());
        });

        $('#p_phone_account,#p_phone').val(PHONE)
         .attr({"disabled": true});
        $('#account_nav').click(function () {
            if (!$('#p_pwd').val()) {
                window.jQuery("#p_phone_account").blur();
            }

        });
        window.jQuery && window.jQuery("#p_phone").blur();
        $('#submit_bt').click(function () {
            // 防止一开始没触发
            window.jQuery("#p_phone").blur();
            //存储手机号
            if ($('#account_nav').attr('class') == 'on') {
                session.setLocal("xd_phone", $('#p_phone_account').val());
            } else {
                session.setLocal("xd_phone", $('#p_phone').val());
            }
            if ($('#p_sms').val() == '') {
                session.set("firstSMSTime", 0);
            }
        });
    }
});