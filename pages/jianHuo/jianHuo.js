let util = require('../../utils/util.js');

Page({
    data: {
        index: 0,
        siteList: [],
        warehouseId: '',//仓库id
        pickHeaders: [],//拣货单集合
        currentPage: 1,//当前页
        pageSize: 5,//一页显示多少条
        totalCount: 0,//总共有多少条数据
        noTips: false,//显示空页面
        loadingMore: false,//加载更多
        loadingMoreMsg: '加载更多...',//文字提示
        loadFlag: true,
    },
    bindPickerChange(e) {
        const that = this
        let index = parseInt(e.detail.value)
        console.log(index)
        console.log(typeof index)

        //选择站点时候
        if (index !== 0) {
            that.setData({
                index: index,
                warehouseId: that.data.siteList[index].warehouseId,
                pickHeaders: [],
                currentPage: 1
            });
            that.ajaxList(that.data.currentPage, that.data.warehouseId)

        }
    },
    //滚动到底部
    onReachBottom() {
        console.log('到底部了');
        const that = this
        if (that.data.loadFlag) {
            const totalPages = Math.ceil(that.data.totalCount / that.data.pageSize); //总共页数
            this.setData({
                loadingMore: true,
                loadingMoreMsg: '加载更多...',//文字提示
                currentPage: that.data.currentPage + 1,
            })
            //当前页数小于等于总页数加载更多
            if (that.data.currentPage <= totalPages) {
                that.ajaxList(that.data.currentPage, that.data.warehouseId)
            } else {
                that.setData({
                    loadingMore: false,
                    loadingMoreMsg: '数据加载完成'
                })
            }
        }
    },
    onShow(){
        const that = this
        const userInfo = wx.getStorageSync("userInfo") //获取用户信息
        const siteList = wx.getStorageSync('siteList')//获取站点
        that.setData({
            userId: userInfo.id,
            userName: userInfo.userName,
            siteList: siteList,
            currentPage: 1,
            pickHeaders: [],
        })
        if (that.data.index !== 0) {
            that.ajaxList(that.data.currentPage, that.data.warehouseId)
        }
    },
    //请求数据
    ajaxList(currentPage, warehouseId) {
        const that = this;
        wx.hideLoading();
        wx.showLoading({
            title:'加载中...'
        })
        util.fetch('/urfresh/wms/app/v1/queryPickHeader', {
            "warehouseId": warehouseId,
            "userId": that.data.userId,
            "userName": that.data.userName,
            "currentPage": currentPage,
            "pageSize": that.data.pageSize
        }, res => {
            console.log(res)
            wx.hideLoading()
            //查到数据
            if (res.result) {
                that.setData({
                    pickHeaders: that.data.pickHeaders.concat(res.content.pickHeaders),
                    loadingMore: false,
                    loadFlag: true,
                    noTips: false,
                    totalCount: res.content.totalCount,
                })
                //没有商品
                if (that.data.pickHeaders.length <= 0) {
                    that.setData({
                        noTips: true,
                        loadFlag: false
                    })
                }
            } else {
                that.setData({
                    noTips: true,
                    loadFlag: false
                })
                wx.showModal({
                    title:'提示',
                    content:res.content
                })
            }
        })
    },
    //退出登录
    bindLogOut(){
        util.logOut()
    }
});