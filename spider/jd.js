
dSpider("jd", function(session,env,$){
    log("current page: "+location.href)
    var re = /sid=(.+)$/ig;
    var infokey = "infokey";
    var sid = "";
    var max_order_num = 30;
    var max_order_date = 100;
    var globalInfo;
    log("xxxxurl" + location.href);

    sid = session.get("sid");
    session.onNavigate=function(url){
        if(url.indexOf("://plogin.m.jd.com/user")!=-1){
            session.showLoading();
            session.autoLoadImg(false);
        }
    }


    if (location.href.indexOf("://m.jd.com") != -1 ) {
        session.showProgress(true);
        session.setProgressMax(100);
        session.setProgress(0);
        session.hideLoading();

        if($(".jd-search-form-input")[0] != undefined){
            sid  = $(".jd-search-form-input")[0].children[0].value;
            session.set("sid",  sid);
        }

        // log(JSON.stringify(new info({},{},{})));
        session.set(infokey, new info({},{},{}));
        globalInfo = session.get(infokey);
        globalInfo.base_info.username  = $("[report-eventid$='MCommonHTail_Account']").text().replace(/\n/g,"").replace(/\t/g,"");
        saveInfo();
        session.setProgress(10);
        location.href="http://home.m.jd.com/maddress/address.action?";
    }

    if (location.href.indexOf("home.m.jd.com/maddress") != -1) {
        session.setProgress(20);

        globalInfo = session.get(infokey);
        log("globalinfo" + globalInfo);
        global_contact_info = new contact_info([]);
        var taskAddr = [];
        var urlarray = $(".ia-r");
        for(var i=0;i<urlarray.length;i++){
            taskAddr.push($.get(urlarray[i],function(response,status){
                var node = $("<div>").append($(response))
                var name = node.find("#uersNameId")[0].value;
                var phone = node.find("#mobilePhoneId")[0].value;
                var addr = node.find("#addressLabelId")[0].innerHTML;
                var detail = node.find("#address_where")[0].innerHTML;

                global_contact_info.contact_detail.push(new contact(name,addr,detail,phone, ""));
            }) );

        }


        $.when.apply($,taskAddr).done(
            // $.when(taskAddr).done(
            function(){
                globalInfo.contact_info = global_contact_info;
                saveInfo();
                session.setProgress(30);
                getOrder();
            });


    }


    function getOrder(){
        session.setProgress(40);
        globalInfo = session.get(infokey);
        var orders = new order_info([]);
        globalInfo.order_info = new order_info([]);
        globalInfo.order_info.order_detail = [];
        function getPageOrder(page){
            $.getJSON("http://home.m.jd.com//newAllOrders/newAllOrders.json?sid="+sid+"&page="+page,function(d){
                page++;
                if( globalInfo.order_info.order_detail.length <=  max_order_num && d.orderList.length!=0 && (orders.order_detail.length == 0 || d.orderList[d.orderList.length-1].orderId != orders.order_detail[orders.order_detail.length-1].orderId) ){
                    orders.order_detail = orders.order_detail.concat(d.orderList);
                    var task = [];
                    log("xxdebug-orderList" + d.orderList);
                    var tempOrder = [];
                    task.push($.each(d.orderList,function(i,e){
                        $.get("http://home.m.jd.com/newAllOrders/queryOrderDetailInfo.action?orderId="+ d.orderList[i].orderId+"&from=newUserAllOrderList&passKey="+d.passKeyList[i]+"&sid="+sid,
                            function(response,status){
                                var addr = $("<div>").append($(response)).find(".step2-in-con").text();
                                var orderitem = new order(d.orderList[i].orderId,d.orderList[i].dataSubmit,d.orderList[i].price,addr);

                                orderitem.products = [];
                                var products = $("<div>").append($(response)).find(".pdiv");
                                $.each(products,function(k, e){
                                    var name = $("<div>").append(products[k]).find(".sitem-m-txt").text();
                                    var price = $("<div>").append(products[k]).find(".sitem-r").text();
                                    var num = $("<div>").append(products[k]).find(".s3-num").text();
                                    orderitem.products.push(new product(name,  num ,price));
                                });
                                if(globalInfo.order_info.order_detail.length < max_order_num &&
                                    Date.parse(new Date()) < (new Date(orderitem.time.split(" ")[0])).getTime() + max_order_date * 24 * 60 * 60 * 1000){
                                    log("xxxxxxxq" + JSON.stringify(tempOrder));
                                    globalInfo.order_info.order_detail.push(orderitem);
                                }
                            });
                    }));

                    $.when(task).done(function(){
                        getPageOrder(page);
                        globalInfo.order_info.order_detail.sort(compare());
                    });

                }else {
                    saveInfo();
                    session.setProgress(60);
                    getUserInfo();
                    return;
                }
            });
        }
        getPageOrder(1);
    }

    function compare(){
        return function(a,b){
            var value1 = (new Date(a.time.split(" ")[0])).getTime();
            var value2 = (new Date(b.time.split(" ")[0])).getTime();
            return value2 - value1;
        }
    }

    function getUserInfo(){
        location.href = "http://home.m.jd.com/user/accountCenter.action";
    }
    if (location.href.indexOf("home.m.jd.com/user/accountCenter.action") != -1) {
        session.setProgress(70);
        if($('#shimingrenzheng')[0] != undefined){
            $('#shimingrenzheng')[0].click();
        }
    }

    //已实名用户
    if (location.href.indexOf("msc.jd.com/auth/loginpage/wcoo/toAuthInfoPage") != -1) {
        session.setProgress(90);
        globalInfo = session.get(infokey);
        if( $(".pos-ab")[0] != undefined){
            globalInfo.base_info.name  = $(".pos-ab")[0].innerHTML;
        }
        if($(".pos-ab")[1] != undefined){
            globalInfo.base_info.idcard_no  = $(".pos-ab")[1].innerHTML;
        }
        saveInfo();
        logout();


    }

    function logout(){

        alert("爬取订单总计:" + session.get(infokey).order_info.order_detail.length);
        location.href = "https://passport.m.jd.com/user/logout.action?sid="+session.get("sid");
        session.setProgress(100);
        session.upload(session.get(infokey));
        session.finish();
    }
    //快捷卡实名用户
    if (location.href.indexOf("msc.jd.com/auth/loginpage/wcoo/toAuthPage") != -1) {
        session.setProgress(90);
        globalInfo = session.get(infokey);
        if($("#username")[0] !=undefined){
            globalInfo.base_info.name  = $("#username")[0].value;
        }
        if($("#idcard")[0] !=undefined){
            globalInfo.base_info.idcard_no  = $("#idcard")[0].value;
        }
        saveInfo();
        logout();
    }

    function saveInfo(){
        session.set(infokey, globalInfo);
    }



    function addr(name,phone,addrdetail) {
        this.name = name;
        this.phone = phone;
        this.addrdetail = addrdetail;
    }

    var address = [];
    var global_contact_info;


    function info(base_info,contact_info,order_info ){
        this.site_id = 2;
        this.base_info = base_info;
        this.contact_info = contact_info;
        this.order_info  = order_info;
    }

    function base_info(username, name, idcard_no, phone){
        this.username = username;
        this.name = name;
        this.idcard_no = idcard_no;
        this.phone = phone;
    }


    function contact_info(contact_detail){
        this.contact_detail = contact_detail;
    }

    function contact(name, location ,address, phone, zipcode){
        this.name  = name;
        this.location  = location;
        this.address  = address;
        this.phone  = phone;
        this.zipcode  = zipcode;
    }

    function order_info(order_detail){
        this.order_detail  = order_detail;
    }

    function order(id, time , total, address){
        this.id  = id;
        this.time  = time;
        this.total  = total;
        this.address  = address;
    }

    function product(name, number, price){
        this.name  = name;
        this.number  = number;
        this.price  = price;
    }

//end
})