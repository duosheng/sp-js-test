dSpider("alipay", function(session, env, $) {
    log("current page url: " + location.href);
    var userInfoKey = 'userInfoKey'; //账号数据key
    var monthArray = [];
    var uploadMonArray = []; //上传的月份数据
    var monCount = 3; //需要爬取的月份
    var sumCount = monCount + 1;
    var now = new Date();

    // 增加判断当前页面是否是登录页
    if ($("#J-loginMethod-tabs").length && $("#J-loginMethod-tabs").length > 0) {
        session.setStartUrl();
    }

    //填充用户名密码
    if (window.location.href.indexOf('/login/index.htm') != -1) {
        session.showProgress(false);
        hideElement();
        if (session.getLocal("username") != undefined && session.getLocal("pwd") != undefined) {
            $("#J-input-user").val(session.getLocal("username"));
            $("#password_input").val(session.getLocal("pwd"));
        }

        $("#J-login-btn")[0].onclick = function() {
            session.setLocal("username", $("#J-input-user").val());
            session.setLocal("pwd", $("#password_input").val());
        };
    }

    //用户信息页面
    if (window.location.href.indexOf('/account/index.htm') != -1) {
        session.showProgress(true);
        session.setProgressMax(100);
        session.setProgress(0);

        var delay = 200; //延迟200ms
        setTimeout(function() {
            fetchUserInfo();
            jumptoBankPage();
            session.setProgress(100.0 / (sumCount));
        }, delay);
    }

    if (window.location.href.indexOf('/asset/bankList.htm') != -1) {
        fetchBankList();
    }

    if (window.location.href.indexOf('/record/advanced.htm') != -1) {
        switchVersion();
    }

    if (window.location.href.indexOf('/record/standard.htm') != -1) {
        spideOrder();
    }

    //开始爬取交易记录
    function spideOrder() {
        var endDate = formateDate(now);
        now.setMonth(now.getMonth() - 1);
        var beginDate = formateDate(now);
        log('--------------start spideOrder------------' + 'beginDate:' + beginDate + '|endDate:' + endDate)
        fetchOrderListBy(1, beginDate, endDate);
    }

    //获取交易记录 pageNum:第几页  beginDate:开始时间  endDate:结束时间 //TODO:进度条还可以优化
    function fetchOrderListBy(pageNum, beginDate, endDate) {
        log('---------fetchOrderListBy--------------')
        log('---------start spide order:【' + pageNum + '】page-------');
        var daterange = 'customDate';
        var beginTime = '00:00';
        var endTime = '24:00';

        $.ajax({
            url: 'https://consumeprod.alipay.com/record/standard.htm',
            type: 'post',
            data: 'pageNum=' + pageNum + '&beginDate=' + beginDate + '&endDate=' + endDate + '&dateRange=' + daterange + '&beginTime=' + beginTime + '&endTime=' + endTime,
            dataType: 'html',
            async: true,
            cache: false,
            success: function(data) {
                var res = $(data).find('#tradeRecordsIndex');
                if ($(res).find('tbody:has(td)').length == 0) { //到达最后一页
                    log('beginDate:' + beginDate + '|endDate:' + endDate + '|uploadMonArray:' + uploadMonArray);

                    uploadMonArray = uploadMonArray.concat([{
                        begin_date: beginDate,
                        end_date: endDate,
                        begin_time: beginTime,
                        end_time: endTime,
                        data: monthArray,
                    }]);

                    monCount = monCount - 1;
                    session.setProgress(100.0 * (sumCount - monCount) / sumCount);

                    if (monCount == 0) { //爬取结束
                        log('----------------spideOrder finish!!!----------------- beginDate:' + beginDate + '|endDate:' + endDate + ' && monthArray:' + monthArray);
                        var uploadData = {
                            order_info: uploadMonArray
                        };
                        session.upload(uploadData);
                        finish();
                    } else { //爬取一个月的数据结束
                        log('----------------spideOrder single_month over!!!----------------- beginDate:' + beginDate + '|endDate:' + endDate + ' && monthArray:' + monthArray);
                        spideOrder();

                    }
                    monthArray = []; //上传后清空

                } else {
                    var offset = 0;
                    var data = $(res).find('tbody').find('tr:has(td)').map(function(index) {
                        if ($(this).find('td.title.td-refund')[0] !== undefined) {
                            offset++;
                            return { //TODO：退款的数据结构不一样
                                name: formateStr($(this).find('td.title.td-refund').text()),
                                time: '无',
                                amount: formateStr($(this).find('td.amount.td-refund > p').text()),
                                tradeNo: '无',
                            };
                        }
                        var i = index + 1 - offset;
                        return { //拼接上传数据
                            name: formateStr($(this).find('p.consume-title').text()),
                            time: formateStr($(this).find('td.time > p:nth-child(1)').text()) + '   ' + formateStr($(this).find('td.time > p:nth-child(2)').text()),
                            amount: formateStr($(this).find('span.amount-pay').text()),
                            tradeNo: formateStr($(this).find('#J-tradeNo-' + i).attr('title')),
                        }
                    }).get();

                    monthArray = monthArray.concat(data);
                    fetchOrderListBy(pageNum + 1, beginDate, endDate);
                }

            },
            error: function(xhr, data) {
                log("-----------spider【" + pageNum + "】page error!!!");
                finish();
            }
        });
    }

    //获取用户信息
    function fetchUserInfo() {
        log('--------------fetchUserInfo-----------------------')
        var userInfo = new Object();
        userInfo.name = $("#username").text();
        userInfo.certId = $('#account-main > div > table > tbody > tr:nth-child(1) > td:nth-child(2) > span:nth-child(3)').text();
        userInfo.bVerify = $('#account-main > div > table > tbody > tr:nth-child(1) > td:nth-child(2) > span:nth-child(4)').text();
        userInfo.mail = $('#account-main > div > table > tbody > tr:nth-child(2) > td:nth-child(2) > span').text();
        userInfo.phone = $('#account-main > div > table > tbody > tr:nth-child(3) > td:nth-child(2) > span').text();
        userInfo.taoId = $('#account-main > div > table > tbody > tr:nth-child(4) > td:nth-child(2)').text();
        userInfo.regTime = $('#account-main > div > table > tbody > tr:nth-child(7) > td:nth-child(2)').text();
        userInfo.alipayId = window.GLOBAL_NAV_DATA.userId;

        session.set(userInfoKey, userInfo);
    }

    //获取银行卡列表
    function fetchBankList() {
        log('--------------fetchBankList-----------------------')
        $.get("https://zht.alipay.com/asset/bindQuery.json?_input_charset=utf-8&providerType=BANK", function(result) {
            var data = result.results;
            var banklistArray = [];
            data.forEach(function(item) {
                console.log(item);
                banklistArray.push(new BankCard(item['providerName'], item['providerUserName'], item['cardTypeName']));
            }, data);

            var userInfo = session.get(userInfoKey);
            userInfo.bankCard = banklistArray;
            session.upload({
                user_info: userInfo
            });
            log(userInfo);
            jumptoOrderListPage();
        });
    }

    //跳到交易记录
    function jumptoBankPage() {
        log('----------jumptoBankPage-----------')
        location.href = "https://zht.alipay.com/asset/bankList.htm";
    }
    //跳到交易记录
    function jumptoOrderListPage() {
        log('----------jumptoOrderListPage-----------')
        location.href = "https://consumeprod.alipay.com/record/standard.htm";
    }

    //切换交易记录显示版本（标准、高级）
    function switchVersion() {
        log('--------------switchVersion------------')
        $('div.link > a')[0].click(function() {
            location.href = $('#' + $(this).attr('rel')).attr('href');
        });
    }

    //结束爬取
    function finish() {
        log("---------------spider end success------------------------");
        session.setProgress(100);
        session.finish();
    }

    //隐藏其他与登陆无关的元素
    function hideElement() {
        $('#J-authcenter > div.authcenter-head').hide();
        $('#J-authcenter-foot').hide();
        $('#J-submit > p').hide();
        $('#J-password > p').hide();
        $('#J-qrcode > div.qrcode-footer > p.qrcode-footer-help').hide();
        $('#J-authcenter > div.authcenter-body.fn-clear > h1 > a')[0].removeAttribute('href')
        $('#J-errorBox > span > a').removeAttr("href");
    }

    //转成标准格式字符串
    function formateDate(date) {
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        return year + '.' + month + '.' + day;
    }

    //去除多余转义字符,前后空格
    function formateStr(s) {
        if (!isEmpty(s)) {
            var ss = s.replace(/(^\s*)|(\s*$)/g, '');
            return ss.replace(/[\'\"\\\/\b\f\n\r\t]/g, '');
        }
        return '';
    }

    function isEmpty(str) {
        return (!str || 0 === str.length);
    }

    //用户信息
    function userInfo(name, mail, phone, taoId, regTime, certId, bVerify, bankCard, alipayId) {
        this.name = name; //真实名字
        this.mail = mail; //邮箱
        this.phone = phone; //手机号
        this.taoId = taoId; //淘宝id
        this.regTime = regTime; //注册时间
        this.certId = certId; //身份证
        this.bVerify = bVerify; //是否认证
        this.bankCard = bankCard; //绑定银行卡个数
        this.alipayId = alipayId; //支付宝ID
    }

    //交易记录
    function OrderInfo(name, time, amount, tradeNo) {
        this.name = name; //交易名字
        this.time = time; //交易时间
        this.amount = amount; //交易金额
        this.tradeNo = tradeNo; //流水号
    }

    //银行卡
    function BankCard(name, cardNum4, cardType) {
        this.name = name; //银行名字
        this.cardNum4 = cardNum4; //尾号
        this.cardType = cardType; //卡类型
    }

})
