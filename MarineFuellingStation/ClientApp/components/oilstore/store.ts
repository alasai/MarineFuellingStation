﻿import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import axios from "axios";

@Component
export default class StoreComponent extends Vue {
    carNo: string = "";
    stshow: boolean = false;
    newstshow: boolean = false;
    radio1: string = "1";
    model: server.store;
    stName: string = '';
    sts: server.storeType[];
    currentst: server.storeType;

    constructor() {
        super();

        this.sts = new Array();
        this.currentst = new Object() as server.storeType;

        this.getStoreTypes();
    }

    toastError(msg: string) {
        (<any>this).$dialog.toast({
            mes: msg,
            timeout: 1500,
            icon: 'error'
        });
    }

    stClick(st: server.storeType) {
        this.currentst = st;
        this.stshow = true;
    }

    buttonclick() {
        //信息验证
        if (this.model.name == '') {
            this.toastError('名称不能为空');
            return;
        }
        if (this.model.volume <= 0) {
            this.toastError('请输入容量');
            return;
        }
        if (this.model.storeTypeId <= 0) {
            this.toastError('必须选择分类');
            return;
        }
        this.postStore(this.model);
    }

    sumVolume(st: server.storeType): number {
        let result: number = 0;
        st.stores.forEach((s) => {
            result += s.volume;
        });
        return result;
    }

    sumValue(st: server.storeType): number {
        let result: number = 0;
        st.stores.forEach((s) => {
            result += s.value;
        });
        return result;
    }

    sumCost(st: server.storeType): number {
        let result: number = 0;
        st.stores.forEach((s) => {
            result += s.cost;
        });
        return result;
    }

    newstShowClick() {
        this.stName = '';
        this.newstshow = true;
    }

    getStoreTypes() {
        axios.get('/api/StoreType').then((res) => {
            let jobj = res.data as server.resultJSON<server.storeType[]>;
            if (jobj.code == 0) {
                this.sts = jobj.data;
            }
        });
    }

    postStoreType() {
        if (this.stName == '') {
            this.toastError('分类名称不能为空');
            return;
        }

        let stmodel = (new Object()) as server.storeType;
        stmodel.name = this.stName;
        axios.post('/api/StoreType', stmodel).then((res) => {
            let jobj = res.data as server.resultJSON<server.storeType>;
            if (jobj.code == 0) {
                (<any>this).$dialog.toast({
                    mes: jobj.msg,
                    timeout: 1500,
                    icon: 'success'
                });
                //将新增的分类加入到列表中
                this.sts.push(jobj.data);
                //关闭popup
                this.newstshow = false;
            }
        });
    }

    postStore(model: server.store) {
        axios.post('/api/Store', model).then((res) => {
            let jobj = res.data as server.resultJSON<server.store>;
            if (jobj.code == 0) {
                (<any>this).$dialog.toast({
                    mes: jobj.msg,
                    timeout: 1500,
                    icon: 'success'
                });
            }
        });
    }

    mounted() {
        this.$emit('setTitle', this.$store.state.username + ' 油仓');

        this.$watch('radio1', (v, ov) => {
            switch (v) {
                case "1":
                    this.model.storeClass = server.storeClass.销售仓;
                    break;
                case "2":
                    this.model.storeClass = server.storeClass.存储仓;
                    break;
            }
        });
    };

    change(label: string, tabkey: string) {
        this.$emit('setTitle', this.$store.state.username + ' ' + label);
        if (label == '添加') {
            this.model = (new Object()) as server.store;
            this.model.name = '';
            this.model.volume = 0;
            this.model.storeTypeId = -1;
        }
    }
}