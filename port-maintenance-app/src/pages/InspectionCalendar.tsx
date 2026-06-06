import { useState } from 'react';
import {
  Calendar,
  Badge,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  Button,
  List,
  Tag,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Radio,
  message,
} from 'antd';
import { PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { InspectionTask, InspectionItem, InspectionStatus } from '../types';
import { useAppStore } from '../context/StoreContext';

const { Option } = Select;
const { TextArea } = Input;

const statusConfig: Record<InspectionStatus, { color: string; text: string; icon: React.ReactNode }> = {
  '待执行': { color: 'default', text: '待执行', icon: <ClockCircleOutlined /> },
  '进行中': { color: 'processing', text: '进行中', icon: <ClockCircleOutlined spin /> },
  '已完成': { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
  '逾期': { color: 'error', text: '逾期', icon: <ExclamationCircleOutlined /> },
};

export const InspectionCalendar = () => {
  const { inspectionTasks, equipments, updateInspectionTask, addInspectionTask } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const getListData = (value: Dayjs) => {
    const dateStr = value.format('YYYY-MM-DD');
    return inspectionTasks.filter(task => task.planDate === dateStr);
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul className="events">
        {listData.slice(0, 3).map(item => (
          <li key={item.id}>
            <Badge
              status={statusConfig[item.status].color as any}
              text={<span style={{ fontSize: 12 }}>{item.equipmentName}</span>}
            />
          </li>
        ))}
        {listData.length > 3 && (
          <li style={{ fontSize: 12, color: '#999' }}>还有 {listData.length - 3} 项</li>
        )}
      </ul>
    );
  };

  const handleSelectDate = (value: Dayjs) => {
    setSelectedDate(value);
  };

  const handleAddTask = () => {
    form.resetFields();
    form.setFieldsValue({
      planDate: selectedDate,
    });
    setIsModalOpen(true);
  };

  const handleViewDetail = (task: InspectionTask) => {
    setSelectedTask(task);
    detailForm.setFieldsValue({
      result: task.result,
      items: task.items,
    });
    setIsDetailModalOpen(true);
  };

  const handleCreateTask = () => {
    form.validateFields().then(values => {
      const equipment = equipments.find(e => e.id === values.equipmentId);
      if (!equipment) return;

      const defaultItems: InspectionItem[] = [
        { id: `item${Date.now()}-1`, name: '外观检查', standard: '设备外观完好，无损伤' },
        { id: `item${Date.now()}-2`, name: '运行检查', standard: '运行平稳，无异响' },
        { id: `item${Date.now()}-3`, name: '安全装置', standard: '安全装置有效' },
      ].map(item => ({ ...item, result: '待检' as const }));

      const newTask: InspectionTask = {
        id: `ins${Date.now()}`,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        equipmentCode: equipment.code,
        title: values.title,
        inspector: values.inspector,
        planDate: values.planDate.format('YYYY-MM-DD'),
        status: '待执行',
        items: defaultItems,
      };
      addInspectionTask(newTask);
      message.success('点检任务创建成功');
      setIsModalOpen(false);
    });
  };

  const handleUpdateItemResult = (itemId: string, result: '正常' | '异常' | '待检') => {
    if (!selectedTask) return;
    const updatedItems = selectedTask.items.map(item =>
      item.id === itemId ? { ...item, result } : item
    );
    setSelectedTask({ ...selectedTask, items: updatedItems });
  };

  const handleUpdateItemRemark = (itemId: string, remark: string) => {
    if (!selectedTask) return;
    const updatedItems = selectedTask.items.map(item =>
      item.id === itemId ? { ...item, remark } : item
    );
    setSelectedTask({ ...selectedTask, items: updatedItems });
  };

  const handleSaveInspection = () => {
    if (!selectedTask) return;
    detailForm.validateFields().then(values => {
      const allChecked = selectedTask.items.every(item => item.result && item.result !== '待检');
      const status: InspectionStatus = allChecked ? '已完成' : '进行中';

      updateInspectionTask(selectedTask.id, {
        items: selectedTask.items,
        result: values.result,
        status,
        actualDate: allChecked ? dayjs().format('YYYY-MM-DD') : undefined,
      });
      message.success(allChecked ? '点检完成' : '点检已保存');
      setIsDetailModalOpen(false);
    });
  };

  const todayTasks = inspectionTasks.filter(t => t.planDate === dayjs().format('YYYY-MM-DD'));
  const stats = {
    total: inspectionTasks.length,
    today: todayTasks.length,
    completed: inspectionTasks.filter(t => t.status === '已完成').length,
    overdue: inspectionTasks.filter(t => t.status === '逾期').length,
    inProgress: inspectionTasks.filter(t => t.status === '进行中').length,
  };

  const selectedDateTasks = getListData(selectedDate);

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="点检任务总数" value={stats.total} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="今日待点检" value={stats.today} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="进行中" value={stats.inProgress} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已完成" value={stats.completed} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="已逾期" value={stats.overdue} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="点检日历" extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAddTask}>创建点检任务</Button>}>
            <Calendar
              cellRender={dateCellRender}
              onSelect={handleSelectDate}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={`${selectedDate.format('YYYY年MM月DD日')} 点检任务`}>
            {selectedDateTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                当日无点检任务
              </div>
            ) : (
              <List
                dataSource={selectedDateTasks}
                renderItem={task => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" onClick={() => handleViewDetail(task)}>
                        {task.status === '已完成' ? '查看详情' : '录入结果'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          {task.title}
                          <Tag color={statusConfig[task.status].color}>
                            {statusConfig[task.status].text}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <div>{task.equipmentName} ({task.equipmentCode})</div>
                          <div>点检员：{task.inspector}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="创建点检任务"
        open={isModalOpen}
        onOk={handleCreateTask}
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
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="如：6月日常点检" />
          </Form.Item>
          <Form.Item
            name="inspector"
            label="点检人员"
            rules={[{ required: true, message: '请输入点检人员' }]}
          >
            <Input placeholder="请输入点检人员姓名" />
          </Form.Item>
          <Form.Item
            name="planDate"
            label="计划日期"
            rules={[{ required: true, message: '请选择计划日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="点检详情"
        open={isDetailModalOpen}
        onOk={handleSaveInspection}
        onCancel={() => setIsDetailModalOpen(false)}
        width={800}
        okText="保存点检"
        destroyOnClose
      >
        {selectedTask && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <strong>设备：</strong>{selectedTask.equipmentName} ({selectedTask.equipmentCode})
                </Col>
                <Col span={8}>
                  <strong>点检员：</strong>{selectedTask.inspector}
                </Col>
                <Col span={8}>
                  <strong>状态：</strong>
                  <Tag color={statusConfig[selectedTask.status].color}>
                    {statusConfig[selectedTask.status].text}
                  </Tag>
                </Col>
              </Row>
            </div>

            <Form form={detailForm} layout="vertical">
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 12 }}>点检项目</h4>
                {selectedTask.items.map((item, index) => (
                  <Card key={item.id} size="small" style={{ marginBottom: 8 }}>
                    <Row gutter={16} align="middle">
                      <Col span={1}>
                        <strong>{index + 1}.</strong>
                      </Col>
                      <Col span={6}>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{item.standard}</div>
                      </Col>
                      <Col span={8}>
                        <Radio.Group
                          value={item.result}
                          onChange={e => handleUpdateItemResult(item.id, e.target.value)}
                          disabled={selectedTask.status === '已完成'}
                        >
                          <Radio value="正常">正常</Radio>
                          <Radio value="异常">异常</Radio>
                          <Radio value="待检">待检</Radio>
                        </Radio.Group>
                      </Col>
                      <Col span={9}>
                        <Input
                          placeholder="备注说明"
                          value={item.remark}
                          onChange={e => handleUpdateItemRemark(item.id, e.target.value)}
                          disabled={selectedTask.status === '已完成'}
                        />
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
              <Form.Item
                name="result"
                label="点检总结"
              >
                <TextArea rows={3} placeholder="请输入点检总结" disabled={selectedTask.status === '已完成'} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <style>{`
        .events {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .events li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
};
