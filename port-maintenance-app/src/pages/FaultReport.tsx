import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Upload,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  message,
  Image,
} from 'antd';
import { PlusOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { FaultReport, FaultSeverity } from '../types';
import { useAppStore } from '../context/StoreContext';

const { Option } = Select;
const { TextArea } = Input;

const severityConfig: Record<FaultSeverity, { color: string; bgColor: string }> = {
  '轻微': { color: '#52c41a', bgColor: '#f6ffed' },
  '一般': { color: '#1890ff', bgColor: '#e6f7ff' },
  '严重': { color: '#fa8c16', bgColor: '#fff7e6' },
  '紧急': { color: '#f5222d', bgColor: '#fff1f0' },
};

const statusColors: Record<string, string> = {
  '待处理': 'warning',
  '处理中': 'processing',
  '已处理': 'success',
};

export const FaultReportPage = () => {
  const { faultReports, equipments, addFaultReport, updateFaultReport, workOrders, updateWorkOrder, addWorkOrder } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FaultReport | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const handleAdd = () => {
    form.resetFields();
    setFileList([]);
    setIsModalOpen(true);
  };

  const handleViewDetail = (report: FaultReport) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const handleCreateWorkOrder = (report: FaultReport) => {
    Modal.confirm({
      title: '生成维修工单',
      content: `确定为故障"${report.title}"生成维修工单吗？`,
      onOk: () => {
        const newWorkOrder = {
          id: `wo${Date.now()}`,
          faultReportId: report.id,
          equipmentId: report.equipmentId,
          equipmentName: report.equipmentName,
          equipmentCode: report.equipmentCode,
          title: report.title,
          description: report.description,
          assignee: '',
          assignTime: new Date().toLocaleString(),
          status: '待指派' as const,
          partsUsed: [],
        };
        addWorkOrder(newWorkOrder);
        updateFaultReport(report.id, { status: '处理中', workOrderId: newWorkOrder.id });
        message.success('维修工单已生成');
      },
    });
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const equipment = equipments.find(e => e.id === values.equipmentId);
      if (!equipment) return;

      const newReport: FaultReport = {
        id: `ft${Date.now()}`,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentCode: equipment.code,
        reporter: values.reporter,
        reportTime: new Date().toLocaleString(),
        title: values.title,
        description: values.description,
        severity: values.severity,
        photos: [],
        status: '待处理',
      };
      addFaultReport(newReport);
      message.success('故障报修成功');
      setIsModalOpen(false);
    });
  };

  const columns = [
    {
      title: '故障编号',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '设备',
      key: 'equipment',
      width: 150,
      render: (_: unknown, record: FaultReport) => (
        <div>
          <div>{record.equipmentName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.equipmentCode}</div>
        </div>
      ),
    },
    {
      title: '故障标题',
      dataIndex: 'title',
      key: 'title',
      width: 180,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: FaultSeverity) => (
        <Tag color={severityConfig[severity].color}>{severity}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Badge status={statusColors[status] as any} text={status} />,
    },
    {
      title: '报修人',
      dataIndex: 'reporter',
      key: 'reporter',
      width: 100,
    },
    {
      title: '报修时间',
      dataIndex: 'reportTime',
      key: 'reportTime',
      width: 160,
    },
    {
      title: '关联工单',
      dataIndex: 'workOrderId',
      key: 'workOrderId',
      width: 120,
      render: (id?: string) => id || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: FaultReport) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>查看</Button>
          {record.status === '待处理' && (
            <Button type="link" size="small" onClick={() => handleCreateWorkOrder(record)}>生成工单</Button>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: faultReports.length,
    pending: faultReports.filter(r => r.status === '待处理').length,
    processing: faultReports.filter(r => r.status === '处理中').length,
    completed: faultReports.filter(r => r.status === '已处理').length,
    urgent: faultReports.filter(r => r.severity === '紧急' && r.status !== '已处理').length,
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="故障总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待处理" value={stats.pending} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="处理中" value={stats.processing} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已处理" value={stats.completed} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="紧急故障" value={stats.urgent} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      <Card title="故障报修列表" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>报修故障</Button>}>
        <Table
          columns={columns}
          dataSource={faultReports}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="故障报修"
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
            <Select placeholder="请选择故障设备">
              {equipments.map(eq => (
                <Option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="title"
            label="故障标题"
            rules={[{ required: true, message: '请输入故障标题' }]}
          >
            <Input placeholder="请简要描述故障" />
          </Form.Item>
          <Form.Item
            name="severity"
            label="严重程度"
            rules={[{ required: true, message: '请选择严重程度' }]}
          >
            <Select placeholder="请选择严重程度">
              <Option value="轻微">轻微 - 不影响正常作业</Option>
              <Option value="一般">一般 - 部分功能受限</Option>
              <Option value="严重">严重 - 主要功能受影响</Option>
              <Option value="紧急">紧急 - 设备停机，需立即处理</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="reporter"
            label="报修人"
            rules={[{ required: true, message: '请输入报修人' }]}
          >
            <Input placeholder="请输入报修人姓名" />
          </Form.Item>
          <Form.Item
            name="description"
            label="故障描述"
            rules={[{ required: true, message: '请输入故障描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述故障现象、发生时间等信息" />
          </Form.Item>
          <Form.Item label="上传故障照片">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传照片</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="故障详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>关闭</Button>,
          selectedReport?.status === '待处理' && (
            <Button key="create" type="primary" onClick={() => { handleCreateWorkOrder(selectedReport); setIsDetailModalOpen(false); }}>
              生成维修工单
            </Button>
          ),
        ]}
        width={700}
        destroyOnClose
      >
        {selectedReport && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small" title="基本信息">
                  <p><strong>设备：</strong>{selectedReport.equipmentName} ({selectedReport.equipmentCode})</p>
                  <p><strong>报修人：</strong>{selectedReport.reporter}</p>
                  <p><strong>报修时间：</strong>{selectedReport.reportTime}</p>
                  <p>
                    <strong>严重程度：</strong>
                    <Tag color={severityConfig[selectedReport.severity].color}>{selectedReport.severity}</Tag>
                  </p>
                  <p>
                    <strong>状态：</strong>
                    <Badge status={statusColors[selectedReport.status] as any} text={selectedReport.status} />
                  </p>
                  {selectedReport.workOrderId && (
                    <p><strong>关联工单：</strong>{selectedReport.workOrderId}</p>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="故障描述">
                  <p>{selectedReport.description}</p>
                </Card>
              </Col>
            </Row>
            {selectedReport.photos && selectedReport.photos.length > 0 && (
              <Card size="small" title="故障照片">
                <Image.PreviewGroup>
                  <Space wrap>
                    {selectedReport.photos.map((photo, index) => (
                      <Image key={index} width={100} src={photo} />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
