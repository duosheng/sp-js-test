+function ($) {  //jQuery namespace
    $(function () {
        var session = new DataSession("qqmail");
        var wd = encodeURIComponent("招商银行")

        var index = location.href.indexOf("://w.mail.qq.com/cgi-bin/loginpage")
        if (index < 7 && index > -1) {
            location.href = $('.enter_mail_button_td a').attr('href');
            return
        }

        index = location.href.indexOf("://ui.ptlogin2.qq.com/cgi-bin/login?")
        if (index < 7 && index > -1) {
            $("#auto_login").hide()
            $("#u").val(sessionGlobal.get("u"))
            $("#remember").attr("disabled","disabled").attr("checked",false);
            //setTimeout(function(){session.showProgress(false)},1000);
            return
        }

        log("x1" + location.href);
        if (location.href.indexOf(wd) == -1
            && (location.href.indexOf("w.mail.qq.com/cgi-bin/mobile?sid=") != -1||location.href.indexOf("w.mail.qq.com/cgi-bin/today?sid=")!=-1)) {
            //session.showProgress();
            var url = "https://w.mail.qq.com/cgi-bin/mobile?sid=$$sid&t=phone#list,search_$$w_all%5F%5F"
            url = url.replace(/\$\$sid/g, qs['sid']).replace(/\$\$w/g, wd);
            log("x2" + url)
            location.href = url;
        }

        var  cc=0
        if (location.href.indexOf(wd) != -1 && location.href.indexOf("w.mail.qq.com/cgi-bin/mobile?sid=") != -1) {
            waitDomAvailable("#listContent", function (list,waitTime) {
                log("waitTime:"+waitTime);
                var mo = Observe(list[0], {'childList': true, 'subtree': true}, function () {
                    var loadmore = $('.maillist_listItem_loadMore');
                    if (loadmore[0]) {
                        loadmore.click();
                    } else {  //列表加载结束
                        mo.disconnect();
                        //网页打开
                        log("list load end")
                        var content=$("#ct").children().first();
                        var mailContentExist=$("#mailContent")[0];
                        Observe(content[0],{'childList': true, 'subtree': true},function(records){
                            records.forEach(function (record) {
                                //是否是正文区域
                                log(record.target.outerHTML)
                                log(content.css("display") != "none")
                                log(cc++)
                                if ($(record.target).attr("id") != "mailContent") return;
                                if (content.css("display") != "none") {
                                    //上传邮件
                                    session.upload(content.find("#mailContent").text());
                                    session.setProgress(++curIndex)
                                    log("ccc"+curIndex)
                                    if (curIndex < mailCounts) {
                                        //log(back)
                                        setTimeout(function () {
                                            var index = curIndex;
                                            //返回
                                            $('#mailNav .qm_toolbar_left a ').click()
                                            //打开下一封邮件
                                            mailList.eq(index).find("div").click();

                                        }, 200);
                                    } else {
                                        session.toString();
                                        session.finish()
                                    }
                                }
                            })
                        })

                        log("open")
                        var mailCounts = $(".readmail_list>div[un=mail]").length;
                        var curIndex = 0;
                        var mailList = $(".readmail_list>div", list);
                        log("count:" + mailCounts)
                        if (mailCounts > 0) {
                            session.setProgressMax(mailCounts)
                            mailList.eq(0).find("div").click()

                        } else {
                            session.finish();
                        }
                    }
                });

            })
        }
    })
}(dQuery)



