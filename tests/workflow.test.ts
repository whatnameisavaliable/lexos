import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCustomerChannelStats, summarizeCustomerChannelStats } from "../src/lib/analytics/customer-channels.ts";
import { buildLawyerPerformanceStats, summarizeLawyerPerformanceStats } from "../src/lib/analytics/lawyer-performance.ts";
import { centsToYuanText, settlementStatusLabel, settlementsToCsv } from "../src/lib/settlements/export.ts";
import { buildTaskDeliveryRecords, buildTaskMilestones, summarizeTaskMilestones } from "../src/lib/tasks/progress.ts";
import {
  buildPortalTokenHash,
  validateCreateCustomerInput,
  validateCreateTaskInput,
  validateSettlementDraft,
} from "../src/lib/workflow/validation.ts";
import { demoCustomers, demoFeedback, demoSettlements, demoTasks, demoUsers } from "../src/lib/demo-data.ts";

describe("客户输入", () => {
  it("创建客户时清理字段并保留手机号", () => {
    const input = validateCreateCustomerInput({
      name: " 东辰科技有限公司 ",
      contactName: " 王总 ",
      phone: " 13800000000 ",
      source: "案源律师录入",
    });

    assert.equal(input.name, "东辰科技有限公司");
    assert.equal(input.contactName, "王总");
    assert.equal(input.phone, "13800000000");
  });
});

describe("任务输入", () => {
  it("将元转换为分并要求金额大于 0", () => {
    const input = validateCreateTaskInput({
      customerId: "customer-id",
      title: "民商事一审代理",
      description: "准备起诉材料",
      taskType: "诉讼任务",
      amountYuan: "12000.50",
      minRankId: "rank-id",
      dueAt: "2026-07-01",
    });

    assert.equal(input.amountCents, 1_200_050);
  });

  it("拒绝零金额或负数金额", () => {
    assert.throws(
      () =>
        validateCreateTaskInput({
          customerId: "customer-id",
          title: "民商事一审代理",
          description: "准备起诉材料",
          taskType: "诉讼任务",
          amountYuan: "0",
          minRankId: "rank-id",
        }),
      /任务金额必须大于 0/,
    );
  });
});

describe("客户大屏 token", () => {
  it("使用 SHA-256 保存 token hash，避免明文入库", () => {
    const hash = buildPortalTokenHash("LEXOS-DEMO-001");

    assert.equal(hash.length, 64);
    assert.notEqual(hash, "LEXOS-DEMO-001");
  });
});

describe("结算草稿", () => {
  it("按任务金额和职级比例生成结算草稿", () => {
    const draft = validateSettlementDraft({
      taskId: "task-id",
      lawyerId: "lawyer-id",
      rankId: "rank-id",
      taskAmountCents: 1_000_000,
      settlementBasisPoints: 8000,
    });

    assert.equal(draft.settlementAmountCents, 800_000);
    assert.equal(draft.status, "pending");
  });
});

describe("结算导出", () => {
  it("按财务对账口径导出 CSV", () => {
    const csv = settlementsToCsv([
      {
        confirmedAt: "2026-06-08T12:30:00.000Z",
        generatedAt: "2026-06-08T10:00:00.000Z",
        id: "settlement-id",
        lawyerName: "张律师",
        lawyerUsername: "lawyer01",
        payableAmountCents: 816_000,
        rankCode: "L2B",
        riskDeductionAmountCents: 144_000,
        riskDeductionLockedAt: "2026-06-08T11:00:00.000Z",
        riskPenaltyDestination: "risk_reserve",
        settlementAmountCents: 960000,
        settlementBasisPoints: 8000,
        status: "confirmed",
        taskAmountCents: 1200000,
        taskTitle: "民商事一审代理,材料准备",
      },
    ]);

    assert.equal(
      csv,
      '结算ID,任务,办案律师,用户名,职级,任务金额(元),结算比例,原结算金额(元),扣减金额(元),律师实付金额(元),扣罚去向,扣罚锁定时间,状态,生成时间,确认时间\nsettlement-id,"民商事一审代理,材料准备",张律师,lawyer01,L2B,12000.00,80%,9600.00,1440.00,8160.00,公共风险储备金,2026-06-08T11:00:00.000Z,已确认,2026-06-08T10:00:00.000Z,2026-06-08T12:30:00.000Z\n',
    );
  });

  it("金额按元保留两位小数，并输出中文结算状态", () => {
    assert.equal(centsToYuanText(123456), "1234.56");
    assert.equal(centsToYuanText(123), "1.23");
    assert.equal(settlementStatusLabel("pending"), "待确认");
    assert.equal(settlementStatusLabel("paid"), "已付款");
  });
});

describe("标准演示数据", () => {
  it("覆盖任务抢单、客户确认和结算演示所需状态", () => {
    const statuses = new Set(demoTasks.map((task) => task.status));

    assert.equal(statuses.has("open"), true);
    assert.equal(statuses.has("claimed"), true);
    assert.equal(statuses.has("submitted"), true);
    assert.equal(statuses.has("approved"), true);
    assert.equal(statuses.has("settlement_pending"), true);
    assert.equal(statuses.has("settled"), true);
    assert.equal(demoTasks.some((task) => task.reviewRequired && task.reviewStatus === "pending"), true);
  });

  it("为客户已确认任务预置评分和结算记录", () => {
    const feedbackTaskIds = new Set(demoFeedback.map((item) => item.taskId));
    const settlementTaskIds = new Set(demoSettlements.map((item) => item.taskId));
    const settlementRankCodes = new Set(demoSettlements.map((item) => item.rankCode));

    assert.equal(feedbackTaskIds.has("t-005"), true);
    assert.equal(feedbackTaskIds.has("t-006"), true);
    assert.equal(settlementTaskIds.has("t-005"), true);
    assert.equal(settlementTaskIds.has("t-006"), true);
    assert.equal(settlementRankCodes.has("L1C"), true);
    assert.equal(settlementRankCodes.has("L2B"), true);
    assert.equal(settlementRankCodes.has("L3A"), true);
  });
});

describe("客户与渠道统计", () => {
  it("按客户来源汇总客户、任务、结算和评分", () => {
    const stats = buildCustomerChannelStats({
      customers: demoCustomers,
      feedback: demoFeedback,
      settlements: demoSettlements,
      tasks: demoTasks,
    });
    const summary = summarizeCustomerChannelStats(stats);
    const partner = stats.find((item) => item.source === "合伙人转介绍");

    assert.equal(summary.channelCount, 4);
    assert.equal(summary.customerCount, 4);
    assert.equal(summary.activeTaskCount, 8);
    assert.equal(summary.confirmedTaskCount, 3);
    assert.equal(summary.topChannel?.source, "合伙人转介绍");
    assert.equal(partner?.customerCount, 1);
    assert.equal(partner?.activeTaskCount, 3);
    assert.equal(partner?.taskAmountCents, 5_100_000);
    assert.equal(partner?.settlementAmountCents, 3_370_000);
    assert.equal(partner?.averageScore, 9);
  });

  it("排除已取消任务金额，但保留渠道客户来源", () => {
    const stats = buildCustomerChannelStats({
      customers: demoCustomers,
      feedback: demoFeedback,
      settlements: demoSettlements,
      tasks: demoTasks,
    });
    const officialSite = stats.find((item) => item.source === "官网咨询");

    assert.equal(officialSite?.customerCount, 1);
    assert.equal(officialSite?.taskCount, 2);
    assert.equal(officialSite?.activeTaskCount, 1);
    assert.equal(officialSite?.taskAmountCents, 4_200_000);
  });
});

describe("律师绩效统计", () => {
  it("按办案律师汇总任务、客户评分和结算金额", () => {
    const stats = buildLawyerPerformanceStats({
      feedback: demoFeedback,
      settlements: demoSettlements,
      tasks: demoTasks,
      users: demoUsers,
    });
    const summary = summarizeLawyerPerformanceStats(stats);
    const handler = stats.find((item) => item.lawyerId === "u-handler");

    assert.equal(stats.length, 3);
    assert.equal(summary.lawyerCount, 3);
    assert.equal(summary.activeLawyerCount, 3);
    assert.equal(summary.averageScore, 9);
    assert.equal(summary.rollingAverageScore, 8.9);
    assert.equal(summary.rollingTaskCount, 4);
    assert.equal(summary.sourceReviewAverageScore, 9);
    assert.equal(summary.caseResultAverageScore, 8.5);
    assert.equal(summary.topLawyer?.lawyerId, "u-handler");
    assert.equal(handler?.activeTaskCount, 3);
    assert.equal(handler?.completedTaskCount, 1);
    assert.equal(handler?.taskAmountCents, 6_300_000);
    assert.equal(handler?.settlementAmountCents, 2_880_000);
    assert.equal(handler?.confirmedSettlementAmountCents, 2_880_000);
    assert.equal(handler?.averageScore, 10);
    assert.equal(handler?.rollingAverageScore, 9.2);
    assert.equal(handler?.rollingTaskCount, 2);
    assert.equal(handler?.sourceReviewAverageScore, 9.5);
    assert.equal(handler?.sourceReviewCount, 2);
    assert.equal(handler?.caseResultAverageScore, 8.5);
    assert.equal(handler?.caseResultCount, 2);
  });

  it("排除已取消任务金额，但保留历史接单数量", () => {
    const stats = buildLawyerPerformanceStats({
      feedback: demoFeedback,
      settlements: demoSettlements,
      tasks: demoTasks,
      users: demoUsers,
    });
    const handler = stats.find((item) => item.lawyerId === "u-handler");

    assert.equal(handler?.totalTaskCount, 4);
    assert.equal(handler?.activeTaskCount, 3);
    assert.equal(handler?.taskAmountCents, 6_300_000);
  });
});

describe("任务里程碑与交付记录", () => {
  it("已结算任务完成全部里程碑并生成交付记录", () => {
    const task = demoTasks.find((item) => item.id === "t-006");
    const settlement = demoSettlements.find((item) => item.taskId === "t-006");

    assert.ok(task);

    const milestones = buildTaskMilestones(task, settlement);
    const summary = summarizeTaskMilestones(milestones);
    const records = buildTaskDeliveryRecords(task);

    assert.equal(summary.completedCount, 6);
    assert.equal(summary.totalCount, 6);
    assert.equal(summary.nextMilestone, undefined);
    assert.equal(records.length, 1);
    assert.equal(records[0]?.title, "工程款谈判材料包");
    assert.equal(records[0]?.externalUrl, "https://example.com/lexos/demo/construction-negotiation");
  });

  it("处理中任务停在成果提交里程碑且暂无交付记录", () => {
    const task = demoTasks.find((item) => item.id === "t-002");

    assert.ok(task);

    const milestones = buildTaskMilestones(task);
    const summary = summarizeTaskMilestones(milestones);
    const records = buildTaskDeliveryRecords(task);

    assert.equal(summary.completedCount, 2);
    assert.equal(summary.nextMilestone?.label, "成果提交");
    assert.equal(records.length, 0);
  });

  it("待审核任务的验收节点显示主任复核状态", () => {
    const task = demoTasks.find((item) => item.id === "t-003");

    assert.ok(task);

    const milestones = buildTaskMilestones(task);
    const reviewMilestone = milestones.find((item) => item.key === "approved");

    assert.equal(reviewMilestone?.label, "审核与案源验收");
    assert.equal(reviewMilestone?.value, "待审核");
    assert.equal(reviewMilestone?.state, "current");
  });
});
