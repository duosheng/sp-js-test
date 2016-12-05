/**
 * Created by du on 16/8/22.
 */

dSpiderMail("sina", function (user,wd, session, extras, $) {

    $.fn.trigger_=function(e){
        var evt = document.createEvent("MouseEvents");
        evt.initEvent(e, false, false);
        this[0].dispatchEvent(evt);
        return this;
    }

    var index = location.href.indexOf("://mail.sina.cn/?")
    if (index < 7 && index > -1) {
        //alert(JSON.stringify(DataSession.getExtraData()))
        $("#mailFnCoverAndroid,#mailFnCoveriOS,#btnSkipCoverAndroid").hide()
        $("input[name=username]").val(user).attr("disabled","disabled").css("color","#777")
        $("input[name=savelogin]").val(0).parents("li").add("changeUrl>:last").hide()
        return
    }
    session.showProgress();
    if (location.href.indexOf("mobile/index") != -1) {
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
                        session.upload(o.data[25])
                    })
                    .fail(function(jqXHR){
                        session.finish("ajax error",JSON.stringify(jqXHR),1)
                        log(JSON.stringify(jqXHR))
                    })
                    .always(function(){
                      session.setProgress(++cur)
                      if(cur==count){
                          session.finish()
                      }
                    })


            })

        }).fail(function(jqXHR){
            session.finish("ajax error",JSON.stringify(jqXHR),1)
            log(JSON.stringify(jqXHR))
        });
    }

})
