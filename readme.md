

脚本拼接规则,最终拼接的脚本内容如下：

```javascript
!function(){
 var _su="http://xxxx"; //1 当前脚本地址
 [common/util.js] //2  util.js的内容
 [platform]Api.js //3 平台接口api,ios为jsBridgeIos.js，android为jsBridgeAndroid.js
 [业务脚本内容]//4 具体业务脚本内容(spider目录下)
}()
```

各业务起始地址：

电商：

```
淘宝：https://login.m.taobao.com/login.htm
京东：https://plogin.m.jd.com/user/login.action?appid=100
```

运营商：

```
联通：http://wap.10010.com/t/query/getPhoneByDetailTip.htm
移动：https://login.10086.cn/login.html?channelID=12003&backUrl=http://shop.10086.cn/i/?f=billdetailqry
支付宝：https://custweb.alipay.com/account/index.htm

```

邮箱：

```
新浪: "http://mail.sina.cn/?vt=4",
 qq: "https://w.mail.qq.com/cgi-bin/loginpage?f=xhtml",
163: "http://smart.mail.163.com/?dv=smart",
126: "http://smart.mail.126.com/"
```



## 工程构建说明

构建工具提供javascript语法检查、压缩混淆、ES6转ES5功能。

### 构建流程

语法检查－> es6转es5 －> 压缩混淆

### 使用

首先安装构建依赖，进入工程根目录下，执行：

```javascript
npm install
```

脚本提交之前，请先进行语法检查，否则编译机会build失败：检查命令

gulp hint:[脚本名称]

以京东为例：

```javascript
gulp hint:jd
```

### 构建整个工程

整个工程构建时会检查spider文件夹下所有脚本语法，命令：

```
gulp 或 npm run build
```

如果要在构建之后进行压缩混淆：

```
gulp js:r 或 npm run production
```

构建后的代码会保存在spider-release目录下。