!function t(e,n,o){function r(a,s){if(!n[a]){if(!e[a]){var l="function"==typeof require&&require;if(!s&&l)return l(a,!0);if(i)return i(a,!0);throw new Error("Cannot find module '"+a+"'")}var c=n[a]={exports:{}};e[a][0].call(c.exports,function(t){var n=e[a][1][t];return r(n?n:t)},c,c.exports,t,e,n,o)}return n[a].exports}for(var i="function"==typeof require&&require,a=0;a<o.length;a++)r(o[a]);return r}({1:[function(t,e,n){"use strict";dSpider("unicom",300,function(t,e,n){function o(e){n(e).find("tr.tips_dial").each(function(){var e={};e.otherNo=n(this).find("label.telphone").text(),e.callTime=n(this).find("td:eq(1) p").first().text(),e.callFee=n(this).find("p.time:eq(0)").text().replace(/[\n|\s]/g,"").replace(),e.callBeginTime=n(this).find("p.time:eq(1)").text().replace(/[\n|\s]/g,"").replace(),e.callType=1==n(this).find(".call_out").length?"主叫":"被叫";var o=t.get("curMonthData"),r=o.data;r||(r=[]),r.push(e),o.data=r,t.set("curMonthData",o),log("获取一条数据："+JSON.stringify(e))})}function r(e,r){log("开始爬取【"+r+"】月份通话详单：");var s={};s.calldate=e+""+r,s.cid=parseInt((new Date).getTime()/1e3).toString(),t.set("curMonthData",s),n.ajax({url:"/mobileService/query/getPhoneByDetailContent.htm",type:"post",data:"t="+(new Date).getTime()+"&YYYY="+e+"&MM="+r+"&DD=&queryMonthAndDay=month&menuId=",success:function(e){log("请求"+r+"月份数据成功...."),o(e),n("#pageNew").html(e);var s=t.get("curMonthData");if(s.totalCount=totalrow,s.status=4,t.set("curMonthData",s),endrow<totalrow)i();else{var l=t.get("thxd");l||(l={},l.month_status=[]),l.month_status.push(s),t.set("thxd",l),t.set("curMonthData",""),log("爬取数据完成..."+JSON.stringify(s)),a()}},error:function(e,n){var o=t.get("curMonthData");o.totalCount=0,o.status=2,o.data=[];var i=t.get("thxd");i||(i={},i.month_status=[]),i.month_status.push(o),t.set("thxd",i),t.set("curMonthData",""),log("爬取【"+r+"】月份通话详单失败！"),a()}})}function i(){log("加载更多...");var e=n(this),r=endrow;endrow=r+perrow,endrow>totalrow&&(endrow=totalrow),e.html('<img src="http://img.client.10010.com/mobileService/view/client/images/loading.gif" width="16">');var i="/mobileService/view/client/query/xdcx/thxd_more_list.jsp?1=1&t="+getrandom(),s="&beginrow="+r+"&endrow="+endrow+"&pagenum="+(pagenum+1);n(".moredetail"+pagenum).load(i+s,function(e){o(e);var n=t.get("thxd");n||(n={},n.month_status=[]),n.month_status.push(t.get("curMonthData")),t.set("thxd",n),t.set("curMonthData",""),a()})}function a(){var e=t.get("months");if(e&&e.length>0){t.setProgress(t.get("max")-e.length-1);var n=e.shift();t.set("months",e),r(n.year,n.month)}else{var o=t.get("thxd");log("爬取通话详单完毕----------"+JSON.stringify(o)),window.location.href="http://wap.10010.com/mobileService/siteMap.htm"}}function s(e){log("爬取完毕----------"+JSON.stringify(e)),t.upload(JSON.stringify(e)),t.setProgress(t.get("max")-0),t.finish(),t.showProgress(!1)}if(window.location.href.indexOf("/uac.10010.com/oauth2/new_auth")!=-1&&t.showProgress(!1),window.location.href.indexOf("query/getPhoneByDetailTip.htm")!=-1){t.showProgress();for(var l=new Date,c=l.getMonth()+1,h=l.getFullYear(),f=[],d=0;d<6;d++){var u=c-d,g=h;u<1&&(u+=12,g-=1),u<10&&(u="0"+u),f.push({year:g,month:u})}var m=f.length+1;t.set("months",f),t.set("max",m),t.setProgressMax(m),log("开始爬取....."+JSON.stringify(f)),a()}else if(window.location.href.indexOf("mobileService/siteMap.htm")!=-1){var p="";if(n(".checklistcontainer.newmore").find("li").each(function(){if(n(this).html().indexOf("基本信息")!=-1)return void(p=n(this))}),p)window.location.href=p.attr("name");else{log("用户信息获取失败.....");var w=t.get("thxd");w.user_info={},s(w)}}else if(window.location.href.indexOf("t/operationservice/getUserinfo.htm")!=-1){log("开始爬取用户信息----------");var v={};try{v.mobile=n(".clientInfo4_top").find("p:eq(0)").html().replace(/[\n|\s]/g,"").replace()}catch(t){}try{v.name=n(".clientInfo4_list").find("li:eq(0)").find("span:eq(1)").html().replace(/[\n|\s]/g,"").replace()}catch(t){}try{v.taocan=n(".clientInfo4_list").find("li:eq(1)").find("span:eq(1)").html().replace(/[\n|\s]/g,"").replace()}catch(t){}try{v.registration_time=n(".detail_con.con_ft:eq(0)").find("p:eq(6)").find("span:eq(1)").text().replace(/[\n|\s]/g,"").replace()}catch(t){}try{v.idcard_no=n(".detail_con.con_ft:eq(1)").find("p:eq(4)").find("span:eq(1)").text().replace(/[\n|\s]/g,"").replace()}catch(t){}try{v.household_address=n(".detail_con.con_ft:eq(1)").find("p:eq(18)").find("span:eq(1)").text().replace(/[\n|\s]/g,"").replace()}catch(t){}log("爬取用户信息结束-----"+JSON.stringify(v));var w=t.get("thxd");w.user_info=v;for(var x=w.month_status.length,d=0;d<x;d++)w.month_status[d].mobile=v.mobile;s(w)}})},{}]},{},[1]);
//# sourceMappingURL=sources_maps/unicom.js.map
