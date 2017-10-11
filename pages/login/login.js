let util = require('../../utils/util.js');

Page({
    data: {
        userN: '',
        passW: '',
        phoneNumber: '12345678900',
        flag: true,
    },
    onShow() {
        //若用户名和密码都存在时直接跳转到拣货页
        if (wx.getStorageSync("userInfo")) {
            wx.switchTab({url: '../jianHuo/jianHuo'});
        }
    },
    //用户名和密码输入框事件
    userNameInput(e) {
        this.setData({
            userN: e.detail.value
        })
    },
    passWdInput(e) {
        this.setData({
            passW: e.detail.value
        })
    },


    loginBtnClick() {
        const self = this
        if (self.data.flag) {
            self.setData({
                flag: false
            })
            if (!self.data.userN || !self.data.passW) {
                self.setData({
                    flag: true,
                })
                wx.showModal({
                    title: '温馨提示',
                    content: '账号或密码不能为空，请重新输入!'
                })
                return
            } else {
                self.setData({
                    flag: true
                })
                util.fetch('/urfresh/pms/app/v1/doLogin', {
                    userName: self.data.userN,
                    password: self.data.passW
                }, res => {
                    console.log(res)
                    if (res.result) {
                        wx.showToast({
                            title: '登录中…',
                            icon: 'loading',
                            duration: 1000
                        })
                        //登录后用户名存入本地
                        wx.setStorageSync('userInfo', res.content);
                        //登录后站点信息存入本地
                        util.querySite(res.content.id)
                        setTimeout(() => {
                            wx.switchTab({url: '../jianHuo/jianHuo'})
                        }, 1000)
                    } else {
                        wx.showModal({
                            title: '温馨提示',
                            content: res.remark
                        })
                    }
                })
            }


        }
    },
    //拨打电话
    call() {
        const self = this;
        wx.makePhoneCall({
            phoneNumber: self.data.phoneNumber //仅为示例，并非真实的电话号码
        })
    }
})