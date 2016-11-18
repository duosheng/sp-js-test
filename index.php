<?php

header("Content-Type: text/javascript; charset=utf-8");
$srcTemplete="!function(){%s}()";
isset($_GET['refer'])||die("refer needed!");

$refer = iconv("UTF-8", "gbk", urldecode($_GET['refer']));

if(isset($_GET['platform'])) {
    $platform = iconv("UTF-8", "gbk", urldecode($_GET['platform']));
}

if($platform!="pc") {
    $src = file_get_contents("./common/utils.js") . "\r\n";
}

if($platform=="android"){
    $src.=file_get_contents("./common/jsBridgeAndroid.js");
}elseif($platform=="pc"){
    //no output
}
else{
    $src.= file_get_contents("./common/jsBridgeIos.js");
}
$sid=$_GET["sid"];
$all=array("jd","taobao","unicom");

if(in_array($sid,$all)){
    $src.="\r\n";
    $src.=file_get_contents( "./spider/$sid.js");
    $src.="\r\n";
}
printf($srcTemplete,$src);



