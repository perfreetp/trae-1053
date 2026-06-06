import { useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { Equipment, EquipmentType, MaintenanceLevel } from '../types';
import { useAppStore } from '../context/StoreContext';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const statusColors: Record<string, string> = {
  '运行中': 'green',
  '停机': 'red',
  '维修中': 'orange',
  '保养中': 'blue',
};

const typeColors: Record<string, string> = {
  '岸桥': 'blue',
  '场桥': 'cyan',
  '牵引车': 'green',
  '堆高机': 'purple',
  '正面吊': 'orange',
};

export const EquipmentLedger = () => {
  const { equipments, addEquipment, updateEquipment, deleteEquipment } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [form] = Form.useForm();

  const filteredEquipments = equipments.filter(eq => {
    const matchSearch = !searchText ||
      eq.name.includes(searchText) ||
      eq.code.includes(searchText) ||
      eq.location.includes(searchText);
    const matchType = !filterType || eq.type === filterType;
    const matchStatus = !filterStatus || eq.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const handleAdd = () => {
    setEditingEquipment(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    form.setFieldsValue({
      ...eq,
      purchaseDate: eq.purchaseDate ? dayjs(eq.purchaseDate) : undefined,
      lastMaintenanceDate: eq.lastMaintenanceDate ? dayjs(eq.lastMaintenanceDate) : undefined,
      nextMaintenanceDate: eq.nextMaintenanceDate ? dayjs(eq.nextMaintenanceDate) : undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该设备吗？',
      onOk: () => {
        deleteEquipment(id);
        message.success('删除成功');
      },
    });
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const formattedValues = {
        ...values,
        purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
        lastMaintenanceDate: values.lastMaintenanceDate?.format('YYYY-MM-DD'),
        nextMaintenanceDate: values.nextMaintenanceDate?.format('YYYY-MM-DD'),
      };

      if (editingEquipment) {
        updateEquipment(editingEquipment.id, formattedValues);
        message.success('更新成功');
      } else {
        const newEquipment: Equipment = {
          id: `eq${Date.now()}`,
          ...formattedValues,
        };
        addEquipment(newEquipment);
        message.success('添加成功');
      }
      setIsModalOpen(false);
    });
  };

  const columns = [
    {
      title: '设备编号',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '设备类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: EquipmentType) => <Tag color={typeColors[type]}>{type}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: '制造商',
      dataIndex: 'manufacturer',
      key: 'manufacturer',
      width: 120,
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 120,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: '保养级别',
      dataIndex: 'maintenanceLevel',
      key: 'maintenanceLevel',
      width: 100,
    },
    {
      title: '下次保养日期',
      dataIndex: 'nextMaintenanceDate',
      key: 'nextMaintenanceDate',
      width: 130,
      render: (date?: string) => {
        if (!date) return '-';
        const isOverdue = dayjs(date).isBefore(dayjs());
        return <span style={{ color: isOverdue ? 'red' : undefined }}>{date}</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: Equipment) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const stats = {
    total: equipments.length,
    running: equipments.filter(e => e.status === '运行中').length,
    repair: equipments.filter(e => e.status === '维修中').length,
    stopped: equipments.filter(e => e.status === '停机').length,
    overdue: equipments.filter(e => e.nextMaintenanceDate && dayjs(e.nextMaintenanceDate).isBefore(dayjs())).length,
  };

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="设备总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="运行中" value={stats.running} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="维修中" value={stats.repair} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="停机" value={stats.stopped} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="逾期保养" value={stats.overdue} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索设备名称/编号/位置"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="设备类型"
            style={{ width: 150 }}
            value={filterType || undefined}
            onChange={setFilterType}
            allowClear
          >
            <Option value="岸桥">岸桥</Option>
            <Option value="场桥">场桥</Option>
            <Option value="牵引车">牵引车</Option>
            <Option value="堆高机">堆高机</Option>
            <Option value="正面吊">正面吊</Option>
          </Select>
          <Select
            placeholder="设备状态"
            style={{ width: 150 }}
            value={filterStatus || undefined}
            onChange={setFilterStatus}
            allowClear
          >
            <Option value="运行中">运行中</Option>
            <Option value="停机">停机</Option>
            <Option value="维修中">维修中</Option>
            <Option value="保养中">保养中</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加设备
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredEquipments}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingEquipment ? '编辑设备' : '添加设备'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="设备编号"
                rules={[{ required: true, message: '请输入设备编号' }]}
              >
                <Input placeholder="如：AQ-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="设备名称"
                rules={[{ required: true, message: '请输入设备名称' }]}
              >
                <Input placeholder="如：岸桥01" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
              >
                <Select>
                  <Option value="岸桥">岸桥</Option>
                  <Option value="场桥">场桥</Option>
                  <Option value="牵引车">牵引车</Option>
                  <Option value="堆高机">堆高机</Option>
                  <Option value="正面吊">正面吊</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="设备状态"
                rules={[{ required: true, message: '请选择设备状态' }]}
                initialValue="运行中"
              >
                <Select>
                  <Option value="运行中">运行中</Option>
                  <Option value="停机">停机</Option>
                  <Option value="维修中">维修中</Option>
                  <Option value="保养中">保养中</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="manufacturer" label="制造商">
                <Input placeholder="如：上海振华重工" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="型号">
                <Input placeholder="如：ZPMC-STS-65" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="purchaseDate" label="购置日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="所在位置">
                <Input placeholder="如：A区01泊位" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="maintenanceLevel"
                label="保养级别"
                initialValue="日常"
              >
                <Select>
                  <Option value="日常">日常</Option>
                  <Option value="一级">一级</Option>
                  <Option value="二级">二级</Option>
                  <Option value="三级">三级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="maintenanceCycleDays"
                label="保养周期(天)"
                initialValue={30}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nextMaintenanceDate" label="下次保养日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="spec" label="规格参数">
            <TextArea rows={2} placeholder="如：起重量65t，外伸距65m" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
