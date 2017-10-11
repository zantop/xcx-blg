let util = require('../../utils/util.js');
Page({
    data: {
        index: 0,
        siteList: [],
        warehouseId: '',//仓库id
        currentPage: 1,//当前页
        pageSize: 2,//一页显示多少条
        totalPage: 0,//总共有多少页
        asnInfo: [],//上架列表
        noTips: false,//显示空页面

        loadingMore: false,//加载更多
        loadingMoreMsg: '加载更多...',//文字提示
        loadFlag: true
    },
    bindPickerChange: function (e) {
        const that = this
        let index = e.detail.value
        that.setData({
            index: index,
            warehouseId: that.data.siteList[index].warehouseId,
            asnInfo: [],
            currentPage: 1
        });
        if (index !== 0) {
            that.ajaxList(that.data.currentPage, that.data.warehouseId)
        }
    },
    //滚动到底部
    onReachBottom() {
        console.log('到底部了');
        const that = this
        if (that.data.loadFlag) {
            console.log(0)
            that.setData({
                loadingMore: true,
                currentPage: that.data.currentPage + 1,
                loadingMoreMsg: '加载更多...',//文字提示
            })
            //当前页数小于等于总页数加载更多
            if (that.data.currentPage <= that.data.totalPage) {
                that.ajaxList(that.data.currentPage, that.data.warehouseId)
            } else {
                that.setData({
                    loadingMoreMsg: '数据加载完成'
                })
            }
        }
    },
    onShow() {
        const that = this
        const siteList = wx.getStorageSync('siteList')//获取站点
        that.setData({
            siteList: siteList,
            currentPage: 1,
            asnInfo: [],
        })
        if (that.data.index !== 0) {
            that.ajaxList(that.data.currentPage, that.data.warehouseId)
        }
    },
    //请求数据
    ajaxList(currentPage, warehouseId) {
        const that = this;
        wx.hideLoading()
        wx.showLoading({
            title: '加载中',
        })
        util.fetch('/urfresh/wms/app/v1/queryAsnByWhId', {
            "warehouseId": warehouseId,
            "currentPage": currentPage,
            "pageSize": that.data.pageSize
        }, res => {
            wx.hideLoading()
            console.log('差擦擦擦')
            if (res.result) {
                let ztgAsnHeaderEntities = res.content.ztgAsnHeaderEntities.filter((item) => {
                    item.gmtCreate = util.change(item.gmtCreate)
                    return item
                })
                that.setData({
                    asnInfo: that.data.asnInfo.concat(ztgAsnHeaderEntities),
                    totalPage: res.content.totalPage,
                    loadingMore: false,
                    noTips: false,
                    loadFlag: true,
                })
                //没有商品
                if (that.data.asnInfo.length <= 0) {
                    that.setData({
                        noTips: true,
                        loadFlag: false,
                    })
                }
            } else {
                wx.showModal({
                    title:'提示',
                    content:res.content
                })
                that.setData({
                    noTips: true,
                    loadFlag: false
                })
            }
        })
    },
    //退出登录
    bindLogOut(){
        util.logOut()
    }
});