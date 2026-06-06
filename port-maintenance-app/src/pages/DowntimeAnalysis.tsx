import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Tag,
  Space,
  List,
  Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DowntimeRecord } from '../types';
import { useAppStore } from '../context/StoreContext';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const DowntimeAnalysis = () => {
  const { downtimeRecords, equipments } = useAppStore();
  const [filterEquipment, setFilterEquipment] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const filteredRecords = useMemo(() => {
    return downtimeRecords.filter(record => {
      const matchEquipment = !filterEquipment || record.equipmentId === filterEquipment;
      const matchType = !filterType || record.faultType === filterType;
      let matchDate = true;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const recordDate = dayjs(record.startTime);
        matchDate = recordDate.isAfter(dateRange[0]) && recordDate.isBefore(dateRange[1]);
      }
      return matchEquipment && matchType && matchDate;
    });
  }, [downtimeRecords, filterEquipment, filterType, dateRange]);

  const stats = useMemo(() => {
    const totalHours = filteredRecords.reduce((sum, r) => sum + r.durationHours, 0);
    const avgHours = filteredRecords.length > 0 ? totalHours / filteredRecords.length : 0;
    const equipmentStats = equipments.map(eq => {
      const eqRecords = filteredRecords.filter(r => r.equipmentId === eq.id);
      return {
        id: eq.id,
        name: eq.name,
        count: eqRecords.length,
        hours: eqRecords.reduce((sum, r) => sum + r.durationHours, 0),
      };
    }).filter(s => s.count > 0).sort((a, b) => b.hours - a.hours);

    const typeStats = filteredRecords.reduce((acc, r) => {
      acc[r.faultType] = (acc[r.faultType] || 0) + r.durationHours;
      return acc;
    }, {} as Record<string, number>);

    const typeData = Object.entries(typeStats).map(([name, value]) => ({ name, value }));
    const maxHours = Math.max(...equipmentStats.map(s => s.hours), 1);

    return {
      totalRecords: filteredRecords.length,
      totalHours: totalHours.toFixed(1),
      avgHours: avgHours.toFixed(1),
      maxEquipment: equipmentStats[0]?.name || '-',
      equipmentStats,
      typeData,
      maxHours,
    };
  }, [filteredRecords, equipments]);

  const columns: ColumnsType<DowntimeRecord> = [
    {
      title: '设备',
      key: 'equipment',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.equipmentName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.equipmentCode}</div>
        </div>
      ),
    },
    {
      title: '故障类型',
      dataIndex: 'faultType',
      key: 'faultType',
      width: 120,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '故障原因',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (time: string) => time || '进行中',
    },
    {
      title: '停机时长(h)',
      dataIndex: 'durationHours',
      key: 'durationHours',
      width: 110,
      render: (hours: number) => (
        <span style={{ color: hours > 8 ? '#f5222d' : hours > 4 ? '#fa8c16' : undefined }}>
          {hours}h
        </span>
      ),
      sorter: (a, b) => a.durationHours - b.durationHours,
    },
    {
      title: '关联工单',
      dataIndex: 'workOrderId',
      key: 'workOrderId',
      width: 120,
      render: (id?: string) => id || '-',
    },
  ];

  const faultTypes = [...new Set(downtimeRecords.map(r => r.faultType))];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="停机次数" value={stats.totalRecords} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="总停机时长(h)" value={stats.totalHours} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="平均停机时长(h)" value={stats.avgHours} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="最高停机设备" value={stats.maxEquipment} />
          </Card>
        </Col>
      </Row>

      <Card
        style={{ marginBottom: 16 }}
        extra={
          <Space wrap>
            <Select
              placeholder="选择设备"
              style={{ width: 200 }}
              value={filterEquipment || undefined}
              onChange={setFilterEquipment}
              allowClear
            >
              {equipments.map(eq => (
                <Option key={eq.id} value={eq.id}>{eq.name} ({eq.code})</Option>
              ))}
            </Select>
            <Select
              placeholder="故障类型"
              style={{ width: 200 }}
              value={filterType || undefined}
              onChange={setFilterType}
              allowClear
            >
              {faultTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
            <RangePicker onChange={(dates) => setDateRange(dates as any)} />
          </Space>
        }
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 400 }}>
            <h4 style={{ marginBottom: 16 }}>设备停机时长排行</h4>
            <List
              dataSource={stats.equipmentStats.slice(0, 6)}
              renderItem={(item, index) => (
                <List.Item>
                  <Row style={{ width: '100%' }} align="middle">
                    <Col span={2}>
                      <Tag color={COLORS[index % COLORS.length]}>{index + 1}</Tag>
                    </Col>
                    <Col span={6}>
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                    </Col>
                    <Col span={12}>
                      <Progress
                        percent={Math.round((item.hours / stats.maxHours) * 100)}
                        strokeColor={COLORS[index % COLORS.length]}
                        showInfo={false}
                      />
                    </Col>
                    <Col span={4} style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600 }}>{item.hours.toFixed(1)}h</span>
                      <span style={{ marginLeft: 8, color: '#999' }}>({item.count}次)</span>
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </div>
          <div style={{ width: 300 }}>
            <h4 style={{ marginBottom: 16 }}>故障类型分布</h4>
            <List
              dataSource={stats.typeData}
              renderItem={(item, index) => (
                <List.Item>
                  <Row style={{ width: '100%' }} align="middle">
                    <Col span={2}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </Col>
                    <Col span={14}>
                      <span>{item.name}</span>
                    </Col>
                    <Col span={8} style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600 }}>{item.value.toFixed(1)}h</span>
                    </Col>
                  </Row>
                </List.Item>
              )}
            />
          </div>
        </div>
      </Card>

      <Card title="停机记录详情">
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
