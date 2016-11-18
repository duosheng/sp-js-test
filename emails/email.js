/**
 * Created by du on 16/11/17.
 */
dSpider("email",function(session,env,$) {
    //location.href="https://w.mail.qq.com/cgi-bin/loginpage?f=xhtml"
    var url = {
        "sina.com": "http://mail.sina.cn/?vt=4",
        "sina.cn": "http://mail.sina.cn/?vt=4",
        "qq.com": "https://w.mail.qq.com/cgi-bin/loginpage?f=xhtml",
        "163.com": "http://smart.mail.163.com/?dv=smart",
        "126.com": "http://smart.mail.126.com/?dv=smart"
    }
    var btn = $("button");
    var wd = $("#wd")
    var email = $("#email")
    $("input").on("input", function (e) {
        var text = email.val()
        var check = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/
        if (!wd.val().empty() && check.test(text)) {
            btn.removeAttr("disabled")
        } else {
            btn.attr("disabled", "disabled")
        }
    })
    dSpiderLocal.get("u", function (d) {
        email.val(d).trigger("input")
    })

    dSpiderLocal.get("wd", function (d) {
        wd.val(d).trigger("input")
    })
    btn.click(function () {
        var em = email.val().trim();
        var suffix = em.split("@")[1]
        if (url[suffix]) {
            log("set u start")
            dSpiderLocal.set("u", em)
            log("set wd start")
            dSpiderLocal.set("wd", wd.val())
            btn.text("加载中...").attr("disabled", "disabled");
            if (suffix == "126.com" && window._xy/*&&_xy.getExtraData().webcore=="sys"*/) {
                _xy.openWithSpecifiedCore(url[suffix], "cs");
            }
            if (suffix == "qq.com" && window._xy/*&&_xy.getExtraData().webcore=="sys"*/) {
                _xy.openWithSpecifiedCore(url[suffix], "sys");
                return;
            }
            location.href=url[suffix];
        } else {
            alert("暂不支持后缀为%s的邮箱".format(url[suffix]));
        }
    })
})