dSpider("126", function ( session, env, $) {
    function formatParams(data) {
        var arr = [];
        for (var name in data) {
            arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
        }
        return arr;
    }

    function ajax(options) {
        options = options || {};
        options.type = (options.type || "GET").toUpperCase();
        options.dataType = options.dataType || "json";
        var params = formatParams(options.data);
        options.success=safeCallback(options.success)
        options.fail=safeCallback(options.fail)
        options.complete=safeCallback(options.complete)
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                var status = xhr.status;
                if (status >= 200 && status < 300) {
                    options.success && options.success(xhr.responseText, xhr.responseXML);
                } else if (status != 0) {
                    options.fail && options.fail(JSON.stringify(xhr));
                    log(xhr.readyState + xhr.responseText)
                } else {
                    session.finish("网络错误", "", 1)
                }
                options.complete();
            }
        }
        var postParams = null;
        if (options.type == "GET") {
            xhr.open("GET", options.url + "?" + params, true);
        } else if (options.type == "POST") {
            xhr.open("POST", options.url, true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            postParams = params;
        }
        xhr.setRequestHeader("accept", "application/json, text/javascript, */*; q=0.01");
        xhr.send(postParams);
        return xhr;
    }


    var index = location.href.indexOf("://smart.mail.1")
    if (index < 7 && index > -1) {
        $("#username,#user").val(session.getLocal("username"));
        $("#password").val(session.getLocal("pwd"));
        $(".loginBtn").click(function(){
            if(!session.getArguments().wd){
                confirm("缺少关键字")
                session.finish("缺少关键字")
            }
            session.setLocal("username",$("#username,#user").val())
            session.setLocal("pwd",$("#password").val())
        })
        $("#pop_mailEntry").click();
        $("#chkAutoLogin").val(0).attr("disabled", "disabled")
        return
    }


    session.showProgress();
    if (location.href.indexOf("main.jsp") != -1) {
        var wd=session.getArguments().wd;
        var search = '<?xml version="1.0"?>\
               <object>\
               <string name="order">date</string>\
                <boolean name="desc">true</boolean>\
                <string name="operator">or</string>\
                <array name="condictions">\
                <object>\
                <string name="field">from</string>\
                <string name="operator">contains</string>\
                <string name="operand">%s</string>\
                <boolean name="ignoreCase">true</boolean>\
                </object>\
                <object>\
                <string name="field">subject</string>\
                <string name="operator">contains</string>\
                <string name="operand">%s</string>\
                <boolean name="ignoreCase">true</boolean>\
                </object>\
                </array>\
                <int name="windowSize">50</int>\
                </object>';

        var id = '<?xml version="1.0"?>\
                <object>\
                <string name="id">%s</string>\
                <string name="mode">both</string>\
                <boolean name="autoName">true</boolean>\
                <boolean name="supportTNEF">true</boolean>\
                <boolean name="filterStylesheets">true</boolean>\
                <boolean name="returnImageInfo">true</boolean>\
                </object>'


        var sid = qs["sid"]
        log(wd+sid)
        ajax({
            url: "s?sid=" + sid + "&func=mbox:searchMessages",
            data: {'var': search.replace(/%s/g, wd)}, type: "post",
            success: function (data) {
                var d = eval("(" + data + ")");
                d = $.map(d.var, function (e) {
                    if (e instanceof Object) return e.id;
                })
                var count = d.length;
                if (count == 0) {
                    session.finish();
                    return;
                }
                var start = 0;
                session.setProgressMax(count)
                $.each(d, function (i, e) {
                    ajax({
                        url: "s?sid=" + sid + "&func=mbox:readMessage&l=read&action=read",
                        data: {var: id.replace(/%s/g, e)}, type: "post",
                        success: function (data) {
                            log(data)
                            var c = eval("(" + data + ")");
                            var content;
                            try {
                                content=c.var.html.content
                            } catch (e) {
                                content=c.var.text.content
                            }
                            var json={
                                sender: c.var.from[0],
                                subject: c.var.subject,
                                date: c.var.sentDate,
                                html:content
                            }
                           session.upload(json)
                        },
                        complete: function () {
                            console.log(++start)
                            session.setProgress(start)
                            if (start == count) {
                                session.finish();
                                log(session.string())
                            }
                        }
                    })
                })

            },
            fail:function(msg){
                session.finish("ajax error",msg,1);
            }
        });
    }
});
