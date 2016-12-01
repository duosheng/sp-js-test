dSpiderMail("qq", function (user, wd, session, extras, $) {
    log(location.href)
    session.onNavigate=function(url){
        if(url.indexOf("://ui.ptlogin2.qq.com/cgi-bin/login?")!=-1){
            session.showProgress();
            session.autoLoadImg(false);
        }
    }
    var index = location.href.indexOf("://w.mail.qq.com/cgi-bin/loginpage")
    if (index < 7 && index > -1) {
        var url=$('.enter_mail_button_td a').attr("href");
        if(url) {
            location.replace(url);
        }
        return
    }
    index = location.href.indexOf("://ui.ptlogin2.qq.com/cgi-bin/login?")
    if (index < 7 && index > -1) {
        $("#u").val(user).attr("disabled", "disabled").css("color", "#777")
        session.showProgress(false);
        return
    }

    log("x1" + location.href);
    if (location.href.indexOf("w.mail.qq.com/cgi-bin/today?sid=") != -1) {
        var url = "https://w.mail.qq.com/cgi-bin/mobile?sid=$$sid&t=phone#today"
        url = url.replace(/\$\$sid/g, qs['sid'])
        log("x2" + url)
        location.href=url;
    }

    if (location.href.indexOf("w.mail.qq.com/cgi-bin/mobile?sid=") != -1) {
        session.showProgress();
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

                            var html
                            var name;
                            var subj;
                            var date;
                            var addr;
                            var content={};

                            if (d.mls.length > 1) {
                                html = d.mls[1].content.body || d.mls[1].content.fold[0][1] || "无内容";
                                if(d.mls[1].content.fold) {
                                    content.html = d.mls[1].content.fold[0][1];
                                    name=d.mls[1].inf.from.name;
                                    subj=d.mls[1].inf.subj;
                                    date=d.mls[1].inf.date;
                                    addr=d.mls[1].inf.from.addr;
                                }else if(d.mls[1].content.body){
                                    content.html = d.mls[1].content.body;
                                    name=d.mls[1].inf.from.name;
                                    subj=d.mls[1].inf.subj;
                                    date=d.mls[1].inf.date;
                                    addr=d.mls[1].inf.from.addr;
                                }else {
                                    name="xx"
                                }
                            } else {
                                html = d.mls[0].content.body || "无内容"
                                name=d.mls[0].inf.from.name;
                                subj=d.mls[0].inf.subj;
                                date=d.mls[0].inf.date;
                                addr=d.mls[0].inf.from.addr;
                            }
                            content.name=name;
                            content.subject=subj;
                            content.date=date;
                            content.sender=addr;
                            content.html=html;
                            session.upload(content)
                            //session.upload(html)
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




