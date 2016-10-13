/**
 * Created by du on 16/8/17.
 */
function setupWebViewJavascriptBridge(callback) {
    if (window.WebViewJavascriptBridge) { return callback(WebViewJavascriptBridge); }
    if (window.WVJBCallbacks) { return window.WVJBCallbacks.push(callback); }
    window.WVJBCallbacks = [callback];
    var WVJBIframe = document.createElement('iframe');
    WVJBIframe.style.display = 'none';
    WVJBIframe.src = 'wvjbscheme://__BRIDGE_LOADED__';
    document.documentElement.appendChild(WVJBIframe);
    setTimeout(function() { document.documentElement.removeChild(WVJBIframe) }, 0)
}

setupWebViewJavascriptBridge(function(bridge) {
    window.bridge=bridge;
});

function callHandler(){
    var f=arguments[2];
    if (f) {
        arguments[2] = safeCallback(f)
    }
    bridge.callHandler.apply(bridge,arguments);
}
window.local = {
    set: function (k, v) {
        log("save called")
        callHandler("save", {"key": k, "value": v})
    },

    get: function (k, f) {
        log("read called")
        callHandler("read",{"key":k} ,function (d) {
            f && f(d)
        })
    }
};

function DataSession(key) {
    this.key = key;
    log("start called")
    this.finished=false;
    callHandler("start", {"sessionKey":key})
}

DataSession.getExtraData = function (f) {
    log("getExtraData called")
    callHandler("getExtraData", null, function (data) {
        f && f(JSON.parse(data || "{}"))
    })
}

DataSession.prototype = {
    "save": function (obj) {
        log("set called")
        callHandler("set", {"sessionKey": this.key, "value": JSON.stringify(obj)})
    },
    "data": function (f) {
        log("get called")
        callHandler("get", {"sessionKey":this.key}, function (data) {
            f && f(JSON.parse(data || "{}"))
        })
    },
    "get": function (key, f) {
        this.data(function (d) {
            f && f(d[key])
        })
    },
    "set": function (key, value) {
        this.data(function (d) {
            d[key] = value;
            this.save(d)
        })
    },

    "showProgress": function (isShow) {
        log("showProgress called")
        callHandler("showProgress", {"show":isShow === undefined ? true : !!isShow});
    },
    "setProgressMax": function (max) {
        log("setProgressMax called")
        callHandler("setProgressMax", {"progress":max});
    },
    "setProgress": function (progress) {
        log("setProgress called")
        callHandler("setProgress", {"progress":progress});
    },
    "getProgress": function (f) {
        log("getProgressMax called")
        callHandler("getProgress",null, function (d) {
            f && f(d)
        })
    },
    "showLoading": function (s) {
        log("showLoading called")
        callHandler("showLoading",{"s":encodeURIComponent(s || "正在爬取,请耐心等待...")});
    },
    "hideLoading": function () {
        log("hideLoading called")
        callHandler("hideLoading");
    },
    "finish": function (errmsg, content, code) {
        var that=this;
        DataSession.getExtraData(function (d) {
            var ret = {"sessionKey":that.key, "result": 0, "msg": ""}
            if (errmsg) {
                var ob = {
                    url: location.href,
                    msg: errmsg,
                    content: content == undefined ? document.documentElement.outerHTML : content,
                    extra: d
                }
                ret.result = code || 2;
                ret.msg = JSON.stringify(ob);
            }
            log("finish called")
            that.finished=true;
            callHandler("finish", ret);

        })

    },
    "upload": function (value,f) {
        if (value instanceof Object) {
            value = JSON.stringify(value);
        }
        log("push called")
        f=f||function(b){log("push "+b)};
        callHandler("push", {"sessionKey": this.key, "value": encodeURIComponent(value)},f);
    },

    "string": function (f) {
        this.data(function (d) {
            f || log(d)
            f && f(d)
        })
    }
};
apiInit();





