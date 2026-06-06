import { useState } from 'react';
import {
  Layout,
  Menu,
  theme,
  Avatar,
  Space,
  Badge,
} from 'antd';
import {
  DatabaseOutlined,
  CalendarOutlined,
  WarningOutlined,
  ToolOutlined,
  InboxOutlined,
  BarChartOutlined,
  FileTextOutlined,
  BellOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { StoreProvider, useAppStore } from './context/StoreContext';
import { EquipmentLedger } from './pages/EquipmentLedger';
import { InspectionCalendar } from './pages/InspectionCalendar';
import { FaultReportPage } from './pages/FaultReport';
import { WorkOrderManagement } from './pages/WorkOrderManagement';
import { PartApplicationPage } from './pages/PartApplication';
import { DowntimeAnalysis } from './pages/DowntimeAnalysis';
import { ArchiveManagement } from './pages/ArchiveManagement';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';
import './App.css';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const AppContent = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [selectedKey, setSelectedKey] = useState('1');
  const { inspectionTasks, faultReports, workOrders, partApplications } = useAppStore();

  const overdueCount = inspectionTasks.filter(t => t.status === '逾期').length;
  const pendingFaults = faultReports.filter(f => f.status === '待处理').length;
  const pendingWorkOrders = workOrders.filter(w => w.status === '待指派').length;
  const pendingParts = partApplications.filter(p => p.status === '待审批').length;

  const items: MenuItem[] = [
    {
      key: '1',
      icon: <DatabaseOutlined />,
      label: '设备台账',
    },
    {
      key: '2',
      icon: <CalendarOutlined />,
      label: '点检日历',
      badge: overdueCount > 0 ? { count: overdueCount, color: 'red' } : undefined,
    },
    {
      key: '3',
      icon: <WarningOutlined />,
      label: '故障报修',
      badge: pendingFaults > 0 ? { count: pendingFaults, color: 'orange' } : undefined,
    },
    {
      key: '4',
      icon: <ToolOutlined />,
      label: '维修工单',
      badge: pendingWorkOrders > 0 ? { count: pendingWorkOrders, color: 'blue' } : undefined,
    },
    {
      key: '5',
      icon: <InboxOutlined />,
      label: '备件领用',
      badge: pendingParts > 0 ? { count: pendingParts, color: 'purple' } : undefined,
    },
    {
      key: '6',
      icon: <BarChartOutlined />,
      label: '停机分析',
    },
    {
      key: '7',
      icon: <FileTextOutlined />,
      label: '验收归档',
    },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case '1':
        return <EquipmentLedger />;
      case '2':
        return <InspectionCalendar />;
      case '3':
        return <FaultReportPage />;
      case '4':
        return <WorkOrderManagement />;
      case '5':
        return <PartApplicationPage />;
      case '6':
        return <DowntimeAnalysis />;
      case '7':
        return <ArchiveManagement />;
      default:
        return <EquipmentLedger />;
    }
  };

  const pageTitles: Record<string, string> = {
    '1': '设备台账',
    '2': '点检日历',
    '3': '故障报修',
    '4': '维修工单',
    '5': '备件领用',
    '6': '停机分析',
    '7': '验收归档',
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          港口设备维保系统
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => setSelectedKey(key)}
          items={items}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout style={{ marginLeft: 220 }}>
        <Header style={{
          padding: '0 24px',
          background: colorBgContainer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{pageTitles[selectedKey]}</h2>
          <Space size="large">
            <Space>
              <Badge count={overdueCount + pendingFaults + pendingWorkOrders + pendingParts}>
                <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </Badge>
              <Avatar icon={<UserOutlined />} />
              <span>管理员</span>
            </Space>
            <span style={{ color: '#999' }}>{dayjs().format('YYYY年MM月DD日')}</span>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}

export default App;
