(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

dSpider("jd", function (session, env, $) {
    var infokey = "infokey";
    var sid = session.get("sid");
    var max_order_num = 30;
    var max_order_date = 100;
    var globalInfo;
    var global_contact_info;

    // 登录页 缓存用户名密码
    if (location.href.indexOf("https://plogin.m.jd.com/user/login.action?appid=100") != -1) {
        //隐藏页面跳转链接
        if ($(".quick-nav") !== undefined) {
            $(".quick-nav").css("display", "none");
        }
        if ($(".quick-login") !== undefined) {
            $(".quick-login").css("display", "none");
        }
        if ($(".remberme") !== undefined) {
            $(".remberme").css("display", "none");
        }

        $("#username").val(session.getLocal("username"));
        $("#password").val(session.getLocal("password"));

        $("#loginBtn").click(function () {
            session.setLocal("password", $("#password").val());
            session.setLocal("username", $("#username").val());
        });
    }

    if (location.href.indexOf("://m.jd.com") !== -1) {
        if (session.get("firstrun") === undefined) {
            session.set("firstrun", 0);
            session.showProgress(true);
            session.setProgressMax(100);
            session.autoLoadImg(false);
            session.setProgress(5);
            session.setProgressMsg("正在处理,请稍加等待");
            if ($(".jd-search-form-input")[0] !== undefined) {
                sid = $(".jd-search-form-input").children()[0].value;
                session.set("sid", sid);
            }

            globalInfo = new info({}, {}, {});
            globalInfo.base_info.username = session.getLocal("username");
            saveInfo();
            session.setProgress(10);
            location.href = "https://home.m.jd.com/maddress/address.action?";
        } else {
            session.setProgress(100);
            session.upload(session.get(infokey));
            session.finish();
        }
    }

    if (location.href.indexOf("://home.m.jd.com/maddress") != -1) {
        session.setProgress(20);

        globalInfo = session.get(infokey);

        global_contact_info = new contact_info([]);
        var taskAddr = [];
        var urlarray = $(".ia-r");
        for (var i = 0; i < urlarray.length; i++) {
            taskAddr.push($.get(urlarray[i], getAddress));
        }

        $.when.apply($, taskAddr).done(function () {
            saveAddress();
        }).fail(function () {
            saveAddress();
        });
    }

    function saveAddress() {
        globalInfo.contact_info = global_contact_info;
        saveInfo();
        session.setProgress(30);
        getOrder();
    }

    function getAddress(node) {
        //var node = $("<div>").append($(response));
        var name = $.trim($(node).find("#uersNameId")[0].value);
        var phone = $.trim($(node).find("#mobilePhoneId")[0].value);
        var addr = $.trim($(node).find("#addressLabelId")[0].innerHTML);
        var detail = $.trim($(node).find("#address_where")[0].innerHTML);
        global_contact_info.contact_detail.push(new contact(name, addr, detail, phone, ""));
    }

    function getOrder() {
        session.setProgress(40);
        globalInfo = session.get(infokey);
        globalInfo.order_info = new order_info([]);
        globalInfo.order_info.order_detail = [];
        getPageOrder(1);
    }

    function getPageOrder(page) {
        $.getJSON("https://home.m.jd.com//newAllOrders/newAllOrders.json?sid=" + sid + "&page=" + page, function (d) {
            page++;
            var order_detail = globalInfo.order_info.order_detail;
            if (order_detail.length < max_order_num && d.orderList.length !== 0 && (order_detail.length === 0 || d.orderList[d.orderList.length - 1].orderId !== order_detail[order_detail.length - 1].orderId)) {
                var task = [];
                if (d.orderList.length + order_detail.length > max_order_num) {
                    d.orderList = d.orderList.slice(0, max_order_num - order_detail.length);
                }
                task.push($.each(d.orderList, function (i) {
                    return $.get("https://home.m.jd.com/newAllOrders/queryOrderDetailInfo.action?orderId=" + d.orderList[i].orderId + "&from=newUserAllOrderList&passKey=" + d.passKeyList[i] + "&sid=" + sid, function (response) {
                        var addr = $.trim($(response).find(".step2-in-con").text());
                        var orderitem = new order(d.orderList[i].orderId, d.orderList[i].dataSubmit, d.orderList[i].price, addr);

                        orderitem.products = [];
                        var products = $(response).find(".pdiv");
                        $.each(products, function (k) {
                            var name = $.trim(products.eq(k).find(".sitem-m-txt").text());
                            var price = $.trim(products.eq(k).find(".sitem-r").text());
                            var num = $.trim(products.eq(k).find(".s3-num").text());
                            orderitem.products.push(new product(name, num, price));
                        });
                        if (Date.parse(new Date()) < new Date(orderitem.time.split(" ")[0]).getTime() + max_order_date * 24 * 60 * 60 * 1000) {
                            if (globalInfo.order_info.order_detail.length < max_order_num) {
                                globalInfo.order_info.order_detail.push(orderitem);
                            }
                        }
                    });
                }));

                $.when(task).done(function () {
                    getPageOrder(page);
                }).fail(function () {
                    getPageOrder(page);
                });
            } else {
                saveInfo();
                session.setProgress(60);
                getUserInfo();
                return;
            }
        });
    }

    function getUserInfo() {
        location.href = "https://home.m.jd.com/user/accountCenter.action";
    }

    if (location.href.indexOf("://home.m.jd.com/user/accountCenter.action") !== -1 && location.href.indexOf("loginpage") == -1) {
        session.setProgress(70);
        if ($('#shimingrenzheng')[0] !== undefined) {
            $('#shimingrenzheng')[0].click();
        }
    }

    //已实名用户
    if (location.href.indexOf("msc.jd.com/auth/loginpage/wcoo/toAuthInfoPage") !== -1) {
        session.setProgress(90);
        globalInfo = session.get(infokey);
        if ($(".pos-ab")[0] !== undefined) {
            globalInfo.base_info.name = $(".pos-ab")[0].innerHTML;
        }
        if ($(".pos-ab")[1] !== undefined) {
            globalInfo.base_info.idcard_no = $(".pos-ab")[1].innerHTML;
        }
        saveInfo();
        logout();
    }

    //快捷卡实名用户
    if (location.href.indexOf("msc.jd.com/auth/loginpage/wcoo/toAuthPage") != -1) {
        session.setProgress(90);
        globalInfo = session.get(infokey);
        if ($("#username")[0] !== undefined) {
            globalInfo.base_info.name = $("#username")[0].innerHTML;
        }
        if ($(".info-user-name")[0] !== undefined) {
            globalInfo.base_info.name = $(".info-user-name")[0].innerHTML;
        }
        if ($("#idcard")[0] !== undefined) {
            globalInfo.base_info.idcard_no = $("#idcard")[0].innerHTML;
        }
        if ($(".pos-ab[data-cardno]") !== undefined) {
            globalInfo.base_info.idcard_no = $(".pos-ab[data-cardno]").attr("data-cardno");
        }

        saveInfo();
        logout();
    }

    function logout() {
        //alert("爬取订单总计:" + session.get(infokey).order_info.order_detail.length);
        location.href = "https://passport.m.jd.com/user/logout.action?sid=" + session.get("sid");
    }

    function saveInfo() {
        session.set(infokey, globalInfo);
    }

    function info(base, contact, order) {
        this.site_id = 2;
        this.base_info = base;
        this.contact_info = contact;
        this.order_info = order;
    }

    function contact_info(contact_detail) {
        this.contact_detail = contact_detail;
    }

    function contact(name, location, address, phone, zipcode) {
        this.name = name;
        this.location = location;
        this.address = address;
        this.phone = phone;
        this.zipcode = zipcode;
    }

    function order_info(order_detail) {
        this.order_detail = order_detail;
    }

    function order(id, time, total, address) {
        this.id = id;
        this.time = time;
        this.total = total;
        this.address = address;
    }

    function product(name, number, price) {
        this.name = name;
        this.number = number;
        this.price = price;
    }

    // 增加判断当前页面是否是登录页  modify by renxin 2017.1.17
    if ($("#loginOneStep").length && $("#loginOneStep").length > 0) {
        session.setStartUrl();
    }

    //end
});
},{}]},{},[1])