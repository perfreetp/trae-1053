import { useState, useCallback } from 'react';
import type { Equipment, InspectionTask, FaultReport, WorkOrder, PartApplication, Part, DowntimeRecord, MaintenanceArchive } from '../types';
import {
  mockEquipments,
  mockInspectionTasks,
  mockFaultReports,
  mockWorkOrders,
  mockParts,
  mockPartApplications,
  mockDowntimeRecords,
  mockArchives,
} from '../data/mockData';

export const useStore = () => {
  const [equipments, setEquipments] = useState<Equipment[]>(mockEquipments);
  const [inspectionTasks, setInspectionTasks] = useState<InspectionTask[]>(mockInspectionTasks);
  const [faultReports, setFaultReports] = useState<FaultReport[]>(mockFaultReports);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(mockWorkOrders);
  const [parts, setParts] = useState<Part[]>(mockParts);
  const [partApplications, setPartApplications] = useState<PartApplication[]>(mockPartApplications);
  const [downtimeRecords, setDowntimeRecords] = useState<DowntimeRecord[]>(mockDowntimeRecords);
  const [archives, setArchives] = useState<MaintenanceArchive[]>(mockArchives);

  const addEquipment = useCallback((eq: Equipment) => {
    setEquipments(prev => [...prev, eq]);
  }, []);

  const updateEquipment = useCallback((id: string, eq: Partial<Equipment>) => {
    setEquipments(prev => prev.map(item => item.id === id ? { ...item, ...eq } : item));
  }, []);

  const deleteEquipment = useCallback((id: string) => {
    setEquipments(prev => prev.filter(item => item.id !== id));
  }, []);

  const addInspectionTask = useCallback((task: InspectionTask) => {
    setInspectionTasks(prev => [...prev, task]);
  }, []);

  const updateInspectionTask = useCallback((id: string, task: Partial<InspectionTask>) => {
    setInspectionTasks(prev => prev.map(item => item.id === id ? { ...item, ...task } : item));
  }, []);

  const addFaultReport = useCallback((report: FaultReport) => {
    setFaultReports(prev => [...prev, report]);
  }, []);

  const updateFaultReport = useCallback((id: string, report: Partial<FaultReport>) => {
    setFaultReports(prev => prev.map(item => item.id === id ? { ...item, ...report } : item));
  }, []);

  const addWorkOrder = useCallback((order: WorkOrder) => {
    setWorkOrders(prev => [...prev, order]);
  }, []);

  const updateWorkOrder = useCallback((id: string, order: Partial<WorkOrder>) => {
    setWorkOrders(prev => prev.map(item => item.id === id ? { ...item, ...order } : item));
  }, []);

  const addPartApplication = useCallback((app: PartApplication) => {
    setPartApplications(prev => [...prev, app]);
  }, []);

  const updatePartApplication = useCallback((id: string, app: Partial<PartApplication>) => {
    setPartApplications(prev => prev.map(item => item.id === id ? { ...item, ...app } : item));
  }, []);

  const addArchive = useCallback((archive: MaintenanceArchive) => {
    setArchives(prev => [...prev, archive]);
  }, []);

  const addDowntimeRecord = useCallback((record: DowntimeRecord) => {
    setDowntimeRecords(prev => [...prev, record]);
  }, []);

  const updatePart = useCallback((id: string, part: Partial<Part>) => {
    setParts(prev => prev.map(item => item.id === id ? { ...item, ...part } : item));
  }, []);

  return {
    equipments,
    inspectionTasks,
    faultReports,
    workOrders,
    parts,
    partApplications,
    downtimeRecords,
    archives,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addInspectionTask,
    updateInspectionTask,
    addFaultReport,
    updateFaultReport,
    addWorkOrder,
    updateWorkOrder,
    addPartApplication,
    updatePartApplication,
    addArchive,
    addDowntimeRecord,
    updatePart,
  };
};

export type StoreType = ReturnType<typeof useStore>;
