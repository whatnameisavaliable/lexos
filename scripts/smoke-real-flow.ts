type ApiEnvelope<T> =
  | {
      data: T;
      message: string;
    }
  | {
      error: {
        code: string;
        message: string;
      };
    };

type ApiUserRow = {
  role_code: string;
  rank_id?: string | null;
  profiles?: {
    id: string;
    username: string;
    display_name: string;
    must_change_password: boolean;
  };
  ranks?: {
    code: string;
  } | null;
};

type ApiRankRow = {
  id: string;
  code: string;
};

type ApiTaskRow = {
  id: string;
  title: string;
  status: string;
};

type ApiSettlementRow = {
  id: string;
  task_id: string;
  status: string;
  settlement_amount_cents: number;
};

class ApiSession {
  private baseUrl: string;
  private cookie = "";

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        ...(this.cookie ? { cookie: this.cookie } : {}),
        ...(init?.body ? { "content-type": "application/json; charset=utf-8" } : {}),
        ...init?.headers,
      },
    });

    this.captureCookies(response.headers);

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

    if (!response.ok || !payload || "error" in payload) {
      const message = payload && "error" in payload ? payload.error.message : `HTTP ${response.status}`;
      throw new Error(`${init?.method ?? "GET"} ${path} 失败：${message}`);
    }

    return payload.data;
  }

  private captureCookies(headers: Headers) {
    const richHeaders = headers as Headers & { getSetCookie?: () => string[] };
    const values = richHeaders.getSetCookie?.() ?? splitCombinedSetCookie(headers.get("set-cookie"));

    if (!values.length) {
      return;
    }

    const jar = new Map(
      this.cookie
        .split(";")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const [name, ...rest] = item.split("=");
          return [name, rest.join("=")] as const;
        }),
    );

    values.forEach((value) => {
      const [pair] = value.split(";");
      const [name, ...rest] = pair.split("=");

      if (name && rest.length) {
        jar.set(name.trim(), rest.join("=").trim());
      }
    });

    this.cookie = Array.from(jar.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

const baseUrl = process.env.LEXOS_SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const adminPassword = requiredEnv("LEXOS_SMOKE_ADMIN_PASSWORD");
const testPassword = requiredEnv("LEXOS_SMOKE_TEST_PASSWORD");
const now = new Date();
const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

const admin = new ApiSession(baseUrl);
await login(admin, "admin", adminPassword);

const ranks = (await admin.request<{ ranks: ApiRankRow[] }>("/api/ranks")).ranks;
const l2b = findRank(ranks, "L2B");
const l2a = findRank(ranks, "L2A");

await ensureUser(admin, {
  username: "source01",
  displayName: "周案源律师",
  roleCode: "source_lawyer",
});
await ensureUser(admin, {
  username: "lawyer01",
  displayName: "林办案律师",
  roleCode: "handling_lawyer",
  rankId: l2b.id,
});
await ensureUser(admin, {
  username: "finance01",
  displayName: "财务负责人",
  roleCode: "finance",
});

const source = await loginAndClearDefaultPassword("source01");
const lawyer = await loginAndClearDefaultPassword("lawyer01");
const finance = await loginAndClearDefaultPassword("finance01");

const customer = await source.request<{ customer: { id: string; name: string } }>("/api/customers", {
  method: "POST",
  body: JSON.stringify({
    name: `真实闭环客户-${stamp}`,
    contactName: "王总",
    phone: "13800000000",
    source: "真实 smoke 测试",
  }),
});

const createdTask = await source.request<{ task: ApiTaskRow; portalToken: string }>("/api/tasks", {
  method: "POST",
  body: JSON.stringify({
    customerId: customer.customer.id,
    title: `真实闭环任务-${stamp}`,
    description: "用于验证真实 Supabase API 的任务闭环。",
    taskType: "诉讼任务",
    amountCents: 1_200_000,
    minRankId: l2a.id,
    dueAt: "2026-07-01",
  }),
});

await lawyer.request(`/api/tasks/${createdTask.task.id}/claim`, { method: "POST" });
await lawyer.request(`/api/tasks/${createdTask.task.id}/submit`, {
  method: "POST",
  body: JSON.stringify({
    title: "阶段成果提交",
    content: "真实数据库 smoke 测试成果说明。",
    externalUrl: "https://example.com/lexos-smoke-deliverable",
  }),
});
await source.request(`/api/tasks/${createdTask.task.id}/approve`, { method: "POST" });

const portal = new ApiSession(baseUrl);
await portal.request(`/api/customer-portal/${encodeURIComponent(createdTask.portalToken)}/verify-code`, {
  method: "POST",
  body: JSON.stringify({
    phone: "13800000000",
    code: "111111",
  }),
});
await portal.request(`/api/customer-portal/${encodeURIComponent(createdTask.portalToken)}/feedback`, {
  method: "POST",
  body: JSON.stringify({
    score: 9,
    comment: "真实闭环验证通过。",
  }),
});

const settlements = (await finance.request<{ settlements: ApiSettlementRow[] }>("/api/settlements")).settlements;
const settlement = settlements.find((item) => item.task_id === createdTask.task.id);

if (!settlement) {
  throw new Error("客户确认后未找到对应结算记录");
}

await admin.request(`/api/settlements/${settlement.id}/confirm`, { method: "POST" });

const verified = (await finance.request<{ settlements: ApiSettlementRow[] }>("/api/settlements")).settlements.find(
  (item) => item.id === settlement.id,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      baseUrl,
      users: ["source01", "lawyer01", "finance01"],
      customerId: customer.customer.id,
      taskId: createdTask.task.id,
      settlementId: settlement.id,
      settlementAmountCents: settlement.settlement_amount_cents,
      finalSettlementStatus: verified?.status,
    },
    null,
    2,
  ),
);

async function ensureUser(
  session: ApiSession,
  input: {
    username: string;
    displayName: string;
    roleCode: string;
    rankId?: string;
  },
) {
  const users = (await session.request<{ users: ApiUserRow[] }>("/api/users")).users;
  const existing = users.find((user) => user.profiles?.username === input.username);

  if (existing) {
    return;
  }

  await session.request("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

async function login(session: ApiSession, username: string, password: string) {
  return session.request<{ mustChangePassword: boolean; user: unknown }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

async function loginAndClearDefaultPassword(username: string): Promise<ApiSession> {
  const session = new ApiSession(baseUrl);

  try {
    const result = await login(session, username, "111111");

    if (result.mustChangePassword) {
      await session.request("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword: testPassword }),
      });
    }

    return session;
  } catch {
    const fallback = new ApiSession(baseUrl);
    const result = await login(fallback, username, testPassword);

    if (result.mustChangePassword) {
      await fallback.request("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ newPassword: testPassword }),
      });
    }

    return fallback;
  }
}

function findRank(ranks: ApiRankRow[], code: string): ApiRankRow {
  const rank = ranks.find((item) => item.code === code);

  if (!rank) {
    throw new Error(`未找到职级 ${code}`);
  }

  return rank;
}

function requiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`缺少环境变量 ${key}`);
  }

  return value;
}

function splitCombinedSetCookie(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value.split(/,(?=\s*[^;,]+=)/g).map((item) => item.trim());
}

export {};
