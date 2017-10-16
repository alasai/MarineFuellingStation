﻿using MFS.Controllers.Attributes;
using MFS.Helper;
using MFS.Hubs;
using MFS.Models;
using MFS.Repositorys;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Net.Http.Headers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Senparc.Weixin.Work.Containers;
using Senparc.Weixin.Work.AdvancedAPIs;

namespace MFS.Controllers
{
    [Route("api/[controller]"), Axios]
    public class OrderController : ControllerBase
    {
        private readonly OrderRepository r;
        private readonly ClientRepository cr;
        private readonly IHubContext<PrintHub> _hub;
        private readonly IHostingEnvironment _hostingEnvironment;
        WorkOption option;
        public OrderController(OrderRepository repository, IHubContext<PrintHub> hub, IOptionsSnapshot<WorkOption> option, IHostingEnvironment env, ClientRepository clientRepository)
        {
            r = repository;
            cr = clientRepository;
            _hub = hub;
            _hostingEnvironment = env;
            //获取 销售单 企业微信应用的AccessToken
            this.option = option.Value;
            this.option.销售单AccessToken = AccessTokenContainer.TryGetToken(this.option.CorpId, this.option.销售单Secret);
            this.option.收银AccessToken = AccessTokenContainer.TryGetToken(this.option.CorpId, this.option.收银Secret);
            this.option.水上加油AccessToken = AccessTokenContainer.TryGetToken(this.option.CorpId, this.option.水上加油Secret);
            this.option.陆上加油AccessToken = AccessTokenContainer.TryGetToken(this.option.CorpId, this.option.陆上加油Secret);
        }
        [NonAction]
        public async Task SendPrintOrderAsync(string who, Order order)
        {
            foreach (var connectionId in PrintHub.connections.GetConnections(who))
            {
                await _hub.Clients.Client(connectionId).InvokeAsync("printorder", order);
            }
        }
        #region Post方法
        [HttpPost]
        public async Task<ResultJSON<Order>> Post([FromBody]Order o)
        {
            r.CurrentUser = UserName;

            //当车号/船号没有对应的客户资料时，自动新增客户资料，以便我的客户中的关联查找
            if (!cr.AddClientWithNoFind(o.CarNo, UserName, o.ProductId))
                return new ResultJSON<Order> { Code = 501, Msg = "无法新增该客户，请联系开发人员" };

            var result = r.Insert(o);

            //推送打印指令
            //await _hub.Clients.All.InvokeAsync("printorder", result);

            //向指定目标推送打印指令
            await SendPrintOrderAsync("收银台", result);

            //推送到“销售单”
            MassApi.SendTextCard(option.销售单AccessToken, option.销售单AgentId, "已开单"
                     , $"<div class=\"gray\">单号：{result.Name}</div>" +
                     $"<div class=\"normal\">开单人：{UserName}</div>" +
                     $"<div class=\"normal\">船号/车号：{result.CarNo}</div>"
                     , $"https://vue.car0774.com/#/sales/order/{result.Id}/order", toUser: "@all");

            //推送到“收银”
            MassApi.SendTextCard(option.收银AccessToken, option.收银AgentId, "已开单"
                     , $"<div class=\"gray\">单号：{result.Name}</div>" +
                     $"<div class=\"normal\">开单人：{UserName}</div>" +
                     $"<div class=\"normal\">船号/车号：{result.CarNo}</div>"
                     , $"https://vue.car0774.com/#/sales/order/{result.Id}/order", toUser: "@all");

            if (result.OrderType == SalesPlanType.水上)
                //推送到“水上加油”
                MassApi.SendTextCard(option.水上加油AccessToken, option.水上加油AgentId, "已开单，请施工"
                         , $"<div class=\"gray\">单号：{result.Name}</div>" +
                         $"<div class=\"normal\">开单人：{UserName}</div>" +
                         $"<div class=\"normal\">船号/车号：{result.CarNo}</div>"
                         , $"https://vue.car0774.com/#/sales/order/{result.Id}/order", toUser: "@all");
            else
                //推送到“陆上加油”
                MassApi.SendTextCard(option.陆上加油AccessToken, option.陆上加油AgentId, "已开单，请施工"
                         , $"<div class=\"gray\">单号：{result.Name}</div>" +
                         $"<div class=\"normal\">开单人：{UserName}</div>" +
                         $"<div class=\"normal\">船号/车号：{result.CarNo}</div>"
                         , $"https://vue.car0774.com/#/sales/order/{result.Id}/order", toUser: "@all");

            return new ResultJSON<Order>
            {
                Code = 0,
                Data = result
            };
        }
        [HttpPost("[action]")]
        public async Task<ResultJSON<string>> UploadFile([FromForm]IFormFile file)
        {
            if (file != null)
            {
                var extName = ContentDispositionHeaderValue.Parse(file.ContentDisposition).FileName.ToString().Trim('"');
                int i = extName.LastIndexOf('.');
                extName = extName.Substring(i);
                string fileName = Guid.NewGuid() + extName;
                var filePath = _hostingEnvironment.WebRootPath + @"\upload\" + fileName;
                await file.SaveAsAsync(filePath);
                return new ResultJSON<string>
                {
                    Code = 0,
                    Data = $"/upload/{fileName}"
                };
            }
            else
            {
                return new ResultJSON<string>
                {
                    Code = 1
                };
            }
        }

        #endregion
        #region GET方法

        [HttpGet("[action]")]
        public async Task<ResultJSON<string>> OrderNo()
        {
            await _hub.Clients.All.InvokeAsync("login", UserName);

            return new ResultJSON<string>
            {
                Code = 0,
                Data = r.GetSerialNumber(r.GetLastOrderNo())
            };
        }
        [HttpGet]
        public ResultJSON<List<Order>> Get()
        {
            return new ResultJSON<List<Order>>
            {
                Code = 0,
                Data = r.GetIncludeProduct(1, 30)
            };
        }
        [HttpGet("{id}")]
        public ResultJSON<Order> Get(int id)
        {
            return new ResultJSON<Order>
            {
                Code = 0,
                Data = r.Get(id)
            };
        }
        /// <summary>
        /// 分页显示数据
        /// </summary>
        /// <param name="page">第N页</param>
        /// <param name="pageSize">页记录数</param>
        /// <returns></returns>
        [HttpGet("[action]")]
        public ResultJSON<List<Order>> GetByPager(int page, int pageSize)
        {
            return new ResultJSON<List<Order>>
            {
                Code = 0,
                Data = r.LoadPageList(page, pageSize, out int rCount, true).Include(o => o.Product).OrderByDescending(s => s.Id).ToList()
            };
        }
        /// <summary>
        /// 获取我的订单分页数据，并且包含Product对象
        /// </summary>
        /// <param name="orderType">水上/陆上/机油</param>
        /// <param name="page">第n页</param>
        /// <returns></returns>
        [HttpGet("[action]")]
        public ResultJSON<List<Order>> GetMyOrders(int page, int size, DateTime startDate, DateTime endDate)
        {
            return new ResultJSON<List<Order>>
            {
                Code = 0,
                Data = r.LoadPageList(page, size, out int cnt, true, o => o.Salesman == UserName && o.CreatedAt >= startDate && o.CreatedAt < endDate).ToList()
            };
        }
        /// <summary>
        /// 获取我的订单分页数据，并且包含Product对象
        /// </summary>
        /// <param name="orderType">水上/陆上/机油</param>
        /// <param name="page">第n页</param>
        /// <returns></returns>
        [HttpGet("[action]")]
        public ResultJSON<List<Order>> GetOrders(int page, int size, DateTime startDate, DateTime endDate, string sales = "")
        {
            List<Order> list = new List<Order>();
            if (string.IsNullOrEmpty(sales))
                list = r.LoadPageList(page, size, out int cnt, true, o => o.CreatedAt >= startDate && o.CreatedAt < endDate).ToList();
            else
                list = r.LoadPageList(page, size, out int cnt, true, o => o.Salesman == sales && o.CreatedAt >= startDate && o.CreatedAt < endDate).ToList();
            return new ResultJSON<List<Order>>
            {
                Code = 0,
                Data = list
            };
        }
        /// <summary>
        /// 获取所有记录分页数据，并且包含Product对象
        /// </summary>
        /// <param name="page">第n页</param>
        /// <returns></returns>
        [HttpGet("[action]")]
        public ResultJSON<List<Order>> GetIncludeProduct(int page)
        {
            return new ResultJSON<List<Order>>
            {
                Code = 0,
                Data = r.GetIncludeProduct(page, 30)//每页30条记录
            };
        }
        /// <summary>
        /// 根据是否施工完成获取记录分页数据，并且包含Product对象
        /// </summary>
        /// <param name="page">第n页</param>
        /// <param name="isFinished">是否完成状态</param>
        /// <returns></returns>
        [HttpGet("[action]")]
        public ResultJSON<List<Order>> GetByIsFinished(int page, bool isFinished)
        {
            return new ResultJSON<List<Order>>
            {
                Code = 0,
                Data = r.GetIncludeProduct(page, 30, isFinished)//每页30条记录
            };
        }
        /// <summary>
        /// 根据是否完工获取水上或陆上分页数据，并且包含Product对象
        /// </summary>
        /// <param name="orderType">水上/陆上/机油</param>
        /// <param name="page">第n页</param>
        /// <param name="isFinished">是否完成状态</param>
        /// <returns></returns>
        [HttpGet("[action]/{ordertype}")]
        public ResultJSON<List<Order>> GetByIsFinished(SalesPlanType orderType, int page, bool isFinished)
        {
            return new ResultJSON<List<Order>>
            {
                Code = 0,
                Data = r.GetIncludeProduct(orderType, page, 30, isFinished)//每页30条记录
            };
        }
        /// <summary>
        /// 根据付款状态获取分页数据，并且包含Product、Client对象
        /// </summary>
        /// <param name="payState">付款状态</param>
        /// <param name="page">第n页</param>
        /// <param name="pageSize">分页记录数</param>
        /// <param name="searchVal">搜索关键字</param>
        /// <returns></returns>
        [HttpGet("[action]")]
        public ResultJSON<List<Order>> GetByPayState(PayState payState, int page, int pageSize, string searchVal = "")
        {
            return new ResultJSON<List<Order>>
            {
                Code = 0,
                Data = r.GetByPayState(payState, page, pageSize, searchVal)//每页30条记录
            };
        }
        #endregion
        #region Put方法
        /// <summary>
        /// 施工过程切换状态
        /// </summary>
        /// <returns></returns>
        [HttpPut("[action]")]
        public ResultJSON<Order> ChangeState([FromBody]Order o)
        {
            r.CurrentUser = UserName;
            return new ResultJSON<Order>
            {
                Code = 0,
                Data = r.ChangeState(o)
            };
        }
        /// <summary>
        /// 订单结算
        /// </summary>
        /// <param name="model">包含需要更改内容的model</param>
        /// <returns></returns>
        [HttpPut("[action]")]
        public ResultJSON<Order> Pay([FromBody] Order model)
        {
            r.CurrentUser = UserName;
            return r.Pay(model);
        }

        /// <summary>
        /// 挂账
        /// </summary>
        /// <param name="model">包含需要更改内容的model</param>
        /// <returns></returns>
        [HttpPut("[action]")]
        public ResultJSON<Order> PayOnCredit([FromBody] Order model)
        {
            r.CurrentUser = UserName;
            return new ResultJSON<Order>
            {
                Code = 0,
                Data = r.ChangePayState(model)
            };
        }
        #endregion
    }
}
