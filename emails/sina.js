dSpider("sinaMail", function (session, env, $) {
    $.fn.trigger_=function(e){
        var evt = document.createEvent("MouseEvents");
        evt.initEvent(e, false, false);
        this[0].dispatchEvent(evt);
        return this;
    }
    var index = location.href.indexOf("://mail.sina.cn/?")
    if (index < 7 && index > -1) {
        $("#mailFnCoverAndroid,#mailFnCoveriOS,#btnSkipCoverAndroid").hide()
        $("input[name=savelogin]").val(0).parents("li").add("changeUrl>:last").hide()
        $("input[name=username]").val(session.getLocal("username"));
        $("input[name=passwd]").val(session.getLocal("pwd"));
        session.showProgress(false);
        $(".btn-submit").click(function () {
            if (!session.getArguments().wd) {
                confirm("缺少关键字")
                session.finish("缺少关键字")
            }
            session.setLocal("username", $("input[name=username]").val());
            session.setLocal("pwd", $("input[name=passwd]").val());
        })
        return
    }
    session.showProgress();
    if (location.href.indexOf("mobile/index") != -1) {
        var wd=session.getArguments().wd;
        session.setProgressMsg("正在拉取邮件列表...")
        $.post("../wa.php?a=findmail",{
            keyword:wd,
            order:"htime",
            sorttype:"desc",
            start:0,
            length:40,
        }).done(function(d){
                var o = JSON.parse(d);
                var count=o.data.maillist.length;
                if(count==0){
                    session.finish();
                    return
                }
                session.setProgressMax(count);
                var cur=0;
            $.each(o.data.maillist,function(i,e){
                $.post("../wa.php?a=readmail",{mid: e[0],fid:"new"})
                    .done(function(d){
                        var o = JSON.parse(d);
                        var json = {
                            sender:o.data[1],
                            subject: o.data[3],
                            date: o.data[4],
                            html: o.data[25]
                        }
                        session.upload(json)
                    })
                    .fail(function(jqXHR){
                        session.finish("ajax error",JSON.stringify(jqXHR))
                    })
                    .always(function(){
                       ++cur
                      session.setProgress(cur)
                      session.setProgressMsg("正在爬取第"+cur+"封邮件...")
                      if(cur==count){
                          session.finish()
                      }
                    })
            })

        }).fail(function(jqXHR){
            session.finish("ajax error",JSON.stringify(jqXHR))
        });
    }

})
