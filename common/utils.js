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
    var msg="语法错误: " + e.message +"\nscript_url:"+_su+"\n"+ e.stack
    if(window.curSession){
        curSession.log(msg);
        curSession.finish(e.message,"",2,msg);
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
            window.curSession = session;
            DataSession.getExtraData(function (extras) {
                DataSession.getArguments(function(args){
                    session.getArguments=function(){
                        return JSON.parse(args||"{}")
                    }
                    $(safeCallback(function(){
                        $("body").on("click","a",function(){
                            $(this).attr("target",function(_,v){
                                if(v=="_blank") return "_self"
                            })
                        })
                        log("dSpider start!")
                        extras.config=typeof _config==="object"?_config:"{}";
                        callback(session, extras, $);
                    }))
                })
            })
        })
    }, 20);
}

dQuery(function(){
    if(window.onSpiderInited){
      window.onSpiderInited(dSpider.bind(5));
    }
})
