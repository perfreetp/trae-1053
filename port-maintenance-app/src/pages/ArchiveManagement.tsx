import { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Input,
  Select,
  Rate,
  List,
  message,
} from 'antd';
import { SearchOutlined, ExportOutlined, FileTextOutlined, PrinterOutlined } from '@ant-design/icons';
import type { MaintenanceArchive } from '../types';
import { useAppStore } from '../context/StoreContext';
import dayjs from 'dayjs';

const { Option } = Select;

export const ArchiveManagement = () => {
  const { archives, equipments, workOrders, faultReports, downtimeRecords } = useAppStore();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState<MaintenanceArchive | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterEquipment, setFilterEquipment] = useState<string>('');

  const filteredArchives = useMemo(() => {
    return archives.filter(ar => {
      const matchSearch = !searchText ||
        ar.equipmentName.includes(searchText) ||
        ar.equipmentCode.includes(searchText) ||
        ar.content.includes(searchText) ||
        ar.workOrderId.includes(searchText);
      const matchType = !filterType || ar.type === filterType;
      const matchEquipment = !filterEquipment || ar.equipmentId === filterEquipment;
      return matchSearch && matchType && matchEquipment;
    });
  }, [archives, searchText, filterType, filterEquipment]);

  const handleViewDetail = (archive: MaintenanceArchive) => {
    setSelectedArchive(archive);
    setIsDetailModalOpen(true);
  };

  const handleExportReport = () => {
    message.info('正在生成设备健康报告...');

    const totalDowntime = downtimeRecords.reduce((sum, r) => sum + r.durationHours, 0);
    const avgScore = archives.length > 0
      ? (archives.reduce((sum, a) => sum + a.qualityScore, 0) / archives.length).toFixed(1)
      : '0';

    const equipmentHealth = equipments.map(eq => {
      const eqArchives = archives.filter(a => a.equipmentId === eq.id);
      const eqFaults = faultReports.filter(f => f.equipmentId === eq.id);
      const eqDowntime = downtimeRecords.filter(d => d.equipmentId === eq.id);
      const totalDowntime = eqDowntime.reduce((sum, d) => sum + d.durationHours, 0);
      const avgScore = eqArchives.length > 0
        ? eqArchives.reduce((sum, a) => sum + a.qualityScore, 0) / eqArchives.length
        : 100;
      return { ...eq, avgScore, faultCount: eqFaults.length, totalDowntime, archiveCount: eqArchives.length };
    });

    const generateReportHTML = () => {
      return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>港口装卸设备健康报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Microsoft YaHei', Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .report-container { max-width: 1000px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .report-header { text-align: center; border-bottom: 3px solid #1890ff; padding-bottom: 20px; margin-bottom: 30px; }
    .report-header h1 { color: #1890ff; font-size: 28px; margin-bottom: 10px; }
    .report-header .date { color: #666; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #333; font-size: 20px; border-left: 4px solid #1890ff; padding-left: 12px; margin-bottom: 15px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .stat-card { background: #f0f7ff; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-card .value { font-size: 28px; font-weight: bold; color: #1890ff; }
    .stat-card .label { color: #666; font-size: 14px; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e8e8e8; padding: 12px; text-align: left; }
    th { background: #fafafa; font-weight: 600; color: #333; }
    tr:nth-child(even) { background: #fafafa; }
    .score-high { color: #52c41a; font-weight: bold; }
    .score-medium { color: #faad14; font-weight: bold; }
    .score-low { color: #f5222d; font-weight: bold; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e8e8e8; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="report-header">
      <h1>港口装卸设备健康报告</h1>
      <div class="date">报告生成时间：${new Date().toLocaleString()}</div>
    </div>

    <div class="section">
      <h2>一、整体概览</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="value">${equipments.length}</div>
          <div class="label">设备总数</div>
        </div>
        <div class="stat-card">
          <div class="value">${archives.length}</div>
          <div class="label">维修记录</div>
        </div>
        <div class="stat-card">
          <div class="value">${totalDowntime.toFixed(1)}h</div>
          <div class="label">总停机时长</div>
        </div>
        <div class="stat-card">
          <div class="value">${avgScore}</div>
          <div class="label">平均质量分</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>二、设备台账</h2>
      <table>
        <thead>
          <tr>
            <th>设备名称</th>
            <th>设备编号</th>
            <th>设备类型</th>
            <th>所在位置</th>
            <th>运行状态</th>
            <th>保养等级</th>
          </tr>
        </thead>
        <tbody>
          ${equipments.map(eq => `
            <tr>
              <td>${eq.name}</td>
              <td>${eq.code}</td>
              <td>${eq.type}</td>
              <td>${eq.location}</td>
              <td>${eq.status}</td>
              <td>${eq.maintenanceLevel}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>三、设备健康评分</h2>
      <table>
        <thead>
          <tr>
            <th>设备名称</th>
            <th>故障次数</th>
            <th>停机时长(h)</th>
            <th>维修次数</th>
            <th>平均质量分</th>
            <th>健康状态</th>
          </tr>
        </thead>
        <tbody>
          ${equipmentHealth.map(eq => {
            const scoreClass = eq.avgScore >= 80 ? 'score-high' : eq.avgScore >= 60 ? 'score-medium' : 'score-low';
            const healthStatus = eq.avgScore >= 80 ? '良好' : eq.avgScore >= 60 ? '一般' : '较差';
            return `
              <tr>
                <td>${eq.name}</td>
                <td>${eq.faultCount}</td>
                <td>${eq.totalDowntime.toFixed(1)}</td>
                <td>${eq.archiveCount}</td>
                <td class="${scoreClass}">${eq.avgScore.toFixed(0)}</td>
                <td>${healthStatus}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>四、历史故障记录</h2>
      <table>
        <thead>
          <tr>
            <th>故障编号</th>
            <th>设备</th>
            <th>故障标题</th>
            <th>严重程度</th>
            <th>报修人</th>
            <th>报修时间</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          ${faultReports.map(f => `
            <tr>
              <td>${f.id}</td>
              <td>${f.equipmentName}</td>
              <td>${f.title}</td>
              <td>${f.severity}</td>
              <td>${f.reporter}</td>
              <td>${f.reportTime}</td>
              <td>${f.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>五、停机统计</h2>
      <table>
        <thead>
          <tr>
            <th>设备</th>
            <th>故障原因</th>
            <th>开始时间</th>
            <th>结束时间</th>
            <th>停机时长(h)</th>
            <th>关联工单</th>
          </tr>
        </thead>
        <tbody>
          ${downtimeRecords.map(d => `
            <tr>
              <td>${d.equipmentName}</td>
              <td>${d.reason}</td>
              <td>${d.startTime}</td>
              <td>${d.endTime || '进行中'}</td>
              <td>${d.durationHours}</td>
              <td>${d.workOrderId || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>本报告由港口装卸设备维保管理系统自动生成</p>
      <p>如有疑问，请联系设备管理部门</p>
    </div>
  </div>
</body>
</html>
      `;
    };

    const blob = new Blob([generateReportHTML()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `设备健康报告_${dayjs().format('YYYYMMDD_HHmmss')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success('健康报告已导出，请查看下载文件');
  };

  const stats = useMemo(() => {
    const total = archives.length;
    const repairCount = archives.filter(a => a.type === '维修').length;
    const maintainCount = archives.filter(a => a.type === '保养').length;
    const avgScore = total > 0
      ? (archives.reduce((sum, a) => sum + a.qualityScore, 0) / total).toFixed(1)
      : '0';

    const equipmentHealth = equipments.map(eq => {
      const eqArchives = archives.filter(a => a.equipmentId === eq.id);
      const avgEqScore = eqArchives.length > 0
        ? eqArchives.reduce((sum, a) => sum + a.qualityScore, 0) / eqArchives.length
        : 100;
      return {
        ...eq,
        avgScore: avgEqScore,
        archiveCount: eqArchives.length,
      };
    }).sort((a, b) => a.avgScore - b.avgScore);

    return {
      total,
      repairCount,
      maintainCount,
      avgScore,
      equipmentHealth,
    };
  }, [archives, equipments]);

  const columns = [
    {
      title: '归档编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
    },
    {
      title: '设备',
      key: 'equipment',
      width: 150,
      render: (_: unknown, record: MaintenanceArchive) => (
        <div>
          <div>{record.equipmentName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.equipmentCode}</div>
        </div>
      ),
    },
    {
      title: '关联工单',
      dataIndex: 'workOrderId',
      key: 'workOrderId',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === '维修' ? 'blue' : 'green'}>{type}</Tag>
      ),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '内容摘要',
      dataIndex: 'content',
      key: 'content',
      width: 200,
      ellipsis: true,
    },
    {
      title: '质量评分',
      key: 'quality',
      width: 150,
      render: (_: unknown, record: MaintenanceArchive) => (
        <Space>
          <Rate disabled value={record.qualityScore / 20} />
          <span>{record.qualityScore}分</span>
        </Space>
      ),
    },
    {
      title: '操作人员',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
    },
    {
      title: '归档时间',
      dataIndex: 'archiveTime',
      key: 'archiveTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, record: MaintenanceArchive) => (
        <Button type="link" size="small" onClick={() => handleViewDetail(record)}>查看详情</Button>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="归档总数" value={stats.total} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="维修记录" value={stats.repairCount} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="保养记录" value={stats.maintainCount} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="平均质量分" value={stats.avgScore} suffix="分" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Button type="primary" icon={<ExportOutlined />} onClick={handleExportReport} style={{ width: '100%' }}>
              导出健康报告
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={6}>
          <Card title="设备健康状态" size="small">
            <List
              dataSource={stats.equipmentHealth.slice(0, 8)}
              renderItem={eq => (
                <List.Item>
                  <List.Item.Meta
                    title={eq.name}
                    description={
                      <div>
                        <Rate disabled value={eq.avgScore / 20} style={{ fontSize: 12 }} />
                        <span style={{ marginLeft: 8 }}>{eq.avgScore.toFixed(0)}分</span>
                        <span style={{ marginLeft: 12, fontSize: 12, color: '#999' }}>{eq.archiveCount}条记录</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={18}>
          <Card
            title="历史归档记录"
            extra={
              <Space wrap>
                <Input
                  placeholder="搜索设备/工单/内容"
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  allowClear
                />
                <Select
                  placeholder="类型"
                  style={{ width: 120 }}
                  value={filterType || undefined}
                  onChange={setFilterType}
                  allowClear
                >
                  <Option value="维修">维修</Option>
                  <Option value="保养">保养</Option>
                </Select>
                <Select
                  placeholder="设备"
                  style={{ width: 200 }}
                  value={filterEquipment || undefined}
                  onChange={setFilterEquipment}
                  allowClear
                >
                  {equipments.map(eq => (
                    <Option key={eq.id} value={eq.id}>{eq.name}</Option>
                  ))}
                </Select>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={filteredArchives}
              rowKey="id"
              scroll={{ x: 1300 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="归档详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>关闭</Button>,
          <Button key="print" icon={<PrinterOutlined />}>打印</Button>,
        ]}
        width={700}
        destroyOnClose
      >
        {selectedArchive && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <p><strong>归档编号：</strong>{selectedArchive.id}</p>
                  <p><strong>设备：</strong>{selectedArchive.equipmentName} ({selectedArchive.equipmentCode})</p>
                  <p><strong>关联工单：</strong>{selectedArchive.workOrderId}</p>
                </Col>
                <Col span={8}>
                  <p><strong>类型：</strong>
                    <Tag color={selectedArchive.type === '维修' ? 'blue' : 'green'}>{selectedArchive.type}</Tag>
                  </p>
                  <p><strong>日期：</strong>{selectedArchive.date}</p>
                  <p><strong>操作人员：</strong>{selectedArchive.operator}</p>
                </Col>
                <Col span={8}>
                  <p><strong>质量评分：</strong></p>
                  <p>
                    <Rate disabled value={selectedArchive.qualityScore / 20} />
                    <span style={{ marginLeft: 8 }}>{selectedArchive.qualityScore}分</span>
                  </p>
                  <p><strong>归档时间：</strong>{selectedArchive.archiveTime}</p>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="维修/保养内容" style={{ marginBottom: 16 }}>
              <p style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {selectedArchive.content}
              </p>
            </Card>

            {selectedArchive.parts.length > 0 && (
              <Card size="small" title="更换备件" style={{ marginBottom: 16 }}>
                <List
                  dataSource={selectedArchive.parts}
                  renderItem={part => (
                    <List.Item>
                      <Row style={{ width: '100%' }}>
                        <Col span={8}>{part.partName}</Col>
                        <Col span={6}>{part.partCode}</Col>
                        <Col span={4}>{part.quantity}{part.unit}</Col>
                      </Row>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            <Card size="small" title="质量评价">
              <p><strong>评分：</strong>
                <Rate disabled value={selectedArchive.qualityScore / 20} />
                <span style={{ marginLeft: 8 }}>{selectedArchive.qualityScore}分</span>
              </p>
              <p><strong>评价：</strong>{selectedArchive.qualityComment}</p>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};
