declare module server {
	/** 销售计划 Name字段为单号 */
	interface salesPlan extends entityBase {
		salesPlanType: salesPlanType;
		carNo: string;
		productId: number;
		/** 油品名 */
		oilName: string;
		price: number | string;
		count: number;
		/** 单位 */
		unit: string;
		/** 当前余油 */
		remainder: number;
		oilDate: Date;
		/** 是否开票 */
        isInvoice: boolean;
        /** 送货上门/自提 */
        isDeliver: boolean;
        /** 送货上门 运费 */
        deliverMoney: number;
        /** 是否打印单价 送货 */
        isPrintPrice: boolean;
		ticketType: ticketType;
		/** 开票单位 */
		billingCompany: string;
		/** 开票单价 */
		billingPrice: number;
		/** 开票数量 */
		billingCount: number;
		state: salesPlanState;
		/** 审核人 */
		auditor: string;
		/** 审核时间 */
		auditTime?: Date;
        totalMoney: number;
        /** 备注 */
        remark: string;
        /** 单据是否删除标识 */
        isDel: boolean;
	}
	const enum salesPlanType {
		水上加油,
		陆上装车,
        水上机油,
        全部,
        陆上公司车,
        陆上外来车
	}
	const enum salesPlanState {
		未审批,
		已审批,
		已完成,
	}
}
