function DataSession(key) {
    this.key = key;
    this.finished = false;
    _xy.start(key);
}

DataSession.getExtraData = function (f) {
    f = safeCallback(f);
    f && f(JSON.parse(_xy.getExtraData() || "{}"));
}

DataSession.getArguments= function (f) {
    return f(_xy.getArguments())
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
        isShow=isShow === undefined ? true : !!isShow;
        _resetTimer(isShow)
        _xy.showProgress(isShow);
    },
    setProgressMax: function (max) {
        _xy.setProgressMax(max);
    },
    setProgress: function (progress) {
        _xy.setProgress(progress);
    },
    finish: function (errmsg, content, code, stack) {
        var _log=this.get("__log");
        _log=_log?("\nLOG: \n"+_log):"";
        if($.type(content)!="string"){
            content=JSON.stringify(content)
        }
        this.finished = true;
        if (errmsg) {
            var ob = {
                url: location.href,
                msg: "Error msg:\n"+errmsg+_log,
                content: content || document.documentElement.outerHTML,
                netState:navigator.connection,
                args: this.getArguments&&this.getArguments()
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
    push:function(value){
        this.upload(value)
    },
    load: function (url, headers) {
        headers = headers || {}
        if (typeof headers !== "object") {
            alert("the second argument of function load  must be Object!")
            return
        }
        _xy.load(url, JSON.stringify(headers));
    },
    setStartUrl:function(u){
        _xy.setStartUrl(u)
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
        if(type!==-1) {
            this.set("__log", (this.get("__log")||"") + "> " + str+"\n");
        }
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
function DataSession(key) {
    this.key = key;
    this.finished = false;
    _xy.start(key);
}

DataSession.getExtraData = function (f) {
    f = safeCallback(f);
    f && f(JSON.parse(_xy.getExtraData() || "{}"));
}

DataSession.getArguments= function (f) {
    return f(_xy.getArguments())
}
apiInit();