!function(){
    var _spiderVersion="0.0.0.145";
    var _su="https://plogin.m.jd.com/user/login.action?appid=100";
    /**
     * Created by du on 16/9/1.
     */
    var $ = dQuery;
    var jQuery=$;
    String.prototype.format = function () {
        var args = Array.prototype.slice.call(arguments);
        var count = 0;
        return this.replace(/%s/g, function (s, i) {
            return args[count++];
        });
    };

    String.prototype.trim = function () {
        return this.replace(/(^\s*)|(\s*$)/g, '');
    };

    String.prototype.empty = function () {
        return this.trim() === "";
    };

    function _logstr(str){
        str=str||" "
        return typeof str=="object"?JSON.stringify(str):(new String(str)).toString()
    }
    function log(str) {
        var s= window.curSession
        if(s){
            s.log(str)
        }else {
            console.log("dSpider: "+_logstr(str))
        }
    }

//异常捕获
    function errorReport(e) {
        var stack=e.stack? e.stack.replace(/http.*?inject\.php.*?:/ig," "+_su+":"): e.toString();
        var msg="语法错误: " + e.message +"\nscript_url:"+_su+"\n"+stack
        if(window.curSession){
            curSession.log(msg);
            curSession.finish(e.message,"",3,msg);
        }
    }

    String.prototype.endWith = function (str) {
        if (!str) return false;
        return this.substring(this.length - str.length) === str;
    };

//queryString helper
    window.qs = [];
    var s = location.search.substr(1);
    var a = s.split('&');
    for (var b = 0; b < a.length; ++b) {
        var temp = a[b].split('=');
        qs[temp[0]] = temp[1] ? temp[1] : null;
    }
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver

    function safeCallback(f) {
        if (!(f instanceof Function)) return f;
        return function () {
            try {
                f.apply(this, arguments)
            } catch (e) {
                errorReport(e)
            }
        }
    }
//设置dQuery异常处理器
    dQuery.safeCallback = safeCallback;
    dQuery.errorReport = errorReport;

    function hook(fun) {
        return function () {
            if (!(arguments[0] instanceof Function)) {
                t = arguments[0];
                log("warning: " + fun.name + " first argument should be function not string ")
                arguments[0] = function () {
                    eval(t)
                };
            }
            arguments[0] = safeCallback(arguments[0]);
            return fun.apply(this, arguments)
        }
    }

//hook setTimeout,setInterval异步回调
    var setTimeout = hook(window.setTimeout);
    var setInterval = hook(window.setInterval);

//dom 监控
    function DomNotFindReport(selector) {
        var msg = "元素不存在[%s]".format(selector)
        log(msg)
    }

    function waitDomAvailable(selector, success, fail) {
        var timeout = 10000;
        var t = setInterval(function () {
            timeout -= 10;
            var ob = dQuery(selector)
            if (ob[0]) {
                clearInterval(t)
                success(ob, 10000 - timeout)
            } else if (timeout == 0) {
                clearInterval(t)
                var f = fail || DomNotFindReport;
                f(selector)
            }
        }, 10);
    }

    function Observe(ob, options, callback) {
        var mo = new MutationObserver(callback);
        mo.observe(ob, options);
        return mo;
    }

//dquery,api加载成功的标志是window.xyApiLoaded=true,所有操作都必须在初始化成功之后
    function apiInit() {
        dQuery.noConflict();
        var withCheck=function(attr) {
            var f = DataSession.prototype[attr];
            return function () {
                if (this.finished) {
                    console.log("dSpider: call " + attr + " ignored, since finish has been called! ")
                } else {
                    return f.apply(this, arguments);
                }
            }
        }

        for (var attr in DataSession.prototype) {
            DataSession.prototype[attr] = withCheck(attr);
        }
        var t = setInterval(function () {
            if (!(window._xy || window.bridge)) {
                return;
            }
            window.xyApiLoaded = true;
            clearInterval(t);
        }, 20);
    }

//爬取入口
    function dSpider(sessionKey,timeOut, callback) {
        if(window.onSpiderInited&&this!=5)
            return;
        var $=dQuery;
        var t = setInterval(function () {
            if (window.xyApiLoaded) {
                clearInterval(t);
            } else {
                return;
            }
            var session = new DataSession(sessionKey);
            var onclose=function(){
                log("onNavigate:"+location.href)
                session._save()
                if(session.onNavigate){
                    session.onNavigate(location.href);
                }
            }
            $(window).on("beforeunload",onclose)
            window.curSession = session;
            session._init(function(){
                //超时处理
                if (!callback) {
                    callback = timeOut;
                    timeOut = -1;
                }
                if (timeOut != -1) {
                    var startTime = session.get("startTime")
                    var now = new Date().getTime();
                    if (!startTime) {
                        session.set("startTime", now);
                        startTime=now
                    }
                    timeOut *= 1000;
                    var passed = (now - startTime);
                    var left = timeOut -passed;
                    left = left > 0 ? left : 0;
                    log("left:"+left)
                    setTimeout(function () {
                        log("time out");
                        if (!session.finished) {
                            session.finish("timeout ["+timeOut/1000+"s] ", "",4)
                        }
                    }, left);
                }
                DataSession.getExtraData(function (extras) {
                    $(safeCallback(function(){
                        $("body").on("click","a",function(){
                            $(this).attr("target",function(_,v){
                                if(v=="_blank") return "_self"
                            })
                        })
                        log("dSpider start!")
                        extras.config=typeof _config==="object"?_config:"{}";
                        session._args=extras.args;
                        callback(session, extras, $);
                    }))
                })
            })
        }, 20);
    }

    dQuery(function(){
        if(window.onSpiderInited){
            window.onSpiderInited(dSpider.bind(5));
        }
    })

//邮件爬取入口
    function dSpiderMail(sessionKey, callback) {
        dSpider(sessionKey,function(session,env,$){
            callback(session.getLocal("u"), session.getLocal("wd"), session, env, $);
        })
    };
    function DataSession(key) {
        this.key = key;
        this.finished = false;
        _xy.start(key);
    }

    DataSession.getExtraData = function (f) {
        f = safeCallback(f);
        f && f(JSON.parse(_xy.getExtraData() || "{}"));
    }

    DataSession.prototype = {
        _save: function () {
            _xy.set(this.key, JSON.stringify(this.data));
            _xy.save(this.key,JSON.stringify(this.local))
        },
        _init: function (f) {
            this.data = JSON.parse(_xy.get(this.key) || "{}");
            this.local=JSON.parse(_xy.read(this.key)|| "{}")
            f()
        },

        get: function (key) {
            return this.data[key];
        },
        set: function (key, value) {
            this.data[key] = value;
        },

        showProgress: function (isShow) {
            _xy.showProgress(isShow === undefined ? true : !!isShow);
        },
        setProgressMax: function (max) {
            _xy.setProgressMax(max);
        },
        setProgress: function (progress) {
            _xy.setProgress(progress);
        },
        getProgress: function (f) {
            f = safeCallback(f);
            f && f(_xy.getProgress());
        },
        showLoading: function (s) {
            _xy.showLoading(s || "正在爬取,请耐心等待...")
        },
        hideLoading: function () {
            _xy.hideLoading()
        },
        finish: function (errmsg, content, code, stack) {
            this.finished = true;
            if (errmsg) {
                var ob = {
                    url: location.href,
                    msg: errmsg,
                    //content: content || document.documentElement.outerHTML,
                    args: this._args
                }
                stack && (ob.stack = stack);
                return _xy.finish(this.key || "", code || 2, JSON.stringify(ob));
            }
            return _xy.finish(this.key || "", 0, "")
        },
        upload: function (value) {
            if (value instanceof Object) {
                value = JSON.stringify(value);
            }
            return _xy.push(this.key, value)
        },
        load: function (url, headers) {
            headers = headers || {}
            if (typeof headers !== "object") {
                alert("the second argument of function load  must be Object!")
                return
            }
            _xy.load(url, JSON.stringify(headers));
        },
        setStartUrl:function(){
            this.set('__loginUrl',location.href);
        },
        setUserAgent: function (str) {
            _xy.setUserAgent(str)
        },
        openWithSpecifiedCore: function (url, core) {
            _xy.openWithSpecifiedCore(url, core)
        },
        autoLoadImg: function (load) {
            _xy.autoLoadImg(load === true)
        },
        string: function () {
            log(this.data)
        },
        setProgressMsg:function(str){
            if(!str) return;
            _xy.setProgressMsg(str);
        },
        log: function(str,type) {
            str=_logstr(str);
            console.log("dSpider: "+str)
            _xy.log(str,type||1)
        },
        setLocal: function (k, v) {
            this.local[k]=v
        },
        getLocal: function (k) {
            return this.local[k];
        }
    };
    apiInit();;

    dSpider("jd", function(session,env,$){

        var re = /sid=(.+)$/ig;
        var infokey = "infokey";
        var sid = "";
        var max_order_num = 30;
        var max_order_date = 1000;
        var globalInfo;

        jderror

        sid = session.get("sid");

        if (location.href.indexOf("://m.jd.com") !== -1 ) {
            session.showProgress(true);
            session.setProgressMax(100);
            session.autoLoadImg(false);
            session.setProgress(5);

            if($(".jd-search-form-input")[0] !== undefined){
                sid  = $(".jd-search-form-input")[0].children[0].value;
                session.set("sid",  sid);
            }

            session.set(infokey, new info({},{},{}));
            globalInfo = session.get(infokey);
            globalInfo.base_info.username  = $("[report-eventid$='MCommonHTail_Account']").text().replace(/\n/g,"").replace(/\t/g,"");
            saveInfo();
            session.setProgress(10);
            location.href="http://home.m.jd.com/maddress/address.action?";
        }

        if (location.href.indexOf("://home.m.jd.com/maddress") != -1) {
            session.setProgress(20);

            globalInfo = session.get(infokey);

            global_contact_info = new contact_info([]);
            var taskAddr = [];
            var urlarray = $(".ia-r");
            for(var i=0;i<urlarray.length;i++){
                taskAddr.push($.get(urlarray[i],function(response,status){
                    var node = $("<div>").append($(response));
                    var name = $.trim(node.find("#uersNameId")[0].value);
                    var phone = $.trim(node.find("#mobilePhoneId")[0].value);
                    var addr = $.trim(node.find("#addressLabelId")[0].innerHTML);
                    var detail = $.trim(node.find("#address_where")[0].innerHTML);

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
                $.getJSON("https://home.m.jd.com//newAllOrders/newAllOrders.json?sid="+sid+"&page="+page,function(d){
                    page++;
                    if( globalInfo.order_info.order_detail.length <=  max_order_num && d.orderList.length!==0 && (orders.order_detail.length === 0 || d.orderList[d.orderList.length-1].orderId !== orders.order_detail[orders.order_detail.length-1].orderId) ){
                        orders.order_detail = orders.order_detail.concat(d.orderList);
                        var task = [];
                        var tempOrder = [];
                        if(globalInfo.order_info.order_detail.length < max_order_num){
                            if(d.orderList.length + globalInfo.order_info.order_detail.length > max_order_num){
                                d.orderList = d.orderList.slice(0, max_order_num -  globalInfo.order_info.order_detail.length);
                            }
                            task.push($.each(d.orderList,function(i,e){
                                log("task push orderId: " + d.orderList[i].orderId);

//                                           $.get("https://home.m.jd.com/newAllOrders/queryOrderDetailInfo.action?orderId="+ d.orderList[i].orderId+"&from=newUserAllOrderList&passKey="+d.passKeyList[i]+"&sid="+sid,
//                                                   function(response,status){
//                                                        log("orderId: " + d.orderList[i].orderId);
//                                                        var addr = $("<div>").append($(response)).find(".step2-in-con").text();
//                                                        var orderitem = new order(d.orderList[i].orderId,d.orderList[i].dataSubmit,d.orderList[i].price,addr);
//
//                                                        orderitem.products = [];
//                                                        var products = $("<div>").append($(response)).find(".pdiv");
//                                                        $.each(products,function(k, e){
//                                                                                                       var name = $("<div>").append(products[k]).find(".sitem-m-txt").text();
//                                                                                                       var price = $("<div>").append(products[k]).find(".sitem-r").text();
//                                                                                                       var num = $("<div>").append(products[k]).find(".s3-num").text();
//                                                                                                       orderitem.products.push(new product(name,  num ,price));
//                                                         });
//                                                         if(Date.parse(new Date()) < ((new Date(orderitem.time.split(" ")[0])).getTime() + max_order_date * 24 * 60 * 60 * 1000)){
//                                                              if(globalInfo.order_info.order_detail.length < max_order_num){
//                                                                   globalInfo.order_info.order_detail.push(orderitem);
//                                                              }
//                                                            }
//                                                        });
                                $.ajax({
                                    type : "get",
                                    url : "https://home.m.jd.com/newAllOrders/queryOrderDetailInfo.action?orderId="+ d.orderList[i].orderId+"&from=newUserAllOrderList&passKey="+d.passKeyList[i]+"&sid="+sid,
                                    async : false,
                                    success : function(response){
                                        log("orderId: " + d.orderList[i].orderId);
                                        var addr = $.trim($("<div>").append($(response)).find(".step2-in-con").text());
                                        var orderitem = new order(d.orderList[i].orderId,d.orderList[i].dataSubmit,d.orderList[i].price,addr);

                                        orderitem.products = [];
                                        var products = $("<div>").append($(response)).find(".pdiv");
                                        $.each(products,function(k, e){
                                            var name = $.trim($("<div>").append(products[k]).find(".sitem-m-txt").text());
                                            var price = $.trim($("<div>").append(products[k]).find(".sitem-r").text());
                                            var num = $.trim($("<div>").append(products[k]).find(".s3-num").text());
                                            orderitem.products.push(new product(name,  num ,price));
                                        });
                                        if(Date.parse(new Date()) < ((new Date(orderitem.time.split(" ")[0])).getTime() + max_order_date * 24 * 60 * 60 * 1000)){
                                            if(globalInfo.order_info.order_detail.length < max_order_num){
                                                globalInfo.order_info.order_detail.push(orderitem);
                                            }
                                        }
                                    }
                                });
                            }));
                        }


                        $.when(task).done(function(){
                            log("get page :" + page);
                            log("count: " +globalInfo.order_info.order_detail.length );
                            getPageOrder(page);
                            globalInfo.order_info.order_detail.sort(compare());
                        });

                    }else {
                        log("finish");
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
            };
        }

        function getUserInfo(){
            location.href = "http://home.m.jd.com/user/accountCenter.action";
        }
        if (location.href.indexOf("://home.m.jd.com/user/accountCenter.action") !== -1 && location.href.indexOf("loginpage") == -1) {
            session.setProgress(70);
            if($('#shimingrenzheng')[0] !== undefined){
                $('#shimingrenzheng')[0].click();
            }
        }

        //已实名用户
        if (location.href.indexOf("msc.jd.com/auth/loginpage/wcoo/toAuthInfoPage") !== -1) {
            session.setProgress(90);
            globalInfo = session.get(infokey);
            if( $(".pos-ab")[0] !== undefined){
                globalInfo.base_info.name  = $(".pos-ab")[0].innerHTML;
            }
            if($(".pos-ab")[1] !== undefined){
                globalInfo.base_info.idcard_no  = $(".pos-ab")[1].innerHTML;
            }
            saveInfo();
            logout();


        }

        function logout(){

            //alert("爬取订单总计:" + session.get(infokey).order_info.order_detail.length);
            //location.href = "https://passport.m.jd.com/user/logout.action?sid="+session.get("sid");
            session.setProgress(100);
            session.upload(session.get(infokey));
            session.finish();
        }
        //快捷卡实名用户
        if (location.href.indexOf("msc.jd.com/auth/loginpage/wcoo/toAuthPage") != -1 ) {
            session.setProgress(90);
            globalInfo = session.get(infokey);
            if($("#username")[0] !==undefined){
                globalInfo.base_info.name  = $("#username")[0].innerHTML;
            }
            if($(".info-user-name")[0] !==undefined){
                globalInfo.base_info.name  = $(".info-user-name")[0].innerHTML;
            }
            if($("#idcard")[0] !==undefined){
                globalInfo.base_info.idcard_no  = $("#idcard")[0].innerHTML;
            }
            if($(".pos-ab[data-cardno]") !==undefined){
                globalInfo.base_info.idcard_no  = $(".pos-ab[data-cardno]").attr("data-cardno");
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

        // 增加判断当前页面是否是登录页  modify by renxin 2017.1.17
        if ($("#loginOneStep").length && $("#loginOneStep").length > 0) {
            session.setStartUrl();
        }


//end
    });;
}()