import ComponentBase from "../../componentbase";
import { Component } from 'vue-property-decorator';
import axios from "axios";
import moment from "moment";

@Component
export default class PlanDetailComponent extends ComponentBase {
    model: server.salesPlan;

    constructor() {
        super();

        this.model = (new Object()) as server.salesPlan;
    }

    mounted() {
        let id = this.$route.params.id;
        let from = this.$route.params.from;
        switch (from) {
            case "plan":
                from = '/sales/plan';
                break;
            case "board"://计划看板
                from = '/produce/planboard'
        }
        this.getSalesPlan(id, () => {
            //设置返回键的连接
            this.$emit('setTitle', this.model.name + ' 计划明细', from);
        });
    }

    getSpType(ot: server.salesPlanType) {
        if (ot == server.salesPlanType.机油)
            return "机油"
        else if (ot == server.salesPlanType.水上)
            return "水上"
        else if (ot == server.salesPlanType.陆上)
            return "陆上"
    }

    getIsInvoice(isInv: boolean) {
        if (isInv)
            return "开票";
        else
            return "不开票";
    }

    formatDate(d: Date) {
        return moment(d).format("YYYY-MM-DD");
    }

    getSalesPlan(id: string, callback: Function) {
        axios.get('/api/SalesPlan/GetDetail/' + id).then((res) => {
            let jobj = res.data as server.resultJSON<server.salesPlan>;
            if (jobj.code == 0) {
                this.model = jobj.data;
                console.log(this.model);
                callback();
            }
        });
    }
}