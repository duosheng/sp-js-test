<?php
    header("Content-Type: text/javascript; charset=utf-8");
    isset($_GET['refer'])||die("refer needed!");
    $refer = iconv("UTF-8", "gbk", urldecode($_GET['refer']));
    $platform = isset($_GET['platform'])&&iconv("UTF-8", "gbk", urldecode($_GET['platform']));
    echo file_get_contents("../common/utils.js");
    if($platform=="android"){
        echo file_get_contents("../common/jsBridgeAndroid.js");
    }else{
        echo file_get_contents("../common/jsBridgeIos.js");
    }

    if (stripos($refer, "mail.qq") !== false||stripos($refer, "qq.com/cgi-bin/login") !== false) {
        echo file_get_contents( "qq.js");
    } else if (stripos($refer, "mail.163") !== false || stripos($refer, "mail.126") !== false) {
        echo file_get_contents("netease.js");
    }else if(stripos($refer, "mail.sina") !== false ){
        echo file_get_contents("sina.js");
    }


