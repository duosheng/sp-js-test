/**
 * Created by du on 16/11/21.
 */
var sessionKey=dQuery(".index_block h1").text()
dSpider(sessionKey, function(session,env,$){
    if(location.href.indexOf("/book/")!=-1){
        $(".more a").text("爬取本书").css("background","#1ca72b");
    }else if(/.+html\/\d+\/\d+\/$/.test(location.href)) {
        log(sessionKey)
        var list = $(".chapter li a");
        session.showProgress();
        session.setProgressMax(list.length);
        var curIndex = 0

        function getText() {
            var e = list.eq(curIndex);
            $.get(e.attr("href")).done(function (data) {
                var text = e.text() + "\r\n";
                text += $(data).find("#txt").text()+"\r\n"
                session.upload(text)

            }).always(function () {
                if (++curIndex < list.length) {
                    session.setProgress(curIndex);
                    session.setProgressMsg("正在爬取《"+sessionKey+"》 "+e.text())
                    getText();
                    log(curIndex, list.length)
                } else {
                    session.setProgress(curIndex);
                    session.finish();
                }
            })
        }
        getText()
    }
})
