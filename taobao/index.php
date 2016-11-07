<?php

    header("Content-Type: text/javascript; charset=utf-8");
    $srcTemplete="!function(){%s}()";
    isset($_GET['refer'])||die("refer needed!");
    $refer = iconv("UTF-8", "gbk", urldecode($_GET['refer']));
    $platform = isset($_GET['platform'])&&iconv("UTF-8", "gbk", urldecode($_GET['platform']));
    $src=file_get_contents("../common/utils.js")."\r\n";

    if($platform=="android"){
        $src.=file_get_contents("../common/jsBridgeAndroid.js");
    }else{
        $src.= file_get_contents("../common/jsBridgeIos.js");
    }
    if (stripos($refer, "jd.com") !== false||stripos($refer, "qq.com/cgi-bin/login") !== false) {
        $src.="\r\n".file_get_contents( "taobao_spider.js");
    }

   printf($srcTemplete,$src);


