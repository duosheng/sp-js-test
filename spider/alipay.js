dSpider("alipay", function(session, env, $) {
      log("current page url: " + location.href);
      var monthArray = [];
      var uploadMonArray = []; //存储月份数据
      var monCount = 3; //需要爬取的月份
      var sumCount = monCount + 1;
      var now = new Date();

      if (window.location.href.indexOf('/account/index.htm') != -1) {
            session.showProgress(true);
            session.setProgressMax(100);
            session.setProgress(0);

            fetchUserInfo();
            session.setProgress(100.0 / (sumCount));
            jumptoOrderListPage();
      }

      if (window.location.href.indexOf('/record/standard.htm') != -1) {
            switchVersion();
      }

      if (window.location.href.indexOf('/record/advanced.htm') != -1) {
            spideOrder();
      }

      //开始爬取交易记录
      function spideOrder() {
            log('--------------start spideOrder------------' + 'beginDate:' + beginDate + '|endDate:' + endDate )
            var endDate = formateDate(now);
            now.setMonth(now.getMonth() - 1);
            var beginDate = formateDate(now);
            fetchOrderListBy(1, beginDate, endDate);
      }

      //获取交易记录 pageNum:第几页  beginDate:开始时间  endDate:结束时间
      function fetchOrderListBy(pageNum, beginDate, endDate) {
            log('---------fetchOrderListBy--------------')
            log('---------start spide order:【' + pageNum + '】page-------');
            var daterange = 'customDate';
            var beginTime = '00:00';
            var endTime = '24:00';

            $.ajax({
                  url: 'https://consumeprod.alipay.com/record/advanced.htm',
                  type: 'post',
                  data: 'pageNum=' + pageNum + '&beginDate=' + beginDate + '&endDate=' + endDate + '&dateRange=' + daterange + '&beginTime=' + beginTime + '&endTime=' + endTime,
                  dataType: 'html',
                  async: true,
                  cache: false,
                  success: function(data) {
                        var res = $(data).find('#tradeRecordsIndex');
                        if ($(res).find('tr:has(td)').length == 0) { //到达最后一页
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
                                    log('----------------spideOrder finish!!!----------------- beginDate:' + beginDate + '|endDate:' + endDate + ' && monthArray:' + monthArray)
                                    var uploadData = {
                                          order_info: uploadMonArray
                                    };
                                    session.upload(uploadData);
                                    finish();
                              } else {
                                    log('----------------spideOrder single_month over!!!----------------- beginDate:' + beginDate + '|endDate:' + endDate + ' && monthArray:' + monthArray)
                                    monthArray = []; //上传后清空
                                    spideOrder();
                              }

                        } else {
                              var data = $(res).find('tr:has(td)').map(function(index) {
                                    return {
                                          name: $(this).find('p.consume-title').text(),
                                          time: $(this).find('p.time-d').text() + ' ' + $(this).find('p.time-h.ft-gray').text(),
                                          amount: $(this).find('span.amount-pay').text(),
                                          tradeNo: $(this).find('.tradeNo.ft-gray').text(),
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
            userInfo.bankCard = $('#J-bankcards > td:nth-child(2) > span').text();

            session.upload({
                  user_info: userInfo
            });
            log(userInfo);
      }

      //跳到交易记录
      function jumptoOrderListPage() {
            log('----------jumptoOrderListPage-----------')
            location.href = "https://consumeprod.alipay.com/record/advanced.htm";
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

      //转成标准格式字符串
      function formateDate(date) {
            var day = date.getDate();
            var month = date.getMonth() + 1;
            var year = date.getFullYear();
            return year + '.' + month + '.' + day;
      }

      //用户信息
      function userInfo(name, mail, phone, taoId, regTime, certId, bVerify, bankCard) {
            this.name = name; //真实名字
            this.mail = mail; //邮箱 
            this.phone = phone; //手机号
            this.taoId = taoId; //淘宝id
            this.regTime = regTime; //注册时间
            this.certId = certId; //身份证
            this.bVerify = bVerify; //是否认证
            this.bankCard = bankCard; //绑定银行卡个数
      }

      //交易记录
      function OrderInfo(name, time, amount, tradeNo) {
            this.name = name; //交易名字
            this.time = time; //交易时间
            this.amount = amount; //交易金额
            this.tradeNo = tradeNo; //流水号
      }

})