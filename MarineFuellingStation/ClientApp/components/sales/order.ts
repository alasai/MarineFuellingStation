﻿import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import axios from "axios";
import moment from "moment";

@Component({
    components: {
        WeuiSearch: require('../weui-search/search.vue')
    }
})
export default class OrderComponent extends Vue {
    salesplans: server.salesPlan[];
    salesplanshow: boolean = false;
    model: server.order;
    selectedplanNo: string = "请选择";
    oiloptions: ydui.actionSheetItem[];
    oilName: string = '请选择';
    oilshow: boolean = false;
    orders: server.order[];

    radio2: string = '1';
    carNo: string = '';

    show1: boolean = false;
    show2: boolean = false;

    selectedtransord: string = "";
    hasplan: boolean = false;
    istrans: boolean = false;
    sv: string = "";

    constructor() {
        super();

        this.salesplans = new Array();
        this.model = (new Object()) as server.order;
        this.model.isInvoice = false;
        this.model.carNo = '';
        this.model.price = 0;
        this.model.count = 0;
        this.model.totalMoney = 0;
        this.model.ticketType = -1;
        this.model.unit = '升';

        this.orders = new Array();
        this.oiloptions = new Array();

        this.getOrderNo();
        this.getOilProducts();
        this.getOrders();
    }

    salesplanselect() {
        this.getSalesPlans();
        this.salesplanshow = true;
    }

    formatShortDate(d: Date): string {
        return moment(d).format('MM-DD');
    }

    formatDate(d: Date): string {
        return moment(d).format('YYYY-MM-DD');
    }

    classState(s: server.orderState): any {
        switch (s) {
            case server.orderState.已完成:
                return { color_red: true }
            case server.orderState.装油中:
                return { color_green: true }
            case server.orderState.已开单:
                return { color_darkorange: true }
            case server.orderState.装油结束:
                return { color_blue: true }
        }
    }

    getStateName(s: server.orderState): string {
        switch (s) {
            case server.orderState.已完成:
                return '已完成';
            case server.orderState.装油中:
                return '装油中';
            case server.orderState.已开单:
                return '已开单';
            case server.orderState.装油结束:
                return '装油结束';
        }
    }

    planitemclick(s: server.salesPlan): void {
        this.selectedplanNo = s.name;
        this.model.salesPlanId = s.id;
        this.model.carNo = s.carNo;
        this.model.price = s.price;
        this.model.count = s.count;
        this.oilName = s.oilName;
        this.model.productId = s.productId;
        this.radio2 = (s.salesPlanType + 1).toString();

        this.hasplan = true;

        this.salesplanshow = false;
    };

    transitemclick(): void {
        this.selectedtransord = "YS07070001";
        this.show1 = false;
    };

    emptyclick(): void {
        this.selectedplanNo = "散客";
        this.model.salesPlanId = null;

        this.hasplan = false;

        this.salesplanshow = false;
    };

    buttonclick() {
        //信息验证
        if (this.model.carNo == '') {
            this.toastError('车牌不能为空');
            return;
        }
        if (this.model.count <= 0) {
            this.toastError('数量必须大于1');
            return;
        }
        if (this.model.productId == 0) {
            this.toastError('必须选择油品');
            return;
        }
        this.postOrder(this.model);
    }

    toastError(msg: string) {
        (<any>this).$dialog.toast({
            mes: msg,
            timeout: 1500,
            icon: 'error'
        });
    }

    godetail(id: number) {
        this.$router.push('/sales/order/' + id);
    }

    mounted() {
        this.$emit('setTitle', this.$store.state.username + ' 销售单');

        //观察者模式
        this.$watch('radio2', (v, ov) => {
            switch (v) {
                case "1":
                    this.model.unit = '升';
                    this.show2 = false;
                    this.model.orderType = server.salesPlanType.水上;
                    break;
                case "2":
                    this.model.unit = '吨';
                    this.show2 = true;
                    this.model.orderType = server.salesPlanType.陆上;
                    break;
                case "3":
                    this.model.unit = '桶';
                    this.show2 = false;
                    this.model.orderType = server.salesPlanType.机油;
                    break;
            }
        });

        this.$watch('model.price', (v, ov) => {
            this.model.billingPrice = v;
            this.model.totalMoney = v * this.model.count;
        });
        this.$watch('model.count', (v, ov) => {
            this.model.billingCount = v;
            this.model.totalMoney = this.model.price * v;
        });
    };

    change(label: string, tabkey: string) {
        console.log(label);
        this.$emit('setTitle', this.$store.state.username + ' ' + label);
    }

    getSalesPlans() {
        axios.get('/api/SalesPlan').then((res) => {
            let jobj = res.data as server.resultJSON<server.salesPlan[]>;
            if (jobj.code == 0)
                this.salesplans = jobj.data;
        });
    }

    getOrderNo() {
        axios.get('/api/Order/OrderNo').then((res) => {
            let jobj = res.data as server.resultJSON<string>;
            if (jobj.code == 0)
                this.model.name = jobj.data;
        });
    }

    getOilProducts() {
        axios.get('/api/Product/OilProducts').then((res) => {
            let jobj = res.data as server.resultJSON<server.product[]>;
            if (jobj.code == 0) {
                jobj.data.forEach((o, i) => {
                    this.oiloptions.push({
                        label: o.name,
                        method: () => {
                            this.oilName = o.name;
                            this.model.productId = o.id;
                            if (o.lastPrice > 0)
                                this.model.price = o.lastPrice;
                            else
                                this.model.price = o.minPrice;
                        }
                    });
                });
            }
        });
    }

    getOrders() {
        axios.get('/api/Order').then((res) => {
            let jobj = res.data as server.resultJSON<server.order[]>;
            if (jobj.code == 0)
                this.orders = jobj.data;
        });
    }

    postOrder(model: server.order) {
        axios.post('/api/Order', model).then((res) => {
            let jobj = res.data as server.resultJSON<server.order>;
            if (jobj.code == 0) {
                this.getOrderNo();
                (<any>this).$dialog.toast({
                    mes: jobj.msg,
                    timeout: 1500,
                    icon: 'success'
                });
            }
        });
    }
}