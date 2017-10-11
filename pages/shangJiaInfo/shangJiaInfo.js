let util = require('../../utils/util.js');
Page({
    data: {
        warehouseId: '',//仓库id
        asnId: '',//仓库id
        asnCode: '',//上架单号
        address: '',//上架地址
        asnStatus: '',//上架状态
        zoneAll: [],//上架区域
        zoneProAll: [],//所有区域上架商品
        currentTab: 0,//当前切换
        winWidth: 0,
        winHeight: 0,

        modalFlag: true,//超过10%
        noTips: false,//显示空页面
    },

    onLoad(options) {
        console.log(options)
        this.setData({
            warehouseId: options.warehouseId,
            asnId: options.asnId,
            asnCode: options.asnCode,
            address: options.address,
            asnStatus: options.asnStatus,
        })
    },
    //切换区域
    tabClick(e) {
        let index = e.target.dataset.index
        if (this.data.currentTab === index) {
            return false;
        } else {
            this.setData({
                currentTab: index
            })
        }
    },
    //滑块滑动
    bindChange(e) {
        this.setData({
            currentTab: e.detail.current
        });
    },
    onShow() {
        const that = this;
        /**
         * 获取系统信息
         */
        wx.getSystemInfo({
            success: function (res) {
                console.log(res)
                that.setData({
                    winWidth: res.windowWidth,
                    winHeight: res.windowHeight
                });
            }
        });
        //如果是去上架，继续上架
        if (that.data.asnStatus === '00' || that.data.asnStatus === '30') {
            that.putAwayGoAjax('queryNotCompleteAsnDetailGroupByZone');
        } else if (that.data.asnStatus === '99') {
            //如果上架完成，查看明细
            that.putAwayGoAjax('queryAsnDetailGroupByZone');
        }
    },
    //上架或继续上架ajax
    putAwayGoAjax(url) {
        const that = this
        wx.hideLoading()
        wx.showLoading({
            title: '加载中',
        })
        util.fetch('/urfresh/wms/app/v1/' + url, {
            warehouseId: that.data.warehouseId,
            asnId: that.data.asnId
        }, res => {
            //超时
            console.log(res)
            wx.hideLoading()
            let zoneArr = [];//区域
            let zonePro = [];//所有商品
            if (res.result) {
                res.content.forEach((val, index) => {
                    return zoneArr.push(res.content[index].zone)
                })
                res.content.forEach((val, index) => {
                    return zonePro.push(res.content[index].ztgAsnDetailEntities)
                })
                console.log(zoneArr)
                this.setData({
                    zoneAll: zoneArr,
                    zoneProAll: zonePro,
                })
                console.log(that.data.zoneProAll)
                //,没有商品
                if (res.content.length === 0) {
                    that.setData({
                        noTips: true
                    })
                }
            } else {
                wx.showModal({
                    title: '提示',
                    content: res.content
                })
            }

        })
    },
    //输入数量
    actualFill(e) {
        const that = this
        console.log(e)
        const skucount = parseInt(e.target.dataset.plannum)//应上数量
        const fillNum = parseInt(e.detail.value) //实际输入数量
        const id = parseInt(e.target.dataset.id)
        let num = '';

        that.data.zoneProAll.forEach((val, index) => {
            that.data.zoneProAll[index].map((item) => {
                if (item.skuId === id) {
                    //没有清空
                    if (fillNum >= 0) {
                        console.log(e)
                        item.pickNum = fillNum;
                        num = fillNum - skucount;
                        item.isDiff = true;
                    } else {//清空了
                        item.isDiff = false;
                        item.pickNum = '';
                    }
                    item.diffNum = num;
                    that.setData({
                        zoneProAll: that.data.zoneProAll
                    })
                }
            })
        })
    },
//确认上架
    putAwayOk(e) {
        const that = this
        const pickNum = parseInt(e.target.dataset.picknum)
        const planPutAwayQty = parseInt(e.target.dataset.plannum)

        console.log(pickNum)
        console.log(typeof pickNum)
        if (isNaN(pickNum)) {
            wx.showModal({
                title: '提示',
                content: '请输入实际上架数量!',
            })
        } else if (pickNum < 0) {
            wx.showModal({
                title: '提示',
                content: '实际上架数量不能为空!',
            })
        } else if (parseInt(pickNum) >= 0 && parseInt(pickNum) > parseInt(planPutAwayQty) * 1.1) {
            wx.showModal({
                title: '提示',
                content: '实际上架数量超过了应上数量的10%，是否继续上架？',
                success: function (res) {
                    if (res.confirm) {
                        that.putAwayOkAjax(e, pickNum, planPutAwayQty)
                    }
                }
            })
        } else {
            that.putAwayOkAjax(e, pickNum, planPutAwayQty)
        }
    }
    ,
//确定上架ajax
    putAwayOkAjax(e, pickNum, planPutAwayQty) {
        console.log(e)
        const that = this
        const id = parseInt(e.target.dataset.id)
        const skuId = parseInt(e.target.dataset.skuid)
        const locId = parseInt(e.target.dataset.locid)
        const locDesc = e.target.dataset.locdesc
        const warehouseId = parseInt(e.target.dataset.warehouseid)
        const asnHeaderId = this.data.asnId

        that.setData({
            zoneProAll: []
        })
        util.fetch('/urfresh/wms/app/v1/asnDetailPutAway', {
            id: id,
            skuId: skuId,
            locId: locId,
            locDesc: locDesc,
            planPutAwayQty: planPutAwayQty,
            actPutAwayQty: pickNum,
            warehouseId: warehouseId,
            asnHeaderId: asnHeaderId,
            userId:wx.getStorageSync("userInfo").id,
            userName:wx.getStorageSync("userInfo").userName
        }, res => {

            console.log(res)
            if (res.result) {
                let zoneArr = [];//区域
                let zonePro = [];//所有商品
                res.content.forEach((val, index) => {
                    return zoneArr.push(res.content[index].zone)
                })
                res.content.forEach((val, index) => {
                    return zonePro.push(res.content[index].ztgAsnDetailEntities)
                })
                console.log(zoneArr)
                this.setData({
                    zoneAll: zoneArr,
                    zoneProAll: zonePro,
                    loading: true
                })
                wx.showToast({
                    title: '上架成功！',
                    icon: 'success',
                    duration: 2000
                })
                if (res.content.length <= 0) {
                    that.setData({
                        noTips: true
                    })
                }
            } else {
                wx.showModal({
                    title: '提示',
                    content: res.content
                })
            }
        })
    }
})
;