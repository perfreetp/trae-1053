export type EquipmentType = '岸桥' | '场桥' | '牵引车' | '堆高机' | '正面吊';

export type MaintenanceLevel = '日常' | '一级' | '二级' | '三级';

export type FaultSeverity = '轻微' | '一般' | '严重' | '紧急';

export type WorkOrderStatus = '待指派' | '处理中' | '待验收' | '已完成' | '已取消';

export type InspectionStatus = '待执行' | '进行中' | '已完成' | '逾期';

export type PartStatus = '待审批' | '已批准' | '已领用' | '已归还';

export interface Equipment {
  id: string;
  name: string;
  code: string;
  type: EquipmentType;
  manufacturer: string;
  model: string;
  purchaseDate: string;
  location: string;
  status: '运行中' | '停机' | '维修中' | '保养中';
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceLevel: MaintenanceLevel;
  maintenanceCycleDays: number;
  spec?: string;
  remark?: string;
}

export interface InspectionTask {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  title: string;
  inspector: string;
  planDate: string;
  status: InspectionStatus;
  items: InspectionItem[];
  result?: string;
  actualDate?: string;
  remark?: string;
}

export interface InspectionItem {
  id: string;
  name: string;
  standard: string;
  result?: '正常' | '异常' | '待检';
  remark?: string;
}

export interface FaultReport {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  reporter: string;
  reportTime: string;
  title: string;
  description: string;
  severity: FaultSeverity;
  photos: string[];
  status: '待处理' | '处理中' | '已处理';
  workOrderId?: string;
}

export interface WorkOrder {
  id: string;
  faultReportId?: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  title: string;
  description: string;
  assignee: string;
  assignTime: string;
  status: WorkOrderStatus;
  startTime?: string;
  endTime?: string;
  downtimeHours?: number;
  partsUsed: PartUsage[];
  repairContent?: string;
  qualityScore?: number;
  qualityComment?: string;
  acceptTime?: string;
}

export interface PartUsage {
  id: string;
  partId: string;
  partName: string;
  partCode: string;
  quantity: number;
  unit: string;
}

export interface PartApplication {
  id: string;
  workOrderId?: string;
  applicant: string;
  applyTime: string;
  status: PartStatus;
  items: PartApplicationItem[];
  approver?: string;
  approveTime?: string;
  receiver?: string;
  receiveTime?: string;
  remark?: string;
}

export interface PartApplicationItem {
  id: string;
  partName: string;
  partCode: string;
  quantity: number;
  unit: string;
  purpose: string;
}

export interface Part {
  id: string;
  name: string;
  code: string;
  specification: string;
  unit: string;
  stock: number;
  minStock: number;
  location: string;
}

export interface DowntimeRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  reason: string;
  faultType: string;
  workOrderId?: string;
}

export interface MaintenanceArchive {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  workOrderId: string;
  type: '维修' | '保养';
  date: string;
  content: string;
  parts: PartUsage[];
  qualityScore: number;
  qualityComment: string;
  operator: string;
  archiveTime: string;
}
