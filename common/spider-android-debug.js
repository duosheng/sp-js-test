/**
 * Created by du on 16/9/1.
 */

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

function log(){
    for(var i=0;i<arguments.length;++i)  {
        var str=arguments[i];
        str = typeof str !== "string" ? JSON.stringify(str) : str;
        console.log("xy log: "+ str);
    }
}
//异常捕获
function errorReport(e){
    var stack=e.stack.replace(/http.*?inject\.php.*?:/ig," "+_su+":");
    console.error("dSpider: 语法错误: " + e.message + stack) ;
    window.curSession && curSession.finish(e, "",3,stack);
}

String.prototype.endWith = function (str) {
    if (!str) return false;
    return this.substring(this.length - str.length) === str;
};

//queryString helper
window.qs = [];
var s = decodeURI(location.search.substr(1));
var a = s.split('&');
for (var b = 0; b < a.length; ++b) {
    var temp = a[b].split('=');
    qs[temp[0]] = temp[1] ? temp[1] : null;
}
MutationObserver = window.MutationObserver ||
    window.WebKitMutationObserver ||
    window.MozMutationObserver;



function  safeCallback(f){
    if (!(f instanceof Function)) return f;
    return function (){
        try {
            f.apply(this,arguments)
        }catch (e){
            errorReport(e)
        }
    }
}
//设置dQuery异常处理器
dQuery.safeCallback=safeCallback;
dQuery.errorReport=errorReport;


function hook(fun){
    return function() {

        if (!(arguments[0] instanceof Function)) {
            t=arguments[0];
            log("warning: "+fun.name+" first argument should be function not string ")
            arguments[0]=function(){eval(t)};
        }
        arguments[0]=safeCallback(arguments[0]);

        return fun.apply(this,arguments)

    }
}

//hook setTimeout,setInterval异步回调
var setTimeout=hook(window.setTimeout);
var setInterval=hook(window.setInterval);

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
function apiInit(){
    dQuery.noConflict();
    var withCheck=function (attr){
        var f= DataSession.prototype[attr];
        return function (){
            if(this.finished){
                log("call "+attr+" ignored, finish has been called! ")
            }else {
                return f.apply(this,arguments);
            }
        }
    }
    for (var attr in DataSession.prototype){
        DataSession.prototype[attr]=withCheck(attr);
    }
    var t = setInterval(function () {
        if (!(window._xy||window.bridge)) {
            return;
        }
        window.xyApiLoaded=true;
        clearInterval(t);
    }, 20);
}

//爬取入口
function dSpider(sessionKey, callback) {
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
            DataSession.getExtraData(function (extras) {
                $(safeCallback(function(){
                    $("body").on("click","a",function(){
                        $(this).attr("target",function(_,v){
                            if(v=="_blank") return "_self"
                        })
                    })
                    log("dSpider start!")
                    callback(session, extras, $);
                }))
            })
        })
    }, 20);
}

var dSpiderLocal = {
    set: function (k, v) {
        return _xy.save(k, v)
    },
    get: function (k, f) {
        f && f(_xy.read(k))
    }
};

function DataSession(key) {
    this.key = key;
    this.finished=false;
    _xy.start(key);
}

DataSession.getExtraData = function (f) {
    f=safeCallback(f);
    f && f(JSON.parse(_xy.getExtraData() || "{}"));
}

//js bridge api
DataSession.prototype = {
    _save: function () {
        return _xy.set(this.key, JSON.stringify(this.data));
    },
    _init: function (f) {
        this.data = JSON.parse(_xy.get(this.key) || "{}");
        f()
    },

    get: function (key) {
        return this.data[key];
    },
    set: function (key, value) {
        this.data[key]=value;
    },

    "showProgress": function (isShow) {
        _xy.showProgress(isShow === undefined ? true : !!isShow);
    },
    "setProgressMax": function (max) {
        _xy.setProgressMax(max);
    },
    "setProgress": function (progress) {
        _xy.setProgress(progress);
    },
    "getProgress": function (f) {
        f=safeCallback(f);
        f && f(_xy.getProgress());
    },
    "showLoading": function (s) {
        _xy.showLoading(s || "正在处理,请耐心等待...")
    },
    "hideLoading": function () {
        _xy.hideLoading()
    },
    "finish": function (errmsg, content, code) {
        this.finished=true;
        this.hideLoading();
        this.showProgress(false);
        if (errmsg) {
            var ob = {
                url: location.href,
                msg: errmsg,
                content: content||document.documentElement.outerHTML ,
                extra: _xy.getExtraData()
            }
            return _xy.finish(this.key || "", code || 2, JSON.stringify(ob));
        }
        return _xy.finish(this.key || "", 0, "")
    },
    load:function(url,headers){
        headers=headers||{}
        if(typeof headers!=="object"){
            alert("the second argument of function load  must be Object!")
            return
        }
        _xy.load(url,JSON.stringify(headers));
    },
    setUserAgent:function(str){
        _xy.setUserAgent(str)
    },
    "upload": function (value) {
        if (value instanceof Object) {
            value = JSON.stringify(value);
        }
        return _xy.push(this.key, value)
    },

    "openWithSpecifiedCore":function(url, core){
        _xy.openWithSpecifiedCore(url, core)
    },

    autoLoadImg:function(load){
        _xy.autoLoadImg(load)
    },

    "string": function () {
        log(this.data)
    },
    setProgressMsg:function(str){
        if(!str) return;
        _xy.setProgressMsg(str);
    },
    log: function(str) {
        str=str||"";
        if(typeof str !="string") {
            str=JSON.stringify(str);
        }
        console.log("dSpider: "+str)
        _xy.log(str)
    }
};
apiInit();












