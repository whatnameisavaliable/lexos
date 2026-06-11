import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildLawyerPerformanceStats } from "../src/lib/analytics/lawyer-performance.ts";
import type { DemoUser, Task } from "../src/types/demo.ts";

const lawyer: DemoUser = {
  displayName: "测试律师",
  id: "lawyer",
  mustChangePassword: false,
  password: "changed",
  rankCode: "L2A",
  role: "handling_lawyer",
  status: "active",
  username: "lawyer",
};

describe("律师近 30 单滚动评分", () => {
  it("只统计最近 30 个有评分的任务", () => {
    const tasks: Task[] = Array.from({ length: 35 }, (_, index) => {
      const month = index < 31 ? "01" : "02";
      const day = String(index < 31 ? index + 1 : index - 30).padStart(2, "0");

      return {
        amountCents: 100_000,
        assignedLawyerId: lawyer.id,
        caseResultScore: index < 5 ? 1 : 10,
        customerId: `customer-${index}`,
        description: "测试任务",
        dueAt: `2026-${month}-${day}`,
        id: `task-${index}`,
        minRankCode: "L1A",
        portalToken: `token-${index}`,
        sourceLawyerId: "source",
        sourceReviewScore: index < 5 ? 1 : 10,
        sourceReviewedAt: `2026-${month}-${day} 10:00`,
        status: "settled",
        taskType: "测试",
        title: `测试任务 ${index}`,
      };
    });

    const [stat] = buildLawyerPerformanceStats({
      feedback: [],
      settlements: [],
      tasks,
      users: [lawyer],
    });

    assert.equal(stat?.rollingTaskCount, 30);
    assert.equal(stat?.rollingAverageScore, 10);
  });
});
