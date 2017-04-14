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

function DataSession(key) {
    this.key = key;
    this.finished=false;
    callHandler("start", {"sessionKey":key})
}

DataSession.getExtraData = function (f) {
    callHandler("getExtraData", null, function (data) {
        f && f(JSON.parse(data || "{}"))
    })
}

DataSession.getArguments= function (f) {
    callHandler("getArguments", null, function (data) {
        f && f(data)
    })
}
DataSession.prototype = {
    _save: function () {
        callHandler("set", {"sessionKey": this.key, "value": JSON.stringify(this.data)})
    },
    _init: function (f) {
        var that=this;
        callHandler("get", {"sessionKey":this.key}, function (data) {
            that.data=JSON.parse(data || "{}");
            callHandler("read",{"key":that.key} ,function (data) {
                that.local=JSON.parse(data || "{}");
                f();
            })
        })
    },

    get: function (key) {
        return this.data[key];
    },
    set: function (key, value) {
        this.data[key]=value;
        this._save();
    },

    showProgress: function (isShow) {
        isShow=isShow === undefined ? true : !!isShow;
        _resetTimer(isShow)
        callHandler("showProgress", {"show":isShow});
    },
    setProgressMax: function (max) {
        callHandler("setProgressMax", {"progress":max});
    },
    setProgress: function (progress) {
        callHandler("setProgress", {"progress":progress});
    },
    setStartUrl:function(){
       this.set('__loginUrl',location.href);
    },
    finish: function (errmsg, content, code,stack) {
        var that=this;
        DataSession.getExtraData(function (d) {
            var ret = {"sessionKey":that.key, "result": 0, "msg": ""}
            var _log=that.get("__log");
            _log=_log?("\nLOG: \n"+_log):"";
            if (errmsg) {
                var ob = {
                    url: location.href,
                    msg: "Error msg:\n"+errmsg+_log,
                    args:that.getArguments&&that.getArguments(),
                    netState:navigator.connection,
                    content: content||document.documentElement.outerHTML
                }
                stack&&(ob.stack=stack);
                ret.result = code || 2;
                ret.msg = JSON.stringify(ob);
            }
            log("finish called")
            that.finished=true;
            callHandler("finish", ret);

        })

    },
    upload: function (value,f) {
        if (value instanceof Object) {
            value = JSON.stringify(value);
        }
        log("push called")
        f=f||function(b){log("push "+b)};
        callHandler("push", {"sessionKey": this.key, "value": encodeURIComponent(value)},f);
    },
    load:function(url,headers){
        headers=headers||{}
        if(typeof headers!=="object"){
            alert("the second argument of function load  must be Object!")
            return
        }
        callHandler("load",{url:url,headers:headers});
    },
    setUserAgent:function(str){
        callHandler("setUserAgent",{"userAgent":str})
    },

    openWithSpecifiedCore:function(){

    },

    autoLoadImg:function(load){
        callHandler("autoLoadImg",{"load":load===true})
    },

    string: function () {
        log(this.data)
    },
    setProgressMsg:function(str){
        if(!str) return;
        callHandler("setProgressMsg",{"msg":encodeURIComponent(str)})
    },
    log: function(str,type) {
        str=_logstr(str);
        console.log("dSpider: "+str)
        if(type!==-1) {
            this.set("__log", this.get("__log") + "\n> " + str);
        }
        callHandler("log",{"type":type||1,"msg":encodeURIComponent(str)})
    },
    setLocal: function (k, v) {
        this.local[k]=v;
        callHandler("save", {"key": this.key, "value": JSON.stringify(this.local)})
    },

    getLocal: function (k) {
        return this.local[k];
    }

};
apiInit();