let ajaxUrl = 'https://scm-h5.urfresh.cn';
//let ajaxUrl = 'https://test-scm-h5.urfresh.cn'; //测试连接;


//通用Ajax请求接口
let fetch = (url, datas, callback1) => {
    wx.request({
        url: ajaxUrl + url,
        method: 'POST',
        data: {
            reqData: JSON.stringify(datas),
            reqTime: +new Date(),
            jsessionid: wx.getStorageSync('userInfo') ? wx.getStorageSync('userInfo').jsessionid : ''
        },
        header: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        complete: function (res) {
            if (res.statusCode == 200) {
                //登录超时\
               // res.data.resultCode = -1
                if (res.data.resultCode == -1 || res.data.remark == '登录超时') {
                    wx.hideLoading()
                    wx.showToast({
                        title: '登录超时，请重新登录！',
                        icon: 'loading',
                        duration: 2000
                    })
                    wx.clearStorage()
                    setTimeout(function () {
                        wx.redirectTo({url: '../login/login'})
                    }, 1000)
                } else {
                    callback1.call(null, res.data);
                }
            } else {
                wx.hideLoading()
                wx.showModal({
                    title: '温馨提示',
                    content: '服务器错误' + (res.statusCode || '，连接超时')
                })
            }
        }
    })
}
//查询站点
let querySite = (userId) => {
    let defaultSelect = [{
        "warehouseId": '', "warehouseName": "请选择", "type": "default"
    }]
    //获取站点列表
    fetch("/urfresh/wms/app/v1/queryWhList", {
            userId: userId,
        },
        res => {
            if (res.result) {
                let siteList = [...defaultSelect, ...res.content];
                //存入本地
                wx.setStorageSync('siteList', siteList);
            }
        }
    )
}
//退出登录
let logOut = () => {
    //获取站点列表
    fetch("/urfresh/wms/app/v1/queryWhList", {
            userId: wx.getStorageSync("userInfo").id,
        },
        res => {
            if (res.result) {
                wx.hideLoading()
                wx.showToast({
                    title: '正在退出…',
                    icon: 'loading',
                    duration: 1000
                })
                //退出登录清空数据
                wx.clearStorageSync();
                //登录后站点信息存入本地
                setTimeout(() => {
                    wx.redirectTo({url: '../login/login'})
                }, 1000)
            }
        }
    )
}
//加法
let accAdd = (arg1, arg2) => {
    let r1, r2, m;
    try {
        r1 = arg1.toString().split(".")[1].length
    } catch (e) {
        r1 = 0
    }
    try {
        r2 = arg2.toString().split(".")[1].length
    } catch (e) {
        r2 = 0
    }
    m = Math.pow(10, Math.max(r1, r2))
    return (arg1 * m + arg2 * m) / m;
}

//减法
let Subtr = (arg1, arg2) => {
    let r1, r2, m;
    try {
        r1 = arg1.toString().split(".")[1].length
    } catch (e) {
        r1 = 0
    }
    try {
        r2 = arg2.toString().split(".")[1].length
    } catch (e) {
        r2 = 0
    }
    m = Math.pow(10, Math.max(r1, r2));
    return ((arg1 * m - arg2 * m) / m);
}

//乘法
let accMul = (arg1, arg2) => {
    let m = 0, s1 = arg1.toString(), s2 = arg2.toString();
    try {
        m += s1.split(".")[1].length
    } catch (e) {
    }
    try {
        m += s2.split(".")[1].length
    } catch (e) {
    }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m)
}

//相除
let accDiv = (arg1, arg2) => {
    let t1 = 0, t2 = 0, r1, r2;
    try {
        t1 = arg1.toString().split(".")[1].length;
    } catch (e) {
    }
    try {
        t2 = arg2.toString().split(".")[1].length;
    } catch (e) {
    }
    r1 = Number(arg1.toString().replace(".", ""));
    r2 = Number(arg2.toString().replace(".", ""));
    return (r1 / r2) * Math.pow(10, t2 - t1);
}

//时间转换
let change = (createTimestamp) => {
    Date.prototype.format = function (format) {
        if (isNaN(this)) return '';
        var o = {
            'm+': this.getMonth() + 1,
            'd+': this.getDate(),
            'h+': this.getHours(),
            'n+': this.getMinutes(),
            's+': this.getSeconds(),
            'S': this.getMilliseconds(),
            'W': ["日", "一", "二", "三", "四", "五", "六"][this.getDay()],
            'q+': Math.floor((this.getMonth() + 3) / 3)
        };
        if (format.indexOf('am/pm') >= 0) {
            format = format.replace('am/pm', (o['h+'] >= 12) ? '下午' : '上午');
            if (o['h+'] >= 12) o['h+'] -= 12;
        }
        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    }

    var postYear = new Date(createTimestamp).format('yyyy');
    var postMonth = new Date(createTimestamp).format('mm');
    var postDate = new Date(createTimestamp).format('dd');
    var postHours = new Date(createTimestamp).format('hh');
    var postMinutes = new Date(createTimestamp).format('nn');
    return postYear + '-' + postMonth + '-' + postDate + ' ' + postHours + ':' + postMinutes
}


//查询仓库
module.exports = {
    fetch: fetch,
    ajaxUrl: ajaxUrl,
    change: change,
    querySite: querySite,
    logOut:logOut
}

