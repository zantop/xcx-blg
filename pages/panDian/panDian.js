let util = require('../../utils/util.js');
Page({
    data: {
        data: '',
        index: 0,
        siteList: [],
        whId: '',//仓库id
        userId: '',//userid
        userName: '',//用户名
        panDianList: [],//盘点单列表
        panDianData: '',//所有对象
        pageSize: 5,
        currentPage: 1,//当前页
        status: 0,//盘点单的状态
        noTips: false,//显示空页面

        loadFlag: true,

        loadingEnd: false,//是否加载完成
    },
    bindPickerChange: function (e) {
        const that = this
        let index = parseInt(e.detail.value)
        console.log(index)
        if (index !== 0) {
            that.setData({
                index: index,
                whId: that.data.siteList[index].warehouseId,
                currentPage: 1,
                panDianList: []
            });
            that.getList(that.data.currentPage, that.data.whId)
        }
    },
    /*00：初始化  开始盘点
     30:盘点中   继续盘点
     50：已盘点
     80：已处理    查看详情
     70：已失效*/

    //滚动到底部
    onReachBottom() {
        const that = this
        if (that.data.loadFlag) {
            that.setData({
                currentPage: that.data.currentPage + 1
            });
            //当前页数小于等于总页数加载更多
            if (that.data.currentPage <= that.data.panDianData.totalPage) {
                that.getList(that.data.currentPage, that.data.whId)
            } else {
                that.setData({
                    loadingEnd: true
                })
            }
        }
    },

    onShow() {
        const that = this
        const userInfo = wx.getStorageSync("userInfo")
        const siteList = wx.getStorageSync('siteList')//获取站点
        that.setData({
            userId: userInfo.id,
            userName: userInfo.userName,
            siteList: siteList,
            panDianList: [],
            currentPage: 1,
        })
        if (that.data.index !== 0) {
            that.getList(that.data.currentPage, that.data.whId)
        }
    },
    //盘点单列表
    getList(currentPage, whId) {
        const that = this;
        wx.hideLoading();
        wx.showLoading({
            title: '加载中...'
        })
        util.fetch("/urfresh/wms/app/v1/queryStockCountHeader", {
            warehouseId: whId,
            userId: that.data.userId,
            currentPage: currentPage,
            pageSize: that.data.pageSize

        }, res => {
            wx.hideLoading();
            if (res.result) {
                let list = [...that.data.panDianList, ...res.content.queryStockCountHeaderEntityList];
                that.setData({
                    panDianList: list,
                    panDianData: res.content,
                    loadFlag: true,
                    noTips: false,
                });
                //没有商品
                if (res.content.totalCount = 0) {
                    that.setData({
                        noTips: true
                    });
                }
            } else {
                that.setData({
                    noTips: true,
                    loadFlag: false,
                    panDianList: []
                })
                wx.showModal({
                    title: '提示',
                    content: res.content
                })
            }
            console.log(res);
        });
    },
    //生成盘点订单
    inventory() {
        this.getPanDianStatus(0, 0);
    },
    //开始或者继续盘点
    getPanDianStatus(i, o) {
        const that = this;
        util.fetch('/urfresh/wms/app/v1/createStockCount', {
            warehouseId: that.data.whId,
            userId: that.data.userId,
            isReCreate: i,
            opType: o
        }, res => {
            if (res.result) {
                that.setData({
                    panDianList: [],
                    currentPage: 1,
                })
                that.getList(that.data.currentPage, that.data.whId)
            } else {
                //若有未完成的的盘点单  :仍有尚未完成的盘点单，请确认操作
                //超时: 此盘点单相隔时效较长，请重新生成盘点单
                //错误信息直接弾出
                if (res.content == 'HAS_NOT_COMPLETED_DOC') {
                    //弹框 重新生成 opType=1
                    wx.showModal({
                        content: '仍有尚未完成的盘点单，请确认操作',
                        confirmText: '重新生成',
                        success: (e) => {
                            if (e.confirm) {
                                that.getPanDianStatus(1, 1);//重新生成盘点单
                            }
                        }
                    });
                } else {
                    wx.showToast({
                        title: res.content,
                    });
                }
            }
            console.log(res);
        });
    },
    //开始盘点
    start(e) {
        let that = this;
        let status = e.target.dataset.status;
        let id = e.target.dataset.id;
        let address = e.target.dataset.address;
        let orderCode = e.target.dataset.ordercode;
        let statusCode = '';
        if (status == '00') {
            statusCode = 1;
        } else if (status == '30') {
            statusCode = 0;
        } else {
            statusCode = 2;
        }

        //queryStockCountDetail接口
        //返回FIRST_STOCK_COUNT_EXPIRE  that.getPanDianStatus(1,2);
        //返回CONTINUE_STOCK_COUNT_EXPIRE  that.getPanDianStatus(1,2);
        // true 跳转到详情页


        util.fetch('/urfresh/wms/app/v1/queryStockCountDetail', {
            warehouseId: that.data.whId,
            userId: that.data.userId,
            orderId: id,
            isFirstStockCount: statusCode,
            partitionId: '',
            locId: '',
            currentPage: 1,
            pageSize: that.data.pageSize
        }, res => {
            if (res.result) {
                wx.navigateTo({
                    url: '../panDianInfo/panDianInfo?orderId=' + id +
                    "&warehouseId=" + this.data.whId +
                    "&isFirstStockCount=" + statusCode +
                    "&orderCode=" + orderCode +
                    "&address=" + address
                });
            } else {
                if (res.content == 'FIRST_STOCK_COUNT_EXPIRE' || res.content == 'CONTINUE_STOCK_COUNT_EXPIRE') {
                    wx.showModal({
                        content: '此盘点单相隔时效较长，请重新生成盘点单',
                        confirmText: '重新生成',
                        success: (e) => {
                            if (e.confirm) {
                                that.getPanDianStatus(1, 2);//重新生成盘点单
                            }
                        }
                    });
                } else if (res.content == 'FIRST_STOCK_COUNT_NOT_INIT_STATUS' || res.content == 'CONTINUE_STOCK_COUNT_INIT_STATUS' || res.content == 'CONTINUE_STOCK_COUNT_CONFIRMED_STATUS') {
                    wx.showModal({
                        content: '此盘点单状态已变化',
                        confirmText: '刷新页面',
                        success: (e) => {
                            if (e.confirm) {
                                that.getList(1, that.data.whId);//重新生成列表
                            }
                        }
                    });
                } else {
                    wx.showModal({
                        title: '提示',
                        content: res.content
                    })
                }
            }
        });
    },
    //退出登录
    bindLogOut() {
        util.logOut()
    }
});