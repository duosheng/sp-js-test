<?php

header("Content-Type: text/javascript; charset=utf-8");

if(isset($_GET['platform'])) {
    $platform = iconv("UTF-8", "gbk", urldecode($_GET['platform']));
}
$src = file_get_contents("./common/utils.js") . "\r\n";
if($platform=="android"){
    $src.=file_get_contents("./common/jsBridgeAndroid.js");
}elseif($platform=="pc"){
    $src.=file_get_contents("./common/jsBridgePc.js");
}
else{
    $src.= file_get_contents("./common/jsBridgeIos.js");
}

if(strpos($_SERVER['HTTP_USER_AGENT'], 'iPhone')||strpos($_SERVER['HTTP_USER_AGENT'], 'iPad')){
    $src.= file_get_contents("./common/jsBridgeIos.js");
}else if(strpos($_SERVER['HTTP_USER_AGENT'], 'Android')){
    $src.=file_get_contents("./common/jsBridgeAndroid.js");
}else{
    $src.=file_get_contents("./common/jsBridgePc.js");
}
echo $src;



