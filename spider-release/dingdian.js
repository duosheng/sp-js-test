(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/**
 * Created by du on 16/11/21.
 */
var sessionKey = dQuery(".index_block h1").text();
dSpider(sessionKey, function (session, env, $) {
    if (location.href.indexOf("/book/") != -1) {
        $(".more a").text("爬取本书").css("background", "#1ca72b");
    } else if (/.+html\/\d+\/\d+\/$/.test(location.href)) {
        var list;
        var curIndex;

        (function () {
            var getText = function getText() {
                var e = list.eq(curIndex);
                $.get(e.attr("href")).done(function (data) {
                    var text = e.text() + "\r\n";
                    text += $(data).find("#txt").text() + "\r\n";
                    session.upload(text);
                }).always(function () {
                    if (++curIndex < list.length) {
                        session.setProgress(curIndex);
                        session.setProgressMsg("正在爬取《" + sessionKey + "》 " + e.text());
                        getText();
                        log(curIndex, list.length);
                    } else {
                        session.setProgress(curIndex);
                        session.finish();
                    }
                });
            };

            log(sessionKey);
            list = $(".chapter li a");

            session.showProgress();
            session.setProgressMax(list.length);
            curIndex = 0;

            getText();
        })();
    }
});
},{}]},{},[1])
//# sourceMappingURL=sources_maps/dingdian.js.map
