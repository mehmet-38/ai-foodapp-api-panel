import React, { useEffect, useState } from 'react';
import { Alert, Card, Col, Descriptions, Empty, Input, Row, Space, Spin, Statistic, Table, Tag, Typography, message } from 'antd';
import {
    ApiOutlined,
    BarChartOutlined,
    CloudOutlined,
    DatabaseOutlined,
    DollarOutlined,
    HddOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

const { Text } = Typography;

type IntegrationStatus = 'ok' | 'error' | 'unconfigured' | 'not_found';

interface DailyPoint {
    date: string;
    value: number;
}

interface IntegrationBlock {
    configured: boolean;
    status: IntegrationStatus;
    message?: string;
    summary?: Record<string, number | string | null>;
    top_events?: Array<{ name: string; count: number }>;
    daily?: Record<string, DailyPoint[]>;
}

interface OverviewData {
    revenuecat: IntegrationBlock;
    analytics: IntegrationBlock;
    gemini: IntegrationBlock;
    firebase: IntegrationBlock;
}

interface RevenueCatCustomerData extends IntegrationBlock {
    customer?: Record<string, unknown> | null;
    active_entitlements?: Array<Record<string, unknown>>;
    subscriptions?: Array<Record<string, unknown>>;
    errors?: string[];
}

const emptyBlock: IntegrationBlock = { configured: false, status: 'unconfigured', summary: {}, daily: {} };

const emptyOverview: OverviewData = {
    revenuecat: emptyBlock,
    analytics: { ...emptyBlock, top_events: [] },
    gemini: emptyBlock,
    firebase: emptyBlock,
};

export default function IntegrationsPage() {
    const [overview, setOverview] = useState<OverviewData>(emptyOverview);
    const [loading, setLoading] = useState(true);
    const [customerLoading, setCustomerLoading] = useState(false);
    const [customer, setCustomer] = useState<RevenueCatCustomerData | null>(null);

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchOverview = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/api/integrations/overview', {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            setOverview(response.data.data);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Servis verileri alinamadi.');
        } finally {
            setLoading(false);
        }
    };

    const searchCustomer = async (uid: string) => {
        if (!uid.trim()) {
            message.warning('Firebase UID girin.');
            return;
        }

        try {
            setCustomerLoading(true);
            const response = await axios.get('/admin/api/integrations/revenuecat/customer', {
                params: { uid },
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            setCustomer(response.data.data);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'RevenueCat musteri bilgisi alinamadi.');
        } finally {
            setCustomerLoading(false);
        }
    };

    const statusTag = (block: IntegrationBlock) => {
        if (block.status === 'ok') return <Tag color="green">Bagli</Tag>;
        if (block.status === 'not_found') return <Tag color="orange">Bulunamadi</Tag>;
        if (!block.configured || block.status === 'unconfigured') return <Tag color="gold">Eksik Ayar</Tag>;
        return <Tag color="red">Hata</Tag>;
    };

    const statusAlert = (name: string, block: IntegrationBlock) => {
        if (block.status === 'ok') return null;

        return (
            <Alert
                key={name}
                type={block.status === 'unconfigured' ? 'warning' : 'error'}
                showIcon
                message={`${name}: ${block.status === 'unconfigured' ? 'Konfigurasyon eksik' : 'Veri alinamadi'}`}
                description={block.message || 'Servis yaniti beklenen formatta degil veya erisim yetkisi yok.'}
            />
        );
    };

    const num = (value: unknown) => Number(value || 0);
    const money = (value: unknown) => (value === null || value === undefined ? '-' : `$${num(value).toFixed(4)}`);
    const bytes = (value: unknown) => {
        const size = num(value);
        if (size <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
        return `${(size / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
    };

    const eventColumns = [
        { title: 'Event', dataIndex: 'name', key: 'name' },
        { title: 'Adet', dataIndex: 'count', key: 'count', width: 120, render: (value: number) => value.toLocaleString() },
    ];

    const dailyColumns = [
        { title: 'Tarih', dataIndex: 'date', key: 'date', width: 140 },
        { title: 'Deger', dataIndex: 'value', key: 'value', render: (value: number) => Math.round(value).toLocaleString() },
    ];

    const subscriptionColumns = [
        { title: 'Urun', dataIndex: 'product_id', key: 'product_id' },
        { title: 'Durum', dataIndex: 'status', key: 'status', width: 140 },
        { title: 'Baslangic', dataIndex: 'starts_at_formatted', key: 'starts_at_formatted', width: 180 },
        { title: 'Bitis', dataIndex: 'ends_at_formatted', key: 'ends_at_formatted', width: 180 },
    ];

    const entitlementColumns = [
        { title: 'Entitlement', dataIndex: 'entitlement_id', key: 'entitlement_id' },
        { title: 'Bitis', dataIndex: 'expires_at', key: 'expires_at', width: 180 },
    ];

    if (loading) {
        return (
            <AdminLayout title="Servis Kullanimi">
                <Head title="Admin - Servis Kullanimi" />
                <div className="flex h-64 items-center justify-center">
                    <Spin size="large" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Servis Kullanimi">
            <Head title="Admin - Servis Kullanimi" />

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12} xl={6}>
                        <Card extra={statusTag(overview.gemini)}>
                            <Statistic title="Gemini Token" value={num(overview.gemini.summary?.total_tokens)} prefix={<CloudOutlined />} />
                            <Text type="secondary">Son 30 gun input + output</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={12} xl={6}>
                        <Card extra={statusTag(overview.gemini)}>
                            <Statistic title="Gemini Tahmini Maliyet" value={money(overview.gemini.summary?.estimated_cost)} prefix={<DollarOutlined />} />
                            <Text type="secondary">Env fiyatlarina gore hesaplanir</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={12} xl={6}>
                        <Card extra={statusTag(overview.firebase)}>
                            <Statistic title="Firestore Okuma" value={num(overview.firebase.summary?.firestore_reads)} prefix={<DatabaseOutlined />} />
                            <Text type="secondary">Son 30 gun document reads</Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={12} xl={6}>
                        <Card extra={statusTag(overview.firebase)}>
                            <Statistic title="Storage Kullanimi" value={bytes(overview.firebase.summary?.storage_total_bytes)} prefix={<HddOutlined />} />
                            <Text type="secondary">Cloud Storage bucket toplam boyut</Text>
                        </Card>
                    </Col>
                </Row>

                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    {statusAlert('Gemini / GCP Monitoring', overview.gemini)}
                    {statusAlert('Firebase Kullanim', overview.firebase)}
                    {statusAlert('Firebase Analytics / GA4', overview.analytics)}
                    {statusAlert('RevenueCat', overview.revenuecat)}
                </Space>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={8}>
                        <Card title="Gemini Token ve Maliyet" extra={<CloudOutlined />}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Proje">{overview.gemini.summary?.project_id ?? '-'}</Descriptions.Item>
                                <Descriptions.Item label="Input Token">{num(overview.gemini.summary?.input_tokens).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="Output Token">{num(overview.gemini.summary?.output_tokens).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="Istek Sayisi">{num(overview.gemini.summary?.request_count).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="Input $ / 1M">{overview.gemini.summary?.input_price_per_1m ?? '-'}</Descriptions.Item>
                                <Descriptions.Item label="Output $ / 1M">{overview.gemini.summary?.output_price_per_1m ?? '-'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Firestore Kullanimi" extra={<DatabaseOutlined />}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Read">{num(overview.firebase.summary?.firestore_reads).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="Write">{num(overview.firebase.summary?.firestore_writes).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="Delete">{num(overview.firebase.summary?.firestore_deletes).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="Data + Index">{bytes(overview.firebase.summary?.firestore_storage_bytes)}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Storage ve GA4" extra={<BarChartOutlined />}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Storage Boyut">{bytes(overview.firebase.summary?.storage_total_bytes)}</Descriptions.Item>
                                <Descriptions.Item label="Storage Trafik">{bytes(overview.firebase.summary?.storage_sent_bytes)}</Descriptions.Item>
                                <Descriptions.Item label="Storage Request">{num(overview.firebase.summary?.storage_request_count).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="GA4 Aktif Kullanici">{num(overview.analytics.summary?.active_users).toLocaleString()}</Descriptions.Item>
                                <Descriptions.Item label="GA4 Event">{num(overview.analytics.summary?.event_count).toLocaleString()}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={8}>
                        <Card title="Gemini Gunluk Input Token">
                            <Table columns={dailyColumns} dataSource={overview.gemini.daily?.input_tokens || []} rowKey="date" pagination={{ pageSize: 7 }} size="small" />
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Gemini Gunluk Output Token">
                            <Table columns={dailyColumns} dataSource={overview.gemini.daily?.output_tokens || []} rowKey="date" pagination={{ pageSize: 7 }} size="small" />
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Firestore Gunluk Okuma">
                            <Table columns={dailyColumns} dataSource={overview.firebase.daily?.firestore_reads || []} rowKey="date" pagination={{ pageSize: 7 }} size="small" />
                        </Card>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card title="Top GA4 Eventleri">
                            <Table columns={eventColumns} dataSource={overview.analytics.top_events || []} rowKey="name" pagination={false} size="small" locale={{ emptyText: <Empty description="Event verisi yok" /> }} />
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card title="RevenueCat" extra={<ApiOutlined />}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="Gelir">{overview.revenuecat.summary?.revenue ?? '-'}</Descriptions.Item>
                                <Descriptions.Item label="Aktif Abone">{overview.revenuecat.summary?.active_subscribers ?? '-'}</Descriptions.Item>
                                <Descriptions.Item label="MRR">{overview.revenuecat.summary?.mrr ?? '-'}</Descriptions.Item>
                                <Descriptions.Item label="Trial">{overview.revenuecat.summary?.trial_count ?? '-'}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                    </Col>
                </Row>

                <Card title="RevenueCat Musteri Arama">
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Input.Search allowClear enterButton={<SearchOutlined />} loading={customerLoading} placeholder="Firebase UID / RevenueCat App User ID" onSearch={searchCustomer} />

                        {customer && (
                            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                                {customer.status !== 'ok' && (
                                    <Alert type={customer.status === 'not_found' ? 'warning' : 'error'} showIcon message={customer.message || 'Musteri bilgisi alinamadi.'} />
                                )}

                                <Card size="small" title="Customer">
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(customer.customer ?? {}, null, 2)}</pre>
                                </Card>

                                <Table title={() => 'Active Entitlements'} columns={entitlementColumns} dataSource={customer.active_entitlements || []} rowKey={(record) => String(record.entitlement_id ?? record.id ?? Math.random())} pagination={false} size="small" />
                                <Table title={() => 'Subscriptions'} columns={subscriptionColumns} dataSource={customer.subscriptions || []} rowKey={(record) => String(record.id ?? record.product_id ?? Math.random())} pagination={false} size="small" scroll={{ x: 800 }} />
                            </Space>
                        )}
                    </Space>
                </Card>
            </Space>
        </AdminLayout>
    );
}
