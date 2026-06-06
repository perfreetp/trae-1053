import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Steps,
  Timeline,
  InputNumber,
  Rate,
  message,
  Divider,
  List,
} from 'antd';
import { PlusOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined, ToolOutlined, FileTextOutlined, DeleteOutlined } from '@ant-design/icons';
import type { WorkOrder, WorkOrderStatus, PartUsage } from '../types';
import { useAppStore } from '../context/StoreContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const statusConfig: Record<WorkOrderStatus, { color: string; step: number }> = {
  '待指派': { color: 'default', step: 0 },
  '处理中': { color: 'processing', step: 1 },
  '待验收': { color: 'warning', step: 2 },
  '已完成': { color: 'success', step: 3 },
  '已取消': { color: 'error', step: -1 },
};

const stepTitles = ['待指派', '处理中', '待验收', '已完成'];

const technicians = ['张工', '李工', '王工', '赵工', '刘工'];

export const WorkOrderManagement = () => {
  const { workOrders, equipments, parts, updateWorkOrder, addWorkOrder, updateFaultReport, addArchive, addDowntimeRecord, partApplications, updatePartApplication } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [partForm] = Form.useForm();
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [selectedParts, setSelectedParts] = useState<PartUsage[]>([]);

  const filteredOrders = workOrders.filter(order => !filterStatus || order.status === filterStatus);

  const handleAdd = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleViewDetail = (order: WorkOrder) => {
    setSelectedOrder(order);
    setSelectedParts([...order.partsUsed]);
    detailForm.setFieldsValue({
      repairContent: order.repairContent,
      qualityScore: order.qualityScore ? order.qualityScore / 20 : undefined,
      qualityComment: order.qualityComment,
    });
    setIsDetailModalOpen(true);
  };

  const handleAddPart = () => {
    partForm.validateFields().then(values => {
      const part = parts.find(p => p.id === values.partId);
      if (!part) return;

      const newPart: PartUsage = {
        id: `pu${Date.now()}`,
        partId: part.id,
        partName: part.name,
        partCode: part.code,
        quantity: values.quantity,
        unit: part.unit,
      };
      setSelectedParts(prev => [...prev, newPart]);
      partForm.resetFields();
      setIsPartModalOpen(false);
      message.success('备件添加成功');
    });
  };

  const handleRemovePart = (partId: string) => {
    setSelectedParts(prev => prev.filter(p => p.id !== partId));
  };

  const handleSyncPartApplication = (appId: string) => {
    const app = partApplications.find(a => a.id === appId);
    if (!app) return;

    const newParts = app.items.map(item => ({
      id: `pu${Date.now()}-${item.id}`,
      partId: item.partCode,
      partName: item.partName,
      partCode: item.partCode,
      quantity: item.quantity,
      unit: item.unit,
    }));

    setSelectedParts(prev => [...prev, ...newParts]);
    message.success('已同步备件领用明细');
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const equipment = equipments.find(e => e.id === values.equipmentId);
      if (!equipment) return;

      const newOrder: WorkOrder = {
        id: `wo${Date.now()}`,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentCode: equipment.code,
        title: values.title,
        description: values.description,
        assignee: values.assignee || '',
        assignTime: new Date().toLocaleString(),
        status: values.assignee ? '处理中' : '待指派',
        partsUsed: [],
      };
      addWorkOrder(newOrder);
      message.success('工单创建成功');
      setIsModalOpen(false);
    });
  };

  const handleAssign = (order: WorkOrder, assignee: string) => {
    updateWorkOrder(order.id, {
      assignee,
      status: '处理中',
      assignTime: new Date().toLocaleString(),
    });
    message.success('指派成功');
  };

  const handleStartWork = (order: WorkOrder) => {
    updateWorkOrder(order.id, {
      status: '处理中',
      startTime: new Date().toLocaleString(),
    });
    message.success('已开始处理');
    setIsDetailModalOpen(false);
  };

  const handleCompleteWork = () => {
    if (!selectedOrder) return;
    detailForm.validateFields().then(values => {
      const startTime = selectedOrder.startTime || selectedOrder.assignTime;
      const endTime = new Date().toLocaleString();
      const downtimeHours = dayjs(endTime).diff(dayjs(startTime), 'hour', true);

      updateWorkOrder(selectedOrder.id, {
        status: '待验收',
        endTime,
        repairContent: values.repairContent,
        partsUsed: selectedParts,
        downtimeHours: Number(downtimeHours.toFixed(1)),
      });
      message.success('维修完成，等待验收');
      setIsDetailModalOpen(false);
    });
  };

  const handleAccept = () => {
    if (!selectedOrder) return;
    detailForm.validateFields().then(values => {
      const score = Math.round((values.qualityScore || 0) * 20);
      const now = new Date().toLocaleString();
      const startTime = selectedOrder.startTime || selectedOrder.assignTime;
      const endTime = selectedOrder.endTime || now;
      const downtimeHours = dayjs(endTime).diff(dayjs(startTime), 'hour', true);

      updateWorkOrder(selectedOrder.id, {
        status: '已完成',
        qualityScore: score,
        qualityComment: values.qualityComment,
        acceptTime: now,
        partsUsed: selectedParts,
        downtimeHours: Number(downtimeHours.toFixed(1)),
      });

      if (selectedOrder.faultReportId) {
        updateFaultReport(selectedOrder.faultReportId, { status: '已处理' });
      }

      const archive = {
        id: `ar${Date.now()}`,
        equipmentId: selectedOrder.equipmentId,
        equipmentName: selectedOrder.equipmentName,
        equipmentCode: selectedOrder.equipmentCode,
        workOrderId: selectedOrder.id,
        type: '维修' as const,
        date: now,
        content: selectedOrder.repairContent || values.repairContent || '',
        parts: selectedParts,
        qualityScore: score,
        qualityComment: values.qualityComment || '',
        operator: selectedOrder.assignee || '系统',
        archiveTime: now,
      };
      addArchive(archive);

      const downtimeRecord = {
        id: `dt${Date.now()}`,
        equipmentId: selectedOrder.equipmentId,
        equipmentName: selectedOrder.equipmentName,
        equipmentCode: selectedOrder.equipmentCode,
        startTime,
        endTime,
        durationHours: Number(downtimeHours.toFixed(1)),
        reason: selectedOrder.title,
        faultType: '机械故障',
        workOrderId: selectedOrder.id,
      };
      addDowntimeRecord(downtimeRecord);

      message.success('验收通过，已自动生成归档记录和停机统计');
      setIsDetailModalOpen(false);
    });
  };

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '设备',
      key: 'equipment',
      width: 150,
      render: (_: unknown, record: WorkOrder) => (
        <div>
          <div>{record.equipmentName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.equipmentCode}</div>
        </div>
      ),
    },
    {
      title: '工单标题',
      dataIndex: 'title',
      key: 'title',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: WorkOrderStatus) => (
        <Tag color={statusConfig[status].color}>{status}</Tag>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 100,
      render: (assignee: string) => assignee || '未指派',
    },
    {
      title: '停机时长(h)',
      dataIndex: 'downtimeHours',
      key: 'downtimeHours',
      width: 100,
      render: (hours?: number) => hours ? `${hours}h` : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'assignTime',
      key: 'assignTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: WorkOrder) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === '待指派' && (
            <Select
              size="small"
              style={{ width: 100 }}
              placeholder="指派"
              onChange={(value) => handleAssign(record, value)}
            >
              {technicians.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: workOrders.length,
    pending: workOrders.filter(o => o.status === '待指派').length,
    processing: workOrders.filter(o => o.status === '处理中').length,
    checking: workOrders.filter(o => o.status === '待验收').length,
    completed: workOrders.filter(o => o.status === '已完成').length,
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="工单总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待指派" value={stats.pending} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="处理中" value={stats.processing} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待验收" value={stats.checking} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="维修工单列表"
        extra={
          <Space>
            <Select
              placeholder="筛选状态"
              style={{ width: 150 }}
              value={filterStatus || undefined}
              onChange={setFilterStatus}
              allowClear
            >
              <Option value="待指派">待指派</Option>
              <Option value="处理中">处理中</Option>
              <Option value="待验收">待验收</Option>
              <Option value="已完成">已完成</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建工单</Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="创建维修工单"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="equipmentId"
            label="选择设备"
            rules={[{ required: true, message: '请选择设备' }]}
          >
            <Select placeholder="请选择设备">
              {equipments.map(eq => (
                <Option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="工单标题"
            rules={[{ required: true, message: '请输入工单标题' }]}
          >
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Form.Item
            name="description"
            label="问题描述"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea rows={3} placeholder="请详细描述问题" />
          </Form.Item>
          <Form.Item name="assignee" label="指派维修人员(可选)">
            <Select placeholder="选择后工单直接进入处理中状态">
              {technicians.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="工单详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        width={800}
        footer={null}
        destroyOnClose
      >
        {selectedOrder && (
          <div>
            <Steps
            current={statusConfig[selectedOrder.status].step}
            items={stepTitles.map((title, index) => ({ title }))}
            style={{ marginBottom: 24 }}
          />

          <Row gutter={16}>
            <Col span={12}>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
                <p><ToolOutlined /> <strong>工单编号：</strong>{selectedOrder.id}</p>
                <p><FileTextOutlined /> <strong>设备：</strong>{selectedOrder.equipmentName} ({selectedOrder.equipmentCode})</p>
                <p><UserOutlined /> <strong>负责人：</strong>{selectedOrder.assignee || '未指派'}</p>
                <p><ClockCircleOutlined /> <strong>创建时间：</strong>{selectedOrder.assignTime}</p>
                {selectedOrder.startTime && <p><ClockCircleOutlined /> <strong>开始时间：</strong>{selectedOrder.startTime}</p>}
                {selectedOrder.endTime && <p><CheckCircleOutlined /> <strong>完成时间：</strong>{selectedOrder.endTime}</p>}
                {selectedOrder.downtimeHours && <p><ClockCircleOutlined /> <strong>停机时长：</strong>{selectedOrder.downtimeHours} 小时</p>}
              </Card>

              <Card size="small" title="问题描述">
                <p>{selectedOrder.description}</p>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="处理进度" style={{ marginBottom: 16 }}>
                <Timeline
                  items={[
                    { color: 'green', children: `工单创建 - ${selectedOrder.assignTime}` },
                    selectedOrder.assignee && { color: 'blue', children: `已指派给 ${selectedOrder.assignee}` },
                    selectedOrder.startTime && { color: 'blue', children: `开始处理 - ${selectedOrder.startTime}` },
                    selectedOrder.endTime && { color: 'orange', children: `维修完成 - ${selectedOrder.endTime}` },
                    selectedOrder.acceptTime && { color: 'green', children: `验收通过 - ${selectedOrder.acceptTime}` },
                  ].filter(Boolean)}
                />
              </Card>

              <Card size="small" title="更换备件" extra={
                selectedOrder.status === '处理中' && (
                  <Space>
                    {partApplications.filter(a => a.workOrderId === selectedOrder.id && a.status === '已领用').length > 0 && (
                      <Select
                        size="small"
                        placeholder="同步领用单"
                        style={{ width: 120 }}
                        onSelect={handleSyncPartApplication}
                      >
                        {partApplications.filter(a => a.workOrderId === selectedOrder.id && a.status === '已领用').map(app => (
                          <Option key={app.id} value={app.id}>{app.id}</Option>
                        ))}
                      </Select>
                    )}
                    <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setIsPartModalOpen(true)}>
                      登记
                    </Button>
                  </Space>
                )
              }>
                {selectedParts.length === 0 ? (
                  <p style={{ color: '#999', textAlign: 'center' }}>暂无更换备件记录</p>
                ) : (
                  <List
                    size="small"
                    dataSource={selectedParts}
                    renderItem={(part: PartUsage) => (
                      <List.Item
                        actions={selectedOrder.status === '处理中' ? [
                          <Button key="delete" type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemovePart(part.id)} />
                        ] : []}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <span>{part.partName} ({part.partCode})</span>
                          <span style={{ fontWeight: 500 }}>{part.quantity} {part.unit}</span>
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </Col>
          </Row>

            {selectedOrder.status === '处理中' && (
              <Card size="small" title="维修记录" style={{ marginTop: 16 }}>
                <Form form={detailForm} layout="vertical">
                  <Form.Item
                    name="repairContent"
                    label="维修内容"
                    rules={[{ required: true, message: '请输入维修内容' }]}
                  >
                    <TextArea rows={3} placeholder="请输入维修内容、更换部件等" />
                  </Form.Item>
                  <div style={{ textAlign: 'right' }}>
                    <Button type="primary" onClick={handleCompleteWork}>完成维修</Button>
                  </div>
                </Form>
              </Card>
            )}

            {selectedOrder.status === '待验收' && (
              <Card size="small" title="质量验收" style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <strong>维修内容：</strong>
                  <p style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                    {selectedOrder.repairContent}
                  </p>
                </div>
                <Form form={detailForm} layout="vertical">
                  <Form.Item
                    name="qualityScore"
                    label="维修质量评分"
                    rules={[{ required: true, message: '请评分' }]}
                  >
                    <Rate />
                  </Form.Item>
                  <Form.Item name="qualityComment" label="评价意见">
                    <TextArea rows={2} placeholder="请输入评价意见" />
                  </Form.Item>
                  <div style={{ textAlign: 'right' }}>
                    <Button type="primary" onClick={handleAccept}>通过验收</Button>
                  </div>
                </Form>
              </Card>
            )}

            {selectedOrder.status === '已完成' && (
              <Card size="small" title="验收结果" style={{ marginTop: 16 }}>
                <p><strong>维修内容：</strong>{selectedOrder.repairContent}</p>
                <p><strong>质量评分：</strong>
                  <Rate disabled value={selectedOrder.qualityScore ? selectedOrder.qualityScore / 20 : 0} />
                  <span style={{ marginLeft: 8 }}>{selectedOrder.qualityScore}分</span>
                </p>
                {selectedOrder.qualityComment && <p><strong>评价意见：</strong>{selectedOrder.qualityComment}</p>}
              </Card>
            )}

            {selectedOrder.status === '待指派' && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Select
                  style={{ width: 200, marginRight: 12 }}
                  placeholder="选择维修人员"
                  onChange={(value) => handleAssign(selectedOrder, value)}
                >
                  {technicians.map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </div>
            )}

            {selectedOrder.status === '待指派' && selectedOrder.assignee && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Button type="primary" onClick={() => handleStartWork(selectedOrder)}>开始处理</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="登记更换备件"
        open={isPartModalOpen}
        onOk={handleAddPart}
        onCancel={() => setIsPartModalOpen(false)}
        width={500}
        destroyOnClose
      >
        <Form form={partForm} layout="vertical">
          <Form.Item
            name="partId"
            label="选择备件"
            rules={[{ required: true, message: '请选择备件' }]}
          >
            <Select placeholder="请选择备件">
              {parts.map(part => (
                <Option key={part.id} value={part.id}>
                  {part.name} ({part.code}) - 库存: {part.stock}{part.unit}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
