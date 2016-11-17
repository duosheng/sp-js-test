dSpider("unicom", function(session,env,$){
   log(session,env,$)
    function parseThxd(msg) {
        $(msg).find("tr.tips_dial").each(function() {
            var tel = $(this).find("label.telphone").text();
            var duration = $(this).find("td:eq(1) p").first().text();
            var time = $(this).find("p.time:eq(1)").text().replace(/[\n|\s]/g, "").replace();
            var datil = ($(this).find(".call_out").length == 1) ? "呼出" : "呼入";
            var line = "{time：" + time + ", telNum：" + tel + ", duration：" + duration + ", type:" + datil + "}";
            session.upload(line)
            log(line)
        })
    }

    function getThxdByAjax(year, month) {
        log("开始爬取【" + month + "】月份通话详单：")
        session.upload("开始爬取【" + month + "】月份通话详单：")
        $.ajax({
            url: '/mobileService/query/getPhoneByDetailContent.htm',
            type: 'post',
            data: 't=' + new Date().getTime() + '&YYYY=' + year + '&MM=' + month + '&DD=&queryMonthAndDay=month&menuId=',
            dataType: 'html',
            async: true,
            cache: false,
            success: function(msg) {
                parseThxd(msg);
                $('#pageNew').html(msg);
                if (endrow < totalrow) {
                    loadMore();
                } else {
                    spide();
                }
            },
            error: function(xhr, msg){
                session.upload("爬取【" + month + "】月份通话详单失败！")
                log("爬取【" + month + "】月份通话详单失败！")
                spide();
            }
        });
    }

    function loadMore() {
        log("加载更多...")
        var _this = $(this);
        var beginrow = endrow;
        endrow = beginrow + perrow;
        if (endrow > totalrow) {
            endrow = totalrow;
        }
        _this.html('<img src="http://img.client.10010.com/mobileService/view/client/images/loading.gif" width="16">');
        var href = '/mobileService/view/client/query/xdcx/thxd_more_list.jsp?1=1&t=' + getrandom();
        var params = '&beginrow=' + beginrow + '&endrow=' + endrow + '&pagenum=' + (pagenum + 1);
        $('.moredetail' + pagenum).load(href + params, function(msg) {
            parseThxd(msg);
            spide();
        });
    }

    function spide() {
        if (monthArr.length > 0) {
            session.setProgress(MAX - monthArr.length)
            var monthObj = monthArr.shift();
            getThxdByAjax(monthObj.year, monthObj.month);
        } else {
            log("爬取完毕------------------------")
            session.finish()
            session.showProgress(false)
        }
    }

    var date = new Date();
    var curMonth = date.getMonth() + 1;
    var curYear = date.getFullYear();
    var monthArr = []
    for (var i = 0; i < 6; i++) {
        var month = curMonth - i;
        var year = curYear;
        if (month < 1) {
            month += 12;
            year -= 1;
        }
        if (month < 10) {
            month = "0" + month;
        }
        monthArr.push({ "year": year, "month": month });
    }
    var MAX = monthArr.length;
    if(window.location.href.indexOf('query/getPhoneByDetailTip.htm') != -1){
        session.showProgress()
        session.setProgressMax(MAX)
        spide()
    }
})