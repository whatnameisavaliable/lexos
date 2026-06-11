import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizedDateBoundary } from "../src/lib/api/date-range.ts";
import { paginationMeta, parseListQuery, parseListSort, postgrestInFilter, postgrestLikePattern } from "../src/lib/api/pagination.ts";

describe("列表分页查询", () => {
  it("解析 page、pageSize 和 search，并计算 range", () => {
    const query = parseListQuery(new Request("https://lexos.test/api/tasks?page=3&pageSize=20&search=合同"));

    assert.deepEqual(query, {
      from: 40,
      page: 3,
      pageSize: 20,
      search: "合同",
      to: 59,
    });
  });

  it("非法页码回退默认值，并限制 pageSize 上限", () => {
    const query = parseListQuery(new Request("https://lexos.test/api/tasks?page=-1&pageSize=500"));

    assert.equal(query.page, 1);
    assert.equal(query.pageSize, 100);
    assert.equal(query.from, 0);
    assert.equal(query.to, 99);
  });

  it("未显式传 pageSize 时使用系统参数默认分页数量", () => {
    const query = parseListQuery(new Request("https://lexos.test/api/tasks?page=2"), { defaultPageSize: 25 });

    assert.equal(query.page, 2);
    assert.equal(query.pageSize, 25);
    assert.equal(query.from, 25);
    assert.equal(query.to, 49);
  });

  it("生成分页元数据", () => {
    const query = parseListQuery(new Request("https://lexos.test/api/customers?page=2&pageSize=25"));

    assert.deepEqual(paginationMeta(query, 126), {
      page: 2,
      pageSize: 25,
      total: 126,
      totalPages: 6,
    });
  });

  it("按白名单解析排序参数", () => {
    const sort = parseListSort(
      new Request("https://lexos.test/api/tasks?sort=amountDesc"),
      {
        amountDesc: { ascending: false, column: "amount_cents" },
        createdAtDesc: { ascending: false, column: "created_at" },
      },
      "createdAtDesc",
    );

    assert.deepEqual(sort, {
      ascending: false,
      column: "amount_cents",
      key: "amountDesc",
    });
  });

  it("非法排序参数回退默认排序", () => {
    const sort = parseListSort(
      new Request("https://lexos.test/api/tasks?sort=dropTable"),
      {
        amountDesc: { ascending: false, column: "amount_cents" },
        createdAtDesc: { ascending: false, column: "created_at" },
      },
      "createdAtDesc",
    );

    assert.deepEqual(sort, {
      ascending: false,
      column: "created_at",
      key: "createdAtDesc",
    });
  });

  it("清理 PostgREST ilike 搜索模式中的分隔符", () => {
    assert.equal(postgrestLikePattern(" 张三,合同_纠纷 "), "%张三 合同 纠纷%");
    assert.equal(postgrestLikePattern(" ,_ "), undefined);
  });

  it("生成 PostgREST in 过滤器并去重", () => {
    assert.equal(postgrestInFilter(["u-1", "u-2", "u-1", ""]), "(u-1,u-2)");
    assert.equal(postgrestInFilter(["", " "]), undefined);
  });

  it("标准化日期范围边界", () => {
    assert.equal(normalizedDateBoundary("2026-06-08", "start"), "2026-06-08T00:00:00.000Z");
    assert.equal(normalizedDateBoundary("2026-06-08", "end"), "2026-06-08T23:59:59.999Z");
    assert.equal(normalizedDateBoundary("不是日期", "start"), undefined);
  });
});
