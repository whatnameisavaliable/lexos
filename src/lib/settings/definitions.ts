export type SystemSettingType = "boolean" | "number" | "string";
export type SystemSettingValue = boolean | number | string;

export type SystemSettingDefinition = {
  defaultValue: SystemSettingValue;
  description: string;
  key: string;
  label: string;
  max?: number;
  min?: number;
  type: SystemSettingType;
};

export type SystemSettingItem = SystemSettingDefinition & {
  updatedAt?: string;
  value: SystemSettingValue;
};

export const SYSTEM_SETTING_DEFINITIONS: SystemSettingDefinition[] = [
  {
    defaultValue: "111111",
    description: "客户通过安全链接访问大屏时使用的演示验证码。正式接入短信服务后应改为动态验证码策略。",
    key: "customer_portal_demo_code",
    label: "客户大屏演示验证码",
    type: "string",
  },
  {
    defaultValue: 30,
    description: "客户确认或逾期流程进入结算前的默认锁定天数预留值。",
    key: "settlement_lock_days",
    label: "结算锁定天数",
    max: 365,
    min: 0,
    type: "number",
  },
  {
    defaultValue: 7,
    description: "任务经发起人验收后，客户超过该天数未确认时，可由主任触发系统视为交付并生成待结算记录。0 表示停用。",
    key: "customer_auto_confirm_days",
    label: "客户自动确认天数",
    max: 365,
    min: 0,
    type: "number",
  },
  {
    defaultValue: 0,
    description: "一级关注风控工单形成扣减建议时使用的比例，单位为基点；100 表示 1%。",
    key: "risk_deduction_low_basis_points",
    label: "一级关注扣减比例",
    max: 10000,
    min: 0,
    type: "number",
  },
  {
    defaultValue: 500,
    description: "二级一般风控工单形成扣减建议时使用的比例，单位为基点；500 表示 5%。",
    key: "risk_deduction_medium_basis_points",
    label: "二级一般扣减比例",
    max: 10000,
    min: 0,
    type: "number",
  },
  {
    defaultValue: 1500,
    description: "三级严重风控工单形成扣减建议时使用的比例，单位为基点；1500 表示 15%。",
    key: "risk_deduction_high_basis_points",
    label: "三级严重扣减比例",
    max: 10000,
    min: 0,
    type: "number",
  },
  {
    defaultValue: 3000,
    description: "四级重大风控工单形成扣减建议时使用的比例，单位为基点；3000 表示 30%。",
    key: "risk_deduction_critical_basis_points",
    label: "四级重大扣减比例",
    max: 10000,
    min: 0,
    type: "number",
  },
  {
    defaultValue: 50,
    description: "真实 API 列表接口的默认分页数量，最大不超过 100。",
    key: "default_page_size",
    label: "默认分页数量",
    max: 100,
    min: 10,
    type: "number",
  },
  {
    defaultValue: true,
    description: "控制后台是否显示演示模式提示，便于区分本地 demo 与真实 API。",
    key: "demo_mode_hint_enabled",
    label: "显示演示模式提示",
    type: "boolean",
  },
];

export function buildSystemSettingsFromRows(rows: Array<{ key: string; updated_at?: string | null; value: unknown }>): SystemSettingItem[] {
  const rowsByKey = new Map(rows.map((row) => [row.key, row]));

  return SYSTEM_SETTING_DEFINITIONS.map((definition) => {
    const row = rowsByKey.get(definition.key);

    return {
      ...definition,
      updatedAt: row?.updated_at ?? undefined,
      value: readSystemSettingValue(definition, row?.value),
    };
  });
}

export function normalizeSystemSettingValue(key: string, value: unknown): SystemSettingValue {
  const definition = SYSTEM_SETTING_DEFINITIONS.find((item) => item.key === key);

  if (!definition) {
    throw new Error(`未知系统参数：${key}`);
  }

  return readSystemSettingValue(definition, value);
}

function readSystemSettingValue(definition: SystemSettingDefinition, value: unknown): SystemSettingValue {
  const fallback = definition.defaultValue;

  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (definition.type === "boolean") {
    if (typeof value !== "boolean") {
      throw new Error(`${definition.label}必须是布尔值`);
    }

    return value;
  }

  if (definition.type === "number") {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      throw new Error(`${definition.label}必须是数字`);
    }

    if (definition.min !== undefined && numberValue < definition.min) {
      throw new Error(`${definition.label}不能小于 ${definition.min}`);
    }

    if (definition.max !== undefined && numberValue > definition.max) {
      throw new Error(`${definition.label}不能大于 ${definition.max}`);
    }

    return numberValue;
  }

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${definition.label}不能为空`);
  }

  return value.trim();
}
