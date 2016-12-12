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
    log: function(str) {
      str=str||"";
      if(typeof str !="string") {
         str=JSON.stringify(str);
      }
      console.log("dSpider: "+str)
      _xy.log(str)
    },
    setLocal: function (k, v) {
        this.local[k]=v
    },
    getLocal: function (k) {
        return this.local[k];
    }
};
apiInit();