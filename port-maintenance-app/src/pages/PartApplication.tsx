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
  InputNumber,
  message,
  List,
  Badge,
} from 'antd';
import { PlusOutlined, CheckOutlined, InboxOutlined } from '@ant-design/icons';
import type { PartApplication, PartApplicationItem, PartStatus } from '../types';
import { useAppStore } from '../context/StoreContext';

const { Option } = Select;
const { TextArea } = Input;

const statusConfig: Record<PartStatus, { color: string; text: string }> = {
  '待审批': { color: 'warning', text: '待审批' },
  '已批准': { color: 'processing', text: '已批准' },
  '已领用': { color: 'success', text: '已领用' },
  '已归还': { color: 'default', text: '已归还' },
};

export const PartApplicationPage = () => {
  const { partApplications, parts, workOrders, addPartApplication, updatePartApplication } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<PartApplication | null>(null);
  const [items, setItems] = useState<PartApplicationItem[]>([]);
  const [form] = Form.useForm();

  const handleAdd = () => {
    form.resetFields();
    setItems([]);
    setIsModalOpen(true);
  };

  const handleViewDetail = (app: PartApplication) => {
    setSelectedApplication(app);
    setIsDetailModalOpen(true);
  };

  const handleAddItem = () => {
    const newItem: PartApplicationItem = {
      id: `item${Date.now()}`,
      partName: '',
      partCode: '',
      quantity: 1,
      unit: '',
      purpose: '',
    };
    setItems([...items, newItem]);
  };

  const handleUpdateItem = (index: number, field: keyof PartApplicationItem, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    if (field === 'partCode') {
      const part = parts.find(p => p.code === value);
      if (part) {
        newItems[index].partName = part.name;
        newItems[index].unit = part.unit;
      }
    }
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (items.length === 0) {
        message.warning('请至少添加一个备件');
        return;
      }

      const newApp: PartApplication = {
        id: `pa${Date.now()}`,
        workOrderId: values.workOrderId,
        applicant: values.applicant,
        applyTime: new Date().toLocaleString(),
        status: '待审批',
        items: items.filter(i => i.partName && i.quantity > 0),
        remark: values.remark,
      };
      addPartApplication(newApp);
      message.success('申请已提交');
      setIsModalOpen(false);
    });
  };

  const handleApprove = (app: PartApplication) => {
    updatePartApplication(app.id, {
      status: '已批准',
      approver: '王主管',
      approveTime: new Date().toLocaleString(),
    });
    message.success('已批准');
    setIsDetailModalOpen(false);
  };

  const handleReceive = (app: PartApplication) => {
    updatePartApplication(app.id, {
      status: '已领用',
      receiver: app.applicant,
      receiveTime: new Date().toLocaleString(),
    });
    message.success('已确认领用');
    setIsDetailModalOpen(false);
  };

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '关联工单',
      dataIndex: 'workOrderId',
      key: 'workOrderId',
      width: 120,
      render: (id?: string) => id || '-',
    },
    {
      title: '申请人',
      dataIndex: 'applicant',
      key: 'applicant',
      width: 100,
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PartStatus) => <Tag color={statusConfig[status].color}>{statusConfig[status].text}</Tag>,
    },
    {
      title: '备件数量',
      key: 'itemCount',
      width: 100,
      render: (_: unknown, record: PartApplication) => record.items.length + ' 项',
    },
    {
      title: '审批人',
      dataIndex: 'approver',
      key: 'approver',
      width: 100,
      render: (name?: string) => name || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: PartApplication) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === '待审批' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>审批</Button>
          )}
          {record.status === '已批准' && (
            <Button type="link" size="small" icon={<InboxOutlined />} onClick={() => handleReceive(record)}>领用</Button>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: partApplications.length,
    pending: partApplications.filter(a => a.status === '待审批').length,
    approved: partApplications.filter(a => a.status === '已批准').length,
    received: partApplications.filter(a => a.status === '已领用').length,
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="申请总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="待审批" value={stats.pending} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已批准" value={stats.approved} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已领用" value={stats.received} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="库存备件" value={parts.length} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="备件申请列表" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>申请备件</Button>}>
            <Table
              columns={columns}
              dataSource={partApplications}
              rowKey="id"
              scroll={{ x: 1000 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="备件库存">
            <List
              dataSource={parts}
              renderItem={part => (
                <List.Item
                  actions={[
                    <Badge
                      key="stock"
                      count={part.stock}
                      showZero
                      style={{ backgroundColor: part.stock < part.minStock ? '#f5222d' : '#52c41a' }}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    title={part.name}
                    description={
                      <div>
                        <span>编码：{part.code}</span>
                        <span style={{ marginLeft: 12 }}>规格：{part.specification}</span>
                        <div>位置：{part.location}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="备件申请"
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="applicant"
                label="申请人"
                rules={[{ required: true, message: '请输入申请人' }]}
              >
                <Input placeholder="请输入申请人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="workOrderId" label="关联工单">
                <Select placeholder="选择关联工单(可选)" allowClear>
                  {workOrders.map(wo => (
                    <Option key={wo.id} value={wo.id}>{wo.id} - {wo.title}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Card
            size="small"
            title="备件明细"
            extra={<Button type="dashed" size="small" icon={<PlusOutlined />} onClick={handleAddItem}>添加备件</Button>}
            style={{ marginBottom: 16 }}
          >
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>暂无备件，点击上方按钮添加</div>
            ) : (
              items.map((item, index) => (
                <Row key={item.id} gutter={8} style={{ marginBottom: 8 }} align="top">
                  <Col span={7}>
                    <Select
                      placeholder="选择备件"
                      style={{ width: '100%' }}
                      value={item.partCode || undefined}
                      onChange={value => handleUpdateItem(index, 'partCode', value)}
                    >
                      {parts.map(p => (
                        <Option key={p.code} value={p.code}>{p.name} ({p.code})</Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={4}>
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      value={item.quantity}
                      onChange={value => handleUpdateItem(index, 'quantity', value)}
                      placeholder="数量"
                    />
                  </Col>
                  <Col span={3}>
                    <Input value={item.unit} placeholder="单位" disabled />
                  </Col>
                  <Col span={8}>
                    <Input
                      value={item.purpose}
                      onChange={e => handleUpdateItem(index, 'purpose', e.target.value)}
                      placeholder="用途"
                    />
                  </Col>
                  <Col span={2}>
                    <Button type="text" danger onClick={() => handleRemoveItem(index)}>删除</Button>
                  </Col>
                </Row>
              ))
            )}
          </Card>

          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="备注说明" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>关闭</Button>,
          selectedApplication?.status === '待审批' && (
            <Button key="approve" type="primary" onClick={() => handleApprove(selectedApplication)}>批准</Button>
          ),
          selectedApplication?.status === '已批准' && (
            <Button key="receive" type="primary" onClick={() => handleReceive(selectedApplication)}>确认领用</Button>
          ),
        ]}
        width={600}
        destroyOnClose
      >
        {selectedApplication && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <p><strong>申请编号：</strong>{selectedApplication.id}</p>
                <p><strong>申请人：</strong>{selectedApplication.applicant}</p>
                <p><strong>申请时间：</strong>{selectedApplication.applyTime}</p>
              </Col>
              <Col span={12}>
                <p><strong>状态：</strong><Tag color={statusConfig[selectedApplication.status].color}>{statusConfig[selectedApplication.status].text}</Tag></p>
                <p><strong>关联工单：</strong>{selectedApplication.workOrderId || '-'}</p>
                {selectedApplication.approver && <p><strong>审批人：</strong>{selectedApplication.approver}</p>}
                {selectedApplication.receiveTime && <p><strong>领用时间：</strong>{selectedApplication.receiveTime}</p>}
              </Col>
            </Row>
            <Card size="small" title="备件明细">
              <List
                dataSource={selectedApplication.items}
                renderItem={item => (
                  <List.Item>
                    <Row style={{ width: '100%' }}>
                      <Col span={8}>{item.partName}</Col>
                      <Col span={4}>{item.partCode}</Col>
                      <Col span={4}>{item.quantity}{item.unit}</Col>
                      <Col span={8}>{item.purpose}</Col>
                    </Row>
                  </List.Item>
                )}
              />
            </Card>
            {selectedApplication.remark && (
              <p style={{ marginTop: 16 }}><strong>备注：</strong>{selectedApplication.remark}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
