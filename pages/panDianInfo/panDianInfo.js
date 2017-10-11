let util = require('../../utils/util.js');
/*let cause = [{key: -1, value: '差异原因'},
    {key: 'DO_PROFIT_LOSS_REASON_13', value: '盘盈'},
    {key: 'DO_PROFIT_LOSS_REASON_12', value: '盘亏'},
    {key: 'DO_PROFIT_LOSS_REASON_9', value: '品质耗损'},
    {key: 'DO_PROFIT_LOSS_REASON_2', value: '临时下架'},
    {key: 'DO_PROFIT_LOSS_REASON_20', value: '换品下架'}];*/
let cause1 = [{key: -1, value: '差异原因'},
    {key: 'DO_PROFIT_LOSS_REASON_13', value: '盘盈'},
    {key: 'DO_PROFIT_LOSS_REASON_9', value: '品质耗损'},
    {key: 'DO_PROFIT_LOSS_REASON_2', value: '临时下架'},
    {key: 'DO_PROFIT_LOSS_REASON_20', value: '换品下架'}];
let cause2 = [{key: -1, value: '差异原因'},
    {key: 'DO_PROFIT_LOSS_REASON_12', value: '盘亏'},
    {key: 'DO_PROFIT_LOSS_REASON_9', value: '品质耗损'},
    {key: 'DO_PROFIT_LOSS_REASON_2', value: '临时下架'},
    {key: 'DO_PROFIT_LOSS_REASON_20', value: '换品下架'}];
Page({
    data: {
        data: '',
        pageSize: 10,
        cause1: cause1,//盘盈
        cause2: cause2,//盘亏
        causeIndex: 0,//默认选择差异原因的下标
        itemList: [],
        detailData: '',
        option: {},//参数对象
        kuArr: [],//区位
        cengArr: [],//层位
        quIndex: 0,
        cengIndex: 0,
        quCurrentIndex: 0,//区位当前选中的index值
        cengCurrentIndex: 0,//层位当前选中的index值
        quCurrentId: '',//区位当前选中的id值
        cengCurrentId: '',//层位当前选中的id值
        panDianStaus: '',//盘点单状态
        itemListNull: false,//盘点状态是否为空
        userId: '',//userid
        userName: '',//用户名
    },
    onLoad(option) {
        let that = this;
        that.setData({
            option: option,
            panDianStaus: option.isFirstStockCount
        });
    },
    onShow() {
        const that = this
        const userInfo = wx.getStorageSync("userInfo")
        this.setData({
            userId: userInfo.id,
            userName: userInfo.userName,
        })
        that.getDetailList(1);//默认请求所有数据
    },
    getDetailList(currentPage) {
        const that = this;
        wx.hideLoading();
        wx.showLoading({
            title: '加载中...'
        })
        util.fetch('/urfresh/wms/app/v1/queryStockCountDetail', {
            warehouseId: that.data.option.warehouseId,
            userId: that.data.userId,
            orderId: that.data.option.orderId,
            isFirstStockCount: that.data.panDianStaus,
            partitionId: that.data.quCurrentId,
            locId: that.data.cengCurrentId,
            currentPage: currentPage,
            pageSize: that.data.pageSize

        }, res => {
            wx.hideLoading();
            if (res.result) {
                that.setData({detailData: res.content});
                if (res.content.totalCount > 0) {
                    if (that.data.quCurrentId && that.data.cengCurrentId) {
                        let list = res.content.stockCountPartitionGroupInfoList[0].stockCountLocGroupInfoList[0].queryStockCountDetailEntityList;
                        that.getpanDianList(list);
                    } else {
                        that.getPosition(res.content.stockCountPartitionGroupInfoList);
                    }
                } else {
                    that.setData({
                        itemListNull: true,
                        itemList: [],
                        quCurrentId: '',
                        cengCurrentId: ''
                    });
                    that.getDetailList(1);//重新请求所有数据
                }
            } else {
                if (res.content == 'FIRST_STOCK_COUNT_EXPIRE' || res.content == 'CONTINUE_STOCK_COUNT_EXPIRE') {
                    wx.showModal({
                        content: '此盘点单相隔时效较长，请回盘点单页后点击生成盘点单',
                        confirmText: '确定',
                        success: (e) => {
                            if (e.confirm) {
                                //返回上一页
                                wx.navigateTo({url: '../panDian/panDian'});
                            }
                        }
                    });
                } else if (res.content == 'CONTINUE_STOCK_COUNT_CONFIRMED_STATUS') {//已盘点完
                    wx.showModal({
                        content: '此盘点单已全部完成盘点',
                        confirmText: '确定',
                        success: (e) => {
                            if (e.confirm) {
                                //返回上一页
                                wx.navigateTo({url: '../panDian/panDian'});
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
    //获取库区库位列表
    getPosition(list) {
        let _list = [];//区位
        let _cengList = [];//层位
        list.map((quItem, index) => {
            quItem.stockCountLocGroupInfoList.map((cengItem, index) => {
                cengItem.cengIndex = index;
            });
            _cengList.push(quItem.stockCountLocGroupInfoList);
            _list.push({
                partitionId: quItem.partitionId,
                partitionName: quItem.partitionName,
                quIndex: index
            });
        });
        this.setData({
            kuArr: _list,
            cengArr: _cengList
        });
        this.getpanDianList();
    },
    //库区选择
    quChoice(e) {
        let index = e.currentTarget.dataset.index;
        this.setData({quCurrentIndex: index, itemList: []});
        this.getpanDianList();
    },
    //层区选择
    cengChoice(e) {
        let index = e.currentTarget.dataset.index;
        this.setData({cengCurrentIndex: index, itemList: []});
        this.getpanDianList();
    },
    //盘点列表
    getpanDianList(list) {
        let that = this;
        let currList = [];
        if (list) {
            currList = list
        } else {
            currList = that.data.cengArr[that.data.quCurrentIndex][that.data.cengCurrentIndex].queryStockCountDetailEntityList;
        }
        currList.map((item) => {
            item.causeIndex = 0;//初始化差异原因默认下标
            // item.causeList = that.data.cause;//初始化差异原因列表
        });
        that.setData({
            itemList: currList,
            quCurrentId: that.data.kuArr[that.data.quCurrentIndex].partitionId,//库区id
            cengCurrentId: that.data.cengArr[that.data.quCurrentIndex][that.data.cengCurrentIndex].locId,//层区id
        });
    },
    //计算相差数量
    calculDiff(e) {
        let that = this;
        let skucount = e.currentTarget.dataset.skucount; //现有库存
        let id = e.currentTarget.dataset.id;//当前商品的id
        let fillNum = parseInt(e.detail.value);
        let num = '';
        let _cause = [];

        //遍历当前列表
        that.data.itemList.map((item) => {
            if (item.skuId == id) {
                if (fillNum >= 0 && fillNum != skucount) {
                    item.isDiff = true;
                    num = fillNum - skucount;
                    //联动显示差异原因
                    if (num > 0) {//盘盈
                        _cause = that.data.cause1;
                    } else if (num < 0) {//盘亏
                        _cause = that.data.cause2;
                    }
                } else {
                    fillNum = ''
                    item.isDiff = false;
                }
                console.log(fillNum)
                item.diffNum = num;
                item.causeList = _cause;
                item.actualNum = fillNum;
            }
        });
        that.setData({itemList: that.data.itemList});
    },
    //选择盘点结果原因
    bindPickerChange(e) {
        let that = this;
        let id = e.currentTarget.dataset.id;
        let causeIndex = parseInt(e.detail.value);
        that.data.itemList.map((item) => {
            if (item.skuId === id) {
                item.causeIndex=causeIndex
                item.causeCode = item.causeList[causeIndex].key;
                item.causeValue = item.causeList[causeIndex].value;
            }
        });
        that.setData({itemList: that.data.itemList});
    },
    //确认盘点
    sourePD(e) {
        let that = this;
        let id = e.currentTarget.dataset.id;//当前商品的id
        that.data.itemList.map((item) => {
            if (item.skuId === id) {

                if (item.actualNum === undefined || item.actualNum === '') {
                    wx.showModal({
                        title: '提示',
                        content: '请输入实际盘点数量'
                    })
                } else if (item.causeCode === undefined || item.causeCode === -1) {
                    wx.showModal({
                        title: '提示',
                        content: '请选择差异原因'
                    })
                } else {
                    util.fetch('/urfresh/wms/app/v1/confirmStockCount', {
                        warehouseId: that.data.option.warehouseId,
                        userId: that.data.userId,
                        orderId: that.data.option.orderId,
                        detailId: item.detailId,
                        skuId: item.skuId,
                        planStockCount: item.planStockCount,
                        actStockCount: item.actualNum,
                        diffReason: item.causeValue,
                        diffCode: item.causeCode,
                    }, res => {
                        if (res.result) {
                            if (that.data.panDianStaus == 1) {//改变状态  开始盘点=》盘点中
                                that.setData({panDianStaus: 0});
                            }
                            that.setData({itemList: []});//清空原先数组列表
                            that.getDetailList(1);
                        } else {
                            wx.showModal({
                                title: '提示',
                                content: res.content
                            })
                        }
                    });
                }
            }
        })
    }
});