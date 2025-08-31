import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, theme, Button } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    FileTextOutlined,
    HeartOutlined,
    LogoutOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    BookOutlined,
} from '@ant-design/icons';
import { Link, usePage } from '@inertiajs/react';
import type { MenuProps } from 'antd';
import { User } from '@/types';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

type MenuItem = Required<MenuProps>['items'][number];

export default function AdminLayout({ children, title = 'Admin Panel' }: AdminLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);
    const { props } = usePage();
    const user = props.auth?.user as User;
    
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    // Menu items for admin panel
    const menuItems: MenuItem[] = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: <Link href="/admin/dashboard">Dashboard</Link>,
        },
        {
            key: 'users',
            icon: <UserOutlined />,
            label: <Link href="/admin/users">Kullanıcılar</Link>,
        },
        {
            key: 'recipes',
            icon: <BookOutlined />,
            label: <Link href="/admin/recipes">Tarifler</Link>,
        },
        {
            key: 'posts',
            icon: <FileTextOutlined />,
            label: <Link href="/admin/posts">Paylaşımlar</Link>,
        },
    ];

    // User dropdown menu
    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link href="/settings/profile">Profil</Link>,
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: <Link href="/settings">Ayarlar</Link>,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: <Link href="/logout" method="post">Çıkış Yap</Link>,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
                <div className="demo-logo-vertical p-4">
                    <Title level={collapsed ? 5 : 4} className="!mb-0 text-center">
                        {collapsed ? 'AP' : 'Admin Panel'}
                    </Title>
                </div>
                <Menu
                    theme="light"
                    mode="inline"
                    defaultSelectedKeys={['dashboard']}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header
                    style={{
                        padding: 0,
                        background: colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingRight: 16,
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            fontSize: '16px',
                            width: 64,
                            height: 64,
                        }}
                    />
                    
                    <div className="flex items-center gap-4">
                        <Text>Hoş geldiniz, {user?.name}</Text>
                        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                            <Avatar 
                                icon={<UserOutlined />} 
                                style={{ cursor: 'pointer' }}
                            />
                        </Dropdown>
                    </div>
                </Header>
                <Content
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <div className="mb-4">
                        <Title level={2}>{title}</Title>
                    </div>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}