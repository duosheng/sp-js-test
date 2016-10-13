dSpiderMail("qq", function (user, wd, session, extras, $) {
    var index = location.href.indexOf("://w.mail.qq.com/cgi-bin/loginpage")
    if (index < 7 && index > -1) {
        location.replace($('.enter_mail_button_td a').attr('href'));
        return
    }
    index = location.href.indexOf("://ui.ptlogin2.qq.com/cgi-bin/login?")
    if (index < 7 && index > -1) {
        $("#auto_login").hide()
        $("#u").val(user).attr("disabled", "disabled").css("color", "#777")
        $("#del_touch").remove();
        $("#remember").attr("disabled", "disabled").attr("checked", false);
        return
    }
    session.showProgress();
    log("x1" + location.href);
    if (location.href.indexOf("w.mail.qq.com/cgi-bin/today?sid=") != -1) {
        //session.showProgress();
        var url = "https://w.mail.qq.com/cgi-bin/mobile?sid=$$sid&t=phone#today"
        url = url.replace(/\$\$sid/g, qs['sid'])
        log("x2" + url)
        location.replace(url);
    }

    log(location.href)
    if (location.href.indexOf("w.mail.qq.com/cgi-bin/mobile?sid=") != -1) {
        var timeInterval = 300;
        var sid = qs["sid"]
        $.get("mail_list?ef=js&sid=" + sid, {
                t: "mobile_data.json",
                s: "list",
                cursor: "max",
                cursorcount: 20,
                cursorsearch: 1,
                folderid: "all",
                //receiver:wd,
                sender: wd,
                subject: wd,
                keyword: wd,
                combinetype: "or",
                device: "android",
                app: "phone",
                ver: "app"
            })
            .done(function (d) {
                d = eval("(%s)".format(d));
                if (!d.mls) {
                    session.finish();
                    return;
                }
                var mls = d.mls;
                var count = 0
                console.log(mls.length)
                session.setProgressMax(mls.length);
                function getData() {
                    if (count == mls.length) {
                        //结束
                        log("end")
                        session.setProgress(count)
                        session.finish()
                        return;
                    }
                    session.setProgress(count)
                    //log(JSON.stringify(mls[36]));
                    // session.finish()
                    //console.log(mls[count++])
                    $.get("readmail?ef=js&sid=" + sid, {
                        t: "mobile_data.json",
                        s: "read",
                        showreplyhead: 1,
                        disptype: "html",
                        mailid: mls[count++].inf.id
                    }).done(function (d) {
                            log(d)
                            var d = eval("(%s)".format(d));
                            if (d.errcode == "-15") {
                                count--;
                                if (timeInterval <= 2000)
                                    timeInterval += 200;
                                return
                            }
                            var html;
                            if (d.mls.length > 1) {
                                html = d.mls[1].content.body || d.mls[1].content.fold[0][1] || "无内容";
                                //if(d.mls[1].content.fold) {
                                //    html = d.mls[1].content.fold[0][1];
                                //}else if(d.mls[1].content.body){
                                //    html = d.mls[1].content.body;
                                //}
                            } else {
                                html = d.mls[0].content.body || "无内容"
                            }
                            session.upload(html)
                            //console.log(html)

                        })
                        .always(function (t) {
                            setTimeout(getData, timeInterval);
                        })
                        .fail(function (s) {
                            log("error" + JSON.stringify(s));
                        })
                }

                setTimeout(getData, timeInterval);
            })
            .fail(function (jqXHR) {
                session.finish("ajax error", JSON.stringify(jqXHR), 1)
                log(JSON.stringify(jqXHR))
            })

    }
})




