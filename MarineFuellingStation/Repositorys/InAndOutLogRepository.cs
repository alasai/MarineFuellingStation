﻿using MFS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace MFS.Repositorys
{
    public class InAndOutLogRepository : RepositoryBase<InAndOutLog>
    {
        public InAndOutLogRepository(EFContext dbContext) : base(dbContext) { }

        public List<InAndOutLog> GetIncludeStore(LogType type, int page)
        {
            if(type == LogType.全部)
                return LoadPageList(page, 10, out int rowCount, true, i => i.Type == LogType.入仓 || i.Type == LogType.出仓).Include(i => i.Store).ToList();
            else
                return LoadPageList(page, 10, out int rowCount, true, i => i.Type == type).Include(i => i.Store).ToList();
        }

        public decimal GetStoreSumValue(int id ,LogType type,DateTime date)
        {
            DateTime startdate = new DateTime(date.Year, date.Month, date.Day, 0, 0, 0);
            DateTime enddate = startdate.AddDays(1).AddSeconds(-1);
            return GetAllList(i => i.Type == type && i.StoreId == id && i.LastUpdatedAt >= startdate && i.LastUpdatedAt <= enddate).Sum(i => i.Value);
        }
    }
}
