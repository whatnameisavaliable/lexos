/** 云盘节点类型（`database.md` §3.5 · `drive_node_type` 枚举）。 */
export const DRIVE_NODE_TYPE_VALUES = ["folder", "file"] as const;

/** 云盘节点类型。 */
export type DriveNodeType = (typeof DRIVE_NODE_TYPE_VALUES)[number];
