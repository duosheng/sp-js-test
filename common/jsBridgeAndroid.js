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
        f=safeCallback(f);
        f && f(_xy.getProgress());
    },
    showLoading: function (s) {
        _xy.showLoading(s || "正在爬取,请耐心等待...")
    },
    hideLoading: function () {
        _xy.hideLoading()
    },
    finish: function (errmsg, content, code) {
        this.finished=true;
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
    upload: function (value) {
        if (value instanceof Object) {
            value = JSON.stringify(value);
        }
        return _xy.push(this.key, value)
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
    openWithSpecifiedCore:function(url, core){
        _xy.openWithSpecifiedCore(url, core)
    },
    string: function (f) {
        this.data(function (d) {
            f || log(d)
            f && f(d)
        })
    }
};

apiInit();







