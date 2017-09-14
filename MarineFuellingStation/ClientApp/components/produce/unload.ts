﻿import ComponentBase from "../../componentbase";
import { Component } from 'vue-property-decorator';
import axios from "axios";

@Component
export default class MyOrderComponent extends ComponentBase {
    radio2: string = "1";
    carNo: string = "";
    show1: boolean = false;
    show2: boolean = false;
    show3: boolean = false;
    picked: string = "Lucy";

    purchases: server.purchase[];

    constructor() {
        super();

        this.purchases = new Array<server.purchase>();
        this.getPurchases();
    }

    showclick(): void {
        this.show1 = true;
    };

    saveclick1(): void {
        this.show1 = false;
    };
    saveclick2(): void {
        this.show2 = false;
    };
    saveclick3(): void {
        this.show3 = false;
    };
    beginConfrim(): void {
        (<any>this).$dialog.confirm({
            title: '确认操作',
            mes: '开始卸油？',
            opts: () => {
                (<any>this).$dialog.toast({ mes: '确认', timeout: 1000 });
            }
        })
    };
    endConfrim(): void {
        (<any>this).$dialog.confirm({
            title: '确认操作',
            mes: '卸油结束？',
            opts: () => {
                (<any>this).$dialog.toast({ mes: '确认', timeout: 1000 });
            }
        })
    };
   
    mounted() {
        this.$emit('setTitle', this.$store.state.username + ' 陆上卸油');
        this.$watch('show1', (v, ov) => {
        });
    };

    change(label: string, tabkey: string) {
        console.log(label);
        this.$emit('setTitle', this.$store.state.username + ' ' + label);
    }

    getPurchases() {
        axios.get('/api/Purchase').then((res) => {
            let jobj = res.data as server.resultJSON<server.purchase[]>;
            if (jobj.code == 0)
                this.purchases = jobj.data;
        });
    }
}