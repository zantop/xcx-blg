let util = require('../../utils/util.js');
Page({
    data: {
        warehouseId: '',//仓库id
        userId: '',//userid
        userName: '',//用户名
        pickHeaderInfo: {},//头部信息
        pickTasks: [],//拣货任务
        pickHeaderId: '',//拣货单id
        statusCode: '',//拣货状态
        noTips: false,//显示空页面
        isDiff: false,
    },
    onLoad(options) {
        const that = this
        that.setData({
            warehouseId: options.warehouseId,
            pickHeaderId: options.pickHeaderId,
            statusCode: options.statusCode,
        })
    },
    onShow() {
        const that = this
        //用户信息
        const userInfo = wx.getStorageSync("userInfo")
        that.setData({
            userId: userInfo.id,
            userName: userInfo.userName,
        })
        if (that.data.statusCode === '50' || that.data.statusCode === '60') {
            //如果是开始拣货，继续拣货
            that.pickGoAjax('queryPickTask')
        } else if (that.data.statusCode === '80') {
            //如果是查看详情 queryPickHeaderDetail
            that.pickGoAjax('queryPickHeaderDetail')
        }
    },
    //继续拣货
    pickGoAjax(url) {
        const that = this
        wx.hideLoading()
        wx.showLoading({
            title:'加载中...'
        })
        util.fetch('/urfresh/wms/app/v1/'+url, {
            "warehouseId": that.data.warehouseId,
            "pickHeaderId": that.data.pickHeaderId,
            "userId": that.data.userId,
            "userName": that.data.userName,
        }, res => {
            console.log(res)
            wx.hideLoading()
            if (res.result) {
                that.setData({
                    pickHeaderInfo: res.content.pickHeaderInfo,
                    pickTasks: res.content.pickTasks,
                })
            }else {
                wx.showModal({
                    title:'提示',
                    content:res.content
                })
            }
        })
    },
    //输入拣货数量
    actualFill(e) {
        const that = this
        const skucount = parseInt(e.target.dataset.allocqty) //分配拣货数量
        let fillNum = parseInt(e.detail.value); //输入数量
        const id = parseInt(e.target.dataset.id)
        let num = '';

        that.data.pickTasks.map((item) => {
            if (item.skuId === id) {
                //没有清空
                if (fillNum >= 0) {
                    item.pickNum = fillNum;
                    num = fillNum - skucount;
                    item.isDiff = true;
                } else {//清空了
                    item.isDiff = false;
                    item.pickNum = '';
                }
                item.diffNum = num;
                that.setData({
                    pickTasks: that.data.pickTasks
                })
            }
        })
    },

    //确认拣货
    pickOk(e) {
        let that = this;
        const skuId = parseInt(e.target.dataset.skuid)
        const allocqty = parseInt(e.target.dataset.allocqty)
        const pickNum = parseInt(e.target.dataset.picknum)
        if (isNaN(pickNum)) {
            wx.showModal({
                title: '提示',
                content: '请输入实际上架数量!',
            })
        } else if (parseInt(pickNum) > parseInt(allocqty)) {
            wx.showModal({
                title: '提示',
                content: '实际拣货数量超过分配数量，请重新输入!',
            })
        } else if (parseInt(pickNum) >= 0 && parseInt(pickNum) <= parseInt(allocqty)) {
            that.pickAjax(skuId, pickNum)
        }
    },
    //拣货ajax
    pickAjax(skuId, pickNum) {
        const that = this
        that.setData({
            pickTasks: []
        })
        util.fetch('/urfresh/wms/app/v1/doPickBySku', {
                "warehouseId": that.data.warehouseId,
                "pickHeaderId": that.data.pickHeaderId,
                "userId": that.data.userId,
                "userName": that.data.userName,
                skuId: skuId,
                pickQty: pickNum
        },res=> {
            if (res.result) {
                wx.hideLoading();
                that.setData({
                    pickHeaderInfo: res.content.pickHeaderInfo,
                    pickTasks: res.content.pickTasks,
                })
                wx.showToast({
                    title: '拣货成功！',
                    icon: 'success',
                    duration: 2000
                })
                //没有商品
                if (that.data.pickTasks.length <= 0) {
                    that.setData({
                        noTips: true
                    })
                }
            }else {
                wx.showModal({
                    title:'提示',
                    content:res.content
                })
            }
        })
    }
});