window.qs = [];
var s = decodeURI(location.search.substr(1));
var a = s.split('&');
for (var b = 0; b < a.length; ++b) {
    var temp = a[b].split('=');
    qs[temp[0]] = temp[1] ? temp[1] : null;
}
String.prototype.format = function () {
    var args = Array.prototype.slice.call(arguments);
    var count = 0;
    return this.replace(/%s/g, function (s, i) {
        return args[count++];
    });
};
function noop(){}
$=dQuery;
session={
    setProgressMax:noop,
    setProgress:noop,
    upload:function(s){
        console.log(s)
    },
    finish:function(){
       console.log("finish")
    }
}
var wd="招商银行"
        var timeInterval = 300;
        var sid = qs["sid"]
        $.get("mail_list?ef=js&sid=" + sid, {
                t: "mobile_data.json",
                s: "list",
                cursor: "max",
                cursorcount: 5,
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
                            //log(d)
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





