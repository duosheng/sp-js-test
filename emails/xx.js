var t = {
    "shareData": {
        "picUrl": "https://dn-xiaoying-static.qbox.me/hongbao-1473820916955.png",
        "qrUrl": "https://cardloan.xiaoying.com/1.1/user/shareLink ",
        "smsContent": "邀请您一起使用小赢卡贷.新用户注册送100元红包,5万额度,5秒极速放款, 直接戳",
        "shareUrl": "https://cardloan.xiaoying.com/1.1/user/shareLink ",
        "title": "拆开就有100元！快来体验信用卡还款神器！",
        "content": "您的好友向您推荐小赢卡贷，并送您一个100元红包。"
    },
    "useData": {
        "inviteCouponMoney": "20元~80元",
        "inviteCouponContent": "邀请好友注册，可随机获得20～80元红包，还款时可抵扣还款金额。"
    },
    "balance_type": [
        {
            "balanceType": "ALL",
            "balanceTypeName": "全部"
        },
        {
            "balanceType": "RECHARGE",
            "balanceTypeName": "充值"
        },
        {
            "balanceType": "WITHDRAW",
            "balanceTypeName": "提现"
        },
        {
            "balanceType": "INVEST",
            "balanceTypeName": "投资"
        },
        {
            "balanceType": "REPAY_IN",
            "balanceTypeName": "回款"
        },
        {
            "balanceType": "REALIZE",
            "balanceTypeName": "转让"
        },
        {
            "balanceType": "USER_COMMISSION_IN",
            "balanceTypeName": "邀请有奖"
        },
        {
            "balanceType": "LOAN_IN",
            "balanceTypeName": "借款"
        },
        {
            "balanceType": "REPAY_OUT",
            "balanceTypeName": "还款"
        },
        {
            "balanceType": "PLATFORM_SERVICE_FEE_OUT",
            "balanceTypeName": "平台服务费"
        },
        {
            "balanceType": "INSURANCE_OUT",
            "balanceTypeName": "保费"
        },
        {
            "balanceType": "BUY_CURRENT",
            "balanceTypeName": "活期转入"
        },
        {
            "balanceType": "SELL_CURRENT",
            "balanceTypeName": "活期卖出"
        }
    ],
    "eq": {
        "1": "$amount/0.98 + $amount/0.98*(0.055+0.008+0.06+0.08)/12",
        "2": "$amount/0.98 + $amount/0.98*(0.058+0.008+0.06+0.08)*2/12",
        "3": "$amount/0.98*((0.062/12)*FUNCTION(1+0.062/12, 'pow:', 3))/(FUNCTION(1+0.062/12,'pow:' , 3)-1)+(0.003+0.04+0.09)*$amount/0.98/12",
        "6": "$amount/0.98*((0.072/12)*FUNCTION(1+0.072/12, 'pow:', 6))/(FUNCTION(1+0.072/12,'pow:' , 6)-1)+(0.003+0.04+0.09)*$amount/0.98/12",
        "9": "$amount/0.98*((0.075/12)*FUNCTION(1+0.075/12, 'pow:', 9))/(FUNCTION(1+0.075/12,'pow:' , 9)-1)+(0.003+0.04+0.09)*$amount/0.98/12",
        "12": "$amount/0.98*((0.08/12)*FUNCTION(1+0.08/12, 'pow:', 12))/(FUNCTION(1+0.08/12,'pow:' , 12)-1)+(0.003+0.04+0.09)*$amount/0.98/12"
    },
    "cash_eq": {
        "3": "$amount/0.95*((0.062/12)*FUNCTION(1+0.062/12, 'pow:', 3))/(FUNCTION(1+0.062/12,'pow:' , 3)-1)+(0.003+0.25)*$amount/0.95/12",
        "6": "$amount/0.95*((0.072/12)*FUNCTION(1+0.072/12, 'pow:', 6))/(FUNCTION(1+0.072/12,'pow:' , 6)-1)+(0.003+0.25)*$amount/0.95/12",
        "9": "$amount/0.91*((0.075/12)*FUNCTION(1+0.075/12, 'pow:', 9))/(FUNCTION(1+0.075/12,'pow:' , 9)-1)+(0.003+0.25)*$amount/0.91/12",
        "12": "$amount/0.91*((0.08/12)*FUNCTION(1+0.08/12, 'pow:', 12))/(FUNCTION(1+0.08/12,'pow:' , 12)-1)+(0.003+0.25)*$amount/0.91/12"
    },
    "loan_rate": {
        "1": "0.055",
        "2": "0.058",
        "3": "0.062",
        "6": "0.072",
        "9": "0.075",
        "12": "0.08"
    },
    "loan_amount_range": {
        "min_cent": 200000,
        "max_cent": 5000000
    },
    "cash_loan_amount_range": {
        "max_cent": 500000,
        "min_cent": 100000
    },
    "youdai_eq": {
        "12": "$amount*((0.08/12)*FUNCTION(1+0.08/12, 'pow:', 12))/(FUNCTION(1+0.08/12,'pow:' , 12)-1)+(0.006)*$amount",
        "24": "$amount*((0.08/12)*FUNCTION(1+0.08/12, 'pow:', 24))/(FUNCTION(1+0.08/12,'pow:' , 24)-1)+(0.006)*$amount",
        "36": "$amount*((0.08/12)*FUNCTION(1+0.08/12, 'pow:', 36))/(FUNCTION(1+0.08/12,'pow:' , 36)-1)+(0.006)*$amount",
    },
    "youdai_loan_rate": {
        "12": "0.08",
        "24": "0.08",
        "36": "0.08"
    },
    "youdai_loan_amount_range": {
        "min": 30000,
        "max": 800000,
        "min_cent": 3000000,
        "max_cent": 80000000
    }
};