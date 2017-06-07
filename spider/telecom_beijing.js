dSpider("taobao", 60 * 10, function (session, env, $) {
    window.alert = function(){
        return;
    };
    //打开登录页
    if (window.location.href.indexOf("/login") !== -1) {
        session.setStartUrl();
        session.showProgress(false);
        session.autoLoadImg(false);
        //隐藏不必要的部分 暂时先隐藏掉这些
        $(".header").hide();
        $(".footer").hide();
        $(".experienceFeedback").hide();//体验反馈
        $(".signUpFree").hide();//免费注册
        $(".imgBox").hide();//左边的图片
        $(".loginBoxTop").hide();
        $(".loginBoxBottom").hide();
        $(".QRCodeloginSuperscrip").hide();
        $(".loginMainContent middle").hide();

        $(".contentMain").css("width", "400px");
        $(".loginBox").css("width", "400px");
        $(".loginMainContent").css("width", "400px");
        $(".loginMainContent").css("background", "url() no-repeat");
        $(".loginBoxMain").css("padding", "10px 40px 0 40px");

        //对本地保存用户名 有的话自动填写
        if (session.getLocal("userName") != undefined && session.getLocal("passWord") != undefined) {
            $("#txtAccount").val(session.getLocal("userName"));
        }

        //针对目标按钮的点击事件 保存用户名和密码
        $("#loginbtn").click(function () {
            session.setLocal("userName", $("#txtAccount").val());
        });
    }

    //跳转到了首页
    if (window.location.href.indexOf("http://www.189.cn/") !== -1 && window.location.href.length <= "http://www.189.cn/bj/".length) {
        //跳转到我的页面
        session.showProgress(true);
        session.setProgressMax(100);
        session.setProgress(10);

        window.location.href = "http://www.189.cn/dqmh/my189/initMy189home.do?fastcode=01390637";
    }

    //我的页面
    if(window.location.href.indexOf("initMy189home.do") !== -1) {
        log("进入我的页面！");
        var iFrame = $("#bodyIframe")[0];
        if (window.location.href.indexOf("fastcode=01390637") !== -1) {//爬取账单信息
            iFrame.onload = function(){
                log("账户页面加载完毕！");
                session.setProgress(20);
                window.location.href = "http://bj.189.cn/iframe/feequery/billQuery.action";
            };
        }else if(window.location.href.indexOf("fastcode=10000181") !== -1) {//爬取客户信息
            iFrame.onload = function(){
                log("客户资料修改页面加载完毕！");
                session.setProgress(60);
                window.location.href = "http://bj.189.cn/iframe/custservice/modifyUserInfo.action?indexPage=INDEX3";
            };
        }else if (window.location.href.indexOf("fastcode=01390638") !== -1) { //爬取通信详单
            iFrame.onload = function () {
                log("通信详单页面加载完毕");
                session.setProgress(70);
                window.location.href = "http://bj.189.cn/iframe/feequery/detailBillIndex.action";
            };
        }
    }

    //账单查询结果页
    if (window.location.href.indexOf("billQuery.action") !== -1) {
        log("进入查询结果页！");
        var $rows = $("#userBill > tr");
        var uploadArr = [];
        var jumpUrlArr = [];
        for (var i=0;i<$rows.length;i++){
            var time = $rows.eq(i).children().eq(0).text();
            var cost = $rows.eq(i).children().eq(1).text();
            var detailInfo = {};
            uploadArr.push(new BillInfo(time,cost,detailInfo));
            var jumpUrl = $rows.eq(i).children().eq(2).children().eq(0).attr("href").trim();
            jumpUrlArr.push(jumpUrl);
        }
        if (uploadArr.length > 0) {
            session.set("uploadArr",uploadArr);
            session.set("jumpUrlArr",jumpUrlArr);
            session.set("progress",0);
            log("开始爬取账单详情");
            searchData();
        }
    }

    //账单详情页
    if (window.location.href.indexOf("billInfoQuery.action") !== -1){
        var $rows = $("body > table > tbody > tr:nth-child(1) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td > table > tbody").children();
        var billDetailInfo = {};
        for(var i=0;i<$rows.length;i++) {
            var costType = $rows.eq(i).children().eq(0).text();//费用类型
            if(costType == "主套餐基本费") {
                billDetailInfo.packageBaseCost = $rows.eq(i).children().eq(1).text();
            }else if(costType == "数据可选包"){
                billDetailInfo.optionDataPackage = $rows.eq(i).children().eq(1).text();
            }else if(costType == "本地通话费") {
                billDetailInfo.localCallCost = $rows.eq(i).children().eq(1).text();
            }else if(costType == "国内长途费") {
                billDetailInfo.domesticLongDistanceCallCost = $rows.eq(i).children().eq(1).text();
            }else if(costType == "本地上网使用费") {
                billDetailInfo.localInternetCost = $rows.eq(i).children().eq(1).text();
            }else if(costType == "短信通信费") {
                billDetailInfo.smsCost = $rows.eq(i).children().eq(1).text();
            }else if(costType == "彩信通信费") {
                billDetailInfo.mmsCost = $rows.eq(i).children().eq(1).text();
            }
        }
        var uploadArr = session.get("uploadArr");
        var progress = session.get("progress");
        uploadArr[progress].detailInfo = billDetailInfo;

        session.set("uploadArr",uploadArr);
        session.set("progress",++progress);
        searchData();
    }

    function searchData(){
        var uploadArr = session.get("uploadArr");
        var progress = session.get("progress");
        var jumpUrlArr = session.get("jumpUrlArr");
        if (progress < uploadArr.length){//未爬取完
            log(uploadArr[progress].jumpUrl);
            session.setProgress(20 + (uploadArr.length - progress)/uploadArr.length*30);
            window.location.href = jumpUrlArr[progress];
        }else{
            log("输出账单信息....");
            log(uploadArr);
            log("账单爬取终了！");
            window.location.href = "http://www.189.cn/dqmh/my189/initMy189home.do?fastcode=10000181";
        }
    }

    //客户信息结果页
    if (window.location.href.indexOf("modifyUserInfo.action") !== -1){
        var $ths = $("tbody").find("th");//名称字段
        var $tds = $("tbody").find("td");//值字段
        var user_info = {};
        for(var i=0;i<$ths.length;i++) {
            if($ths.eq(i).text() == "客户名称："){//客户名称 不可修改
                user_info.name = $tds.eq(i).text();
            }else if($ths.eq(i).text() == "客户类型："){//客户类型 不可修改
                user_info.clientType = $tds.eq(i).text();
            }else if($ths.eq(i).text() == "联系电话1："){//联系电话1 可修改（注：有联系电话2？）
                user_info_contactNum = $tds.eq(i).find("span").text();
            }else if($ths.eq(i).text() == "通讯地址："){//通讯地址 可修改
                user_info.household_address = $tds.eq(i).find("span").text();
            }else if($ths.eq(i).text() == "邮政编码："){//邮政编码 可修改
                user_info.postcode = $tds.eq(i).find("span").text();
            }else if($ths.eq(i).text() == "E-mail："){//email 可修改
                user_info.email = $tds.eq(i).find("span").text();
            }else if($ths.eq(i).text() == "入网时间："){//入网时间 不可修改
                user_info.registration_time = $tds.eq(i).text();
            }
        }
        log("输出客户信息.....");
        log(user_info);
        log("客户信息爬取终了！");
        
        session.set("user_info",user_info);

        // window.location.href = "http://www.189.cn/dqmh/my189/initMy189home.do?fastcode=01390638";
        window.location.href = "http://bj.189.cn/iframe/feequery/detailBillIndex.action";
    }

    //详单查询填写内容页面
    if (window.location.href.indexOf("detailBillIndex.action") !== -1) {
        log("进入详单查询填写页面");
        waitDomAvailable("#qryAccNo",
            function (dom, timeSpan) {
                var accNum = $("#qryAccNo").text();
                var $months = $("#qryDate").siblings("div").children();
                var qryDataArr = [];
                var qryResultArr = [];
                for (var i = 0; i < $months.length; i++) {
                    var qryMonth = $months.eq(i).text();
                    var formatDateArr = qryMonth.replace("年", "-").replace("月", "").split("-");
                    var billDate = new Date(formatDateArr[0], formatDateArr[1], 0);//当前循环中的年月
                    var nowDate = new Date();//当前日期
                    var day;
                    if ((nowDate.getMonth() + 1) == formatDateArr[1]) {
                        //如果当前时间月份跟选择的日期是一样的,展示的天要以当前月目前的天作为标准,原因你懂得
                        day = nowDate.getDate();
                    } else {
                        day = billDate.getDate();
                    }
                    var qryData = {
                        requestFlag: "synchronization",
                        billDetailType: "1",//1语音详单 2短信详单 3上网详单等等
                        qryMonth: qryMonth,
                        startTime: "1",
                        accNum: accNum,
                        endTime: day + "",
                        page: 1
                    };
                    qryDataArr.push(qryData);
                    qryResultArr.push({
                        calldate : formatDateArr[0]+formatDateArr[1],
                        data: []
                    });
                }

                var user_info = session.get("user_info");
                user_info.mobile = accNum;

                session.set("user_info",user_info);
                session.set("qryDataArr", qryDataArr);
                session.set("qryProgress", 0);
                session.set("qryResultArr", qryResultArr);
                log("准备开始爬取详单");
                log(qryDataArr);
                qryByMonth();
            },
            function (selector) {
                alert("详单页失去响应，点击确认后重试");
                window.location.href = "http://bj.189.cn/iframe/feequery/detailBillIndex.action";
            });

    }

    function qryByMonth() {
        var qryDataArr = session.get("qryDataArr");
        var qryProgress = session.get("qryProgress");
        var qryResultArr = session.get("qryResultArr");
        if (qryProgress < qryDataArr.length) {
            $.ajax({
                type: "POST",
                url: "http://bj.189.cn/iframe/feequery/billDetailQuery.action",
                data: qryDataArr[qryProgress],
                dataType: "html",
                success: function (page) {
                    log("ajax请求成功");
                    //爬取内容
                    var $tables = $(page).filter("table");

                    qryResultArr[qryProgress].mobile = $tables.eq(0).find("td").eq(0).text();
                    qryResultArr[qryProgress].clientName = $tables.eq(0).find("td").eq(1).text();
                    qryResultArr[qryProgress].totalCost = $tables.eq(0).find("td").eq(2).text();

                    var $rows = $tables.eq(1).find("tr");
                    for (var i = 1; i < $rows.length - 3; i++) {
                        qryResultArr[qryProgress].data.push(
                            {
                                callType: $rows.eq(i).find("td").eq(1).text(),//呼叫类型
                                remoteType: $rows.eq(i).find("td").eq(2).text(),//通话类型
                                callAddress: $rows.eq(i).find("td").eq(3).text(),//通话地点
                                otherNo: $rows.eq(i).find("td").eq(4).text(),//对方号码
                                callBeginTime: $rows.eq(i).find("td").eq(5).text(),//通话开始时间
                                callTime: $rows.eq(i).find("td").eq(8).text(),//通话时长
                                callFee: $rows.eq(i).find("td").eq(9).text(),//通话费用
                            }
                        );
                    }
                    var totalCount = parseInt($rows.eq($rows.length - 2).find("span").text());
                    var totalPage = parseInt(totalCount / 50) + 1;
                    log(totalCount);
                    log(totalPage);
                    session.setProgress(70 + parseInt((qryProgress/qryDataArr.length + 1/qryDataArr.length* (qryDataArr[qryProgress].page/totalPage)) * 30));
                    if (totalPage > qryDataArr[qryProgress].page) {//继续爬取下一页
                        qryDataArr[qryProgress].page = qryDataArr[qryProgress].page + 1;
                        log("当前progress:");
                        log(qryProgress);
                        log("开始爬取page：");
                        log(qryDataArr[qryProgress].page);
                        session.set("qryDataArr", qryDataArr);
                        session.set("qryResultArr",qryResultArr);
                        qryByMonth();
                    } else {//爬取下一个月份
                        qryResultArr[qryProgress].totalCount = totalCount;
                        qryResultArr[qryProgress].mobile = qryDataArr[qryProgress].accNum;

                        session.set("qryProgress", ++qryProgress);
                        session.set("qryResultArr",qryResultArr);
                        qryByMonth();
                    }
                },
                error: function () {
                    //发生错误进行重试
                    log("获取通讯详单发生错误，正在重试");
                    qryByMonth();
                }
            });
        } else {//爬取完毕
            log("输出通信详单信息....");
            log(qryResultArr);
            log("通信详单爬取终了！");

            var uploadObj = {
                "user_info" : session.get("user_info"),
                "bill_info" : session.get("uploadArr"),
                "month_status" : qryResultArr
            };

            log("输出最终上传对象信息....");
            log(uploadObj);
            
            log("开始上传");
            session.setProgress(100);
            session.upload(uploadObj);
            session.finish();
        }
    }

    function BillInfo(time,cost,detailInfo){
        this.time = time;
        this.cost = cost;
        this.detailInfo = detailInfo;
    }
});