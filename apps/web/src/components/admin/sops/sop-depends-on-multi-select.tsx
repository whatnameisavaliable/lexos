"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SopDependsOnMultiSelectProps {
  readonly options: readonly string[];
  readonly value: readonly string[];
  readonly onChange: (next: string[]) => void;
  readonly disabled?: boolean;
}

/** 多选前置 step_code（禁止选自身，由调用方过滤）。 */
export function SopDependsOnMultiSelect({
  options,
  value,
  onChange,
  disabled = false,
}: SopDependsOnMultiSelectProps) {
  const label =
    value.length > 0 ? value.join(", ") : "选择前置步骤";

  function toggle(code: string, checked: boolean) {
    if (checked) {
      onChange([...value, code]);
      return;
    }
    onChange(value.filter((item) => item !== code));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start font-normal"
          disabled={disabled}
        >
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {options.length === 0 ? (
          <p className="text-muted-foreground px-2 py-1.5 text-sm">无其他步骤</p>
        ) : null}
        {options.map((code) => (
          <DropdownMenuCheckboxItem
            key={code}
            checked={value.includes(code)}
            onCheckedChange={(checked) => toggle(code, checked === true)}
          >
            {code}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** 过滤掉自身 step_code（测试用）。 */
export function filterDependsOnOptions(
  allStepCodes: readonly string[],
  selfStepCode: string,
): string[] {
  return allStepCodes.filter((code) => code !== selfStepCode);
}
