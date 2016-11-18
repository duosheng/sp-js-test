
dSpider("taobao", function(session,env,$){
    if (window.location.pathname.indexOf("mlapp/mytaobao") != -1) {
        //taobaoState    0:爬账单  1:爬地址   2:爬个人信息   3:结束
        var count = session.get("taobaoState");
        if(count!=1&&count!=2&&count!=3){
            if(count == 0){

            }else{
                session.set("taobaoState",0);
                session.set("orderArray",[]);
                //显示进度为0
                session.showProgress(true);
                session.setProgressMax(100);
                session.setProgress(2);
            }
            document.getElementsByClassName("label-act")[0].children[0].children[0].click();//点击订单
        }else if(count==1){
            //跳转到网页版   www.taobao.com
            session.set("AddressData",[]);
            location.href="//www.taobao.com/index.php?from=wap";
        }else if(count == 2){
            location.href = "https://i.taobao.com/user/baseInfoSet.htm";
        }
    }


    var state = session.get("taobaoState");
    if(state == 0){
        //获取订单列表
        if (window.location.pathname.indexOf("mlapp/olist") != -1) {
            var op = session.get("OrderItemPosition");
            if(op == undefined){
                getOrderList();
            }else{
                intoOrderDetail(op);
            }
        }
        function getOrderList(){
            var myInterval;
            //循环调用获取订单的方法
            function getOrder() {
                if (window.getComputedStyle($("div.order-more")[0], '::after').getPropertyValue('content')||$(".order-list>li").length>=5) {//限制订单爬取的数量
                    log("加载完成");
                    clearInterval(myInterval);
                    //进入订单
                    session.set("OrderItemPosition",0);
                    intoOrderDetail(0);
                } else {
                    //需要继续请求订单
                    document.getElementsByClassName("order-more")[0].click();//点击加载更多
                    log("正在获取订单");
                }
            }
            myInterval = setInterval(getOrder, 3000);
        }
        /**
         * 进入订单的爬取操作
         */
        function intoOrderDetail(position) {
            if(position >= $(".order-list>li").length){
                //更新状态并退回到个人页
                session.set("taobaoState",1);
                session.setProgress(65);
                setTimeout(location.url = history.go(-1),1000);
            }else{
                session.setProgress(5+(position/($(".order-list>li").length))*60);
                //进入订单详情页
                ($($(".order-list>li")[position]).children()[3].children[0].children[0]).click();
            }
        }
        /**
         * 爬取订单数据
         */
        if (window.location.pathname.indexOf("mymovie/pages") != -1) {//特殊订单的处理
            var oa = session.get("orderArray");
            if(oa == undefined){
                session.set("taobaoState",-1);
                //关闭当前页面
                closeOrderDetail();
            }else{
                currentOrderData = oa;
                //拿到position后开始爬取
                var oip = session.get("OrderItemPosition");
                session.set("OrderItemPosition",oip+1);
                setTimeout(location.url = history.go(-1),1000);
            }
        }
        if (window.location.pathname.indexOf("mlapp/odetail") != -1) {
            var currentPosition;
            var currentOrderData = [];
            function getOrderDetail() {
                //当前订单需要爬取的数据的对象
                var tbOrderDetailInfo = {};
                //存放多个商品的数组
                var totalProductArray = [];
                //创建订单详情的列表
                var orderInfoList = [];
                //拿到页面列表中所有的div
                var ol = $(".order-list>li>div");
                for (var i = 0; i < ol.length; i++) {
                    if (ol[i].className.indexOf("orderinfo") != -1) {
                        //订单编号
                        for (var j = 0; j < ol[i].children[0].childElementCount; j++) {
                            var infoItem = $(ol[i].children[0].children[j]).text();
                            if (infoItem.indexOf("订单编号") != -1) {
                                //截取订单编号
                                var orderNamber = infoItem.substring(infoItem.indexOf(":") + 1, infoItem.length);
                                tbOrderDetailInfo.id = orderNamber;
                            }
                        }
                        //订单创建时间
                        for (var j = 0; j < ol[i].children[0].childElementCount; j++) {
                            var infoItem = $(ol[i].children[0].children[j]).text();
                            if (infoItem.indexOf("创建时间") != -1) {
                                //截取订单创建时间
                                var orderCreatTime = infoItem.substring(infoItem.indexOf(":") + 1, infoItem.length);
                                tbOrderDetailInfo.time = orderCreatTime;
                            }
                        }
                    }
                    //商品名称
                    if (ol[i].className.indexOf("item") != -1) {//---所有商品的item
                        var productInfo = ol[i].children;//产品信息下所有的布局
                        for (var k = 0; k < productInfo.length; k++) {
                            //创建一个对象存放产品列表
                            var myProductInfo = {};
                            if (productInfo[k].className.indexOf("item-list") != -1) {
                                for (var m = 0; m < productInfo[k].children.length; m++) {
                                    if (productInfo[k].children[m].className.indexOf("item-info") != -1) {//----item中产品信息
                                        var order_product_info = productInfo[k].children[m];
                                        for (var opi = 0; opi < order_product_info.children.length; opi++) {
                                            var opiChildren = order_product_info.children[opi];
                                            if (opiChildren.className.indexOf("title") != -1) {
                                                //商品名称
                                                myProductInfo.name = $(opiChildren).text();
                                            }
                                        }
                                    }
                                    if (productInfo[k].children[m].className.indexOf("item-pay") != -1) {//----item中产品价格和数量
                                        var item_pay = productInfo[k].children[m];
                                        for (var ip = 0; ip < item_pay.children.length; ip++) {
                                            var ipChildren = item_pay.children[ip];
                                            if (ipChildren.className.indexOf("item-pay-data") != -1) {
                                                var priceInfoArray = ipChildren.children;
                                                for (var pia = 0; pia < priceInfoArray.length; pia++) {
                                                    if (priceInfoArray[pia].className.indexOf("price") != -1) {
                                                        //商品价格
                                                        var productPrice = $(priceInfoArray[pia]).text();
                                                        if (productPrice.indexOf("￥") != -1) {
                                                            productPrice = productPrice.substring(productPrice.indexOf("￥") + 1, productPrice.length)
                                                        }
                                                        myProductInfo.price = productPrice;
                                                        break;
                                                    }
                                                }
                                                for (var pia = 0; pia < priceInfoArray.length; pia++) {
                                                    if (priceInfoArray[pia].className.indexOf("nums") != -1) {
                                                        //商品数量
                                                        var productNumber = $(priceInfoArray[pia]).text();
                                                        if (productNumber.indexOf("x") != -1) {
                                                            productNumber = productNumber.substring(productNumber.indexOf("x") + 1, productNumber.length)
                                                        }
                                                        myProductInfo.number = productNumber;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        orderInfoList.push(myProductInfo);
                    }
                    //总计消费
                    if (ol[i].className.indexOf("paydetail") != -1) {
                        var priceInfoArray = ol[i].children[0].children;
                        for (var pa = 0; pa < priceInfoArray.length; pa++) {
                            var cc = priceInfoArray[pa].children;
                            for (var cci = 0; cci < cc.length; cci++) {
                                if ($(cc[cci]).text().indexOf("实付款") != -1) {
                                    var totalPrice = $(cc[cci + 1]).text();
                                    if (totalPrice.indexOf("￥") != -1) {
                                        totalPrice = totalPrice.substring(totalPrice.indexOf("￥") + 1, totalPrice.length)
                                    }
                                    tbOrderDetailInfo.total = totalPrice;
                                    if (orderInfoList.length > 1) {//说明此订单中有多个商品
                                        for (var oil = 0; oil < orderInfoList.length; oil++) {
                                            var tempTbOrderDetailInfo = {};
                                            tempTbOrderDetailInfo.id = tbOrderDetailInfo.id;
                                            tempTbOrderDetailInfo.time = tbOrderDetailInfo.time;
                                            tempTbOrderDetailInfo.name = orderInfoList[oil].name;
                                            tempTbOrderDetailInfo.price = orderInfoList[oil].price;
                                            tempTbOrderDetailInfo.number = orderInfoList[oil].number;
                                            tempTbOrderDetailInfo.total = tbOrderDetailInfo.total;
                                            tempTbOrderDetailInfo.address = tbOrderDetailInfo.address;
                                            totalProductArray.push(tempTbOrderDetailInfo);
                                        }
                                    } else if (orderInfoList.length == 1) {//此订单中只有一个商品
                                        tbOrderDetailInfo.name = orderInfoList[0].name;
                                        tbOrderDetailInfo.price = orderInfoList[0].price;
                                        tbOrderDetailInfo.number = orderInfoList[0].number;
                                        totalProductArray.push(tbOrderDetailInfo);
                                    }
                                    //存放数据
                                    for(var sd = 0 ; sd < totalProductArray.length ; sd++ ){
                                        currentOrderData.push(totalProductArray[sd]);
                                    }
                                    //保存数据
                                    session.set("orderArray",currentOrderData);
                                    //更新position
                                    session.set("OrderItemPosition",currentPosition+1);
                                    //关闭详情页
                                    closeOrderDetail();
                                }
                            }
                        }
                    }
                    //订单地址
                    if (ol[i].className.indexOf("address") != -1) {
                        var addressArray = ol[i].children[0].children;
                        for (var aa = 0; aa < addressArray.length; aa++) {
                            if (addressArray[aa].className.indexOf("cont") != -1) {
                                var myAdArray = addressArray[aa].children;
                                for (var maa = 0; maa < myAdArray.length; maa++) {
                                    if (myAdArray[maa].className.indexOf("submsg") != -1) {
                                        var myAddress = $(myAdArray[maa]).text();
                                        myAddress = myAddress.substring(myAddress.indexOf("：") + 1, myAddress.length);
                                        tbOrderDetailInfo.address = myAddress;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            var oay = session.get("orderArray");
            if(oay == undefined){
                session.set("taobaoState",-1);
                //关闭当前页面
                closeOrderDetail();
            }else{
                currentOrderData = oay;
                var oipn = session.get("OrderItemPosition");
                //拿到position后开始爬取
                currentPosition = oipn;
                getOrderDetail();
            }
            function closeOrderDetail(){
                $("div.back").click();//订单详情页的返回
            }
        }
    }
    //------------------------------------------------------------------------------------爬取收货地址----------------------------------------------------------------------------
    else if(state == 1){

        if (window.location.hostname.indexOf("m.taobao.com") != -1) {
            $(".my").click();//点击我的
            location.href="//www.taobao.com/index.php?from=wap";
        }
        /**
         * 爬取收货地址
         */
        if((window.location.hostname.indexOf("www.taobao.com") != -1)){
            location.href = "//i.taobao.com/my_taobao.htm";
        }

        if((window.location.href.indexOf("i.taobao.com/my_taobao") != -1)){
            dQuery("li.J_MtNavSubTrigger").children()[0].click();//进入到账号管理界面
        }

        if((window.location.hostname.indexOf("member1.taobao.com") != -1)){
            if((window.location.href.indexOf("deliver_address") != -1)){
                if((window.location.href.indexOf("addrId") != -1)){
                    var addressData = session.get("AddressData");
                    var urlArray = session.get("addressUrlArray");
                    var urlPosition = session.get("addressUrlPosition");
                    if(addressData==undefined){
                        addressData = [];
                    }
                    //取出爬到的数据并保存
                    var tempAddaress =  {};
                    tempAddaress.location = dQuery("div.city-title").text();//所在区域
                    tempAddaress.address = dQuery("textarea#J_Street").text();//详细地址
                    tempAddaress.zipcode = dQuery("input#J_PostCode").attr("value");//邮编
                    tempAddaress.name = dQuery("input#J_Name").attr("value");//姓名
                    tempAddaress.phone = dQuery("input#J_Mobile").attr("value");//电话号
                    addressData.push(tempAddaress);
                    session.set("AddressData",addressData);
                    session.setProgress(65+(((urlPosition+1)/7)*20));
                    if(urlPosition<urlArray.length-1){
                        session.set("addressUrlPosition",urlPosition+1);
                        location.href = urlArray[urlPosition+1];
                    }else{
                        session.set("taobaoState",2);
                        session.setProgress(85);
                        //爬取个人信息
                        location.href = "https://i.taobao.com/user/baseInfoSet.htm"
                    }
                }else {
                    //dQuery("tbody>tr>td").map(function(){return dQuery(this).find("a")[0] }) 找出当前元素中的第一个子元素a
                    //开始爬取地址
                    var trList = dQuery("tbody>tr>td>a");
                    var modifyUrlArray = [];
                    for (var tl = 0; tl < trList.length; tl++) {
                        if ("修改" == dQuery(trList[tl]).text()) {
                            modifyUrlArray.push(dQuery(trList[tl]).attr("href"));
                        }
                    }
                    //保存数据
                    session.set("addressUrlArray",modifyUrlArray);
                    //记录位置
                    session.set("addressUrlPosition",0);
                    location.href = modifyUrlArray[0];
                }
            }else{
                location.href="https://member1.taobao.com/member/fresh/deliver_address.htm"
            }
        }
    }
    //------------------------------------------------------------------------------------爬取个人资料----------------------------------------------------------------------------
    else if(state == 2){
        /**
         * 爬取个人信息
         */
        if(window.location.pathname.indexOf("baseInfoSet") != -1){//个人资料设置
            var tempPersonInfo = {};
            tempPersonInfo.username = dQuery(dQuery("div.menu-hd>a")[0]).text();//账号
            tempPersonInfo.name = dQuery("input#J_realname").attr("value");//姓名
            //保存tempPersonInfo
            session.set("persionInfo",tempPersonInfo);
            session.setProgress(90);
            location.href = "https://member1.taobao.com/member/fresh/account_security.htm";//跳转到安全设置拿电话
        }
        if(window.location.pathname.indexOf("account_security") != -1){//个人资料设置
            var perInfo = session.get("persionInfo");
            if(perInfo == undefined)
                perInfo = {};
            //电话号码
            var phone;
            var tempArray = dQuery("span.t");
            for(var ta = 0 ; ta<tempArray.length;ta++){
                if(dQuery(tempArray[ta]).text().indexOf("绑 定 手 机")!=-1){
                    phone = dQuery(dQuery(tempArray[ta]).next()).text().trim();
                }
            }
            //保存手机号
            perInfo.phone = phone;
            session.set("persionInfo",perInfo);
            session.setProgress(97);
            //点击查看获取省份证号
            dQuery("div.operate>a")[0].click();
        }

        if(window.location.pathname.indexOf("certify_info") != -1) {//身份认证界面
            var perInfo = session.get("persionInfo");
            if(perInfo == undefined)
                perInfo = {};
            var tempArray = dQuery("div.explain-info>span");
            var idcard_no;
            for(var taa = 0 ; taa<tempArray.length;taa++){
                var title = dQuery(tempArray[taa]).text();
                if(title.indexOf("身份证号")!=-1){
                    idcard_no = dQuery(dQuery(tempArray[taa]).next()).text();
                }
            }
            //保存身份证号 idcard_no
            perInfo.idcard_no = idcard_no;
            session.set("persionInfo",perInfo);
            //修改状态
            session.set("taobaoState",3);
            session.setProgress(100);
            uploadData();
        }
    }
    else if(state == 3){
        //爬取完成
    }
    function uploadData(){
        var persionInfo = session.get("persionInfo");
        var addData = session.get("AddressData");
        var orderArray = session.get("orderArray");
        if(persionInfo==undefined){
            session.finish("upLoadData方法中的数据为空","persionInfo is undefined",2);
        }else if(addData == undefined){
            session.finish("upLoadData方法中的数据为空","addData is undefined",2);
        }else if(orderArray == undefined){
            session.finish("upLoadData方法中的数据为空","orderArray is undefined",2);
        }
        var data = {};
        //存入个人信息
        data.base_info = persionInfo;
        //存入地址信息
        var tempData = {};
        tempData.contact_detail = addData;
        data.contact_info = tempData;
        //存入订单数据
        var tempOrderDetail = {};
        tempOrderDetail.order_detail = orderArray;
        data.order_info = tempOrderDetail;
        log("-------上传数据----------");
        session.upload(data);
        session.showProgress(false);
        session.finish();
    }
})