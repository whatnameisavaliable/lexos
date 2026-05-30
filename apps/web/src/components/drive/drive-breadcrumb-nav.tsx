"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/** 面包屑路径段。 */
export interface DriveBreadcrumbSegment {
  readonly id: string;
  readonly name: string;
}

export interface DriveBreadcrumbNavProps {
  readonly segments: readonly DriveBreadcrumbSegment[];
  readonly onNavigate: (folderId: string) => void;
}

/**
 * 云盘路径导航（`ui_design.md` §6.4.1）。
 */
export function DriveBreadcrumbNav({
  segments,
  onNavigate,
}: DriveBreadcrumbNavProps) {
  if (segments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <BreadcrumbItem key={segment.id}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              {isLast ? (
                <BreadcrumbPage>{segment.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => onNavigate(segment.id)}
                  >
                    {segment.name}
                  </button>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
