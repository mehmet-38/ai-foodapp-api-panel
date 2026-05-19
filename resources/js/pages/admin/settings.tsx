import React, { useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Space, Switch, Typography, message } from 'antd';
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

const { Text, Title } = Typography;

interface MobileSettings {
    adsEnabled: boolean;
    bannerAdsEnabled: boolean;
    rewardedAdsEnabled: boolean;
    admobBannerId: string;
    admobRewardedId: string;
    freeDailyLimit: number;
    searchRewardCredits: number;
    visionRewardCredits: number;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    minimumSupportedVersion: string;
}

interface SettingsPageProps {
    settings: MobileSettings;
    firebaseConfigured: boolean;
}

export default function SettingsPage({ settings, firebaseConfigured }: SettingsPageProps) {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm<MobileSettings>();

    const handleSubmit = async (values: MobileSettings) => {
        try {
            setLoading(true);
            const response = await axios.put('/admin/api/settings/mobile', values, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (response.data.success) {
                message.success('Mobil ayarlar güncellendi.');
                form.setFieldsValue(response.data.data);
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                const formErrors = Object.keys(error.response.data.errors).map((key) => ({
                    name: key as keyof MobileSettings,
                    errors: error.response.data.errors[key],
                }));
                form.setFields(formErrors);
            } else {
                message.error(error.response?.data?.message || 'Ayarlar güncellenemedi.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout title="Mobil Ayarlar">
            <Head title="Admin - Mobil Ayarlar" />

            {!firebaseConfigured && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Firebase bağlantısı yapılandırılmamış"
                    description="FIREBASE_PROJECT_ID ve FIREBASE_CREDENTIALS env değerlerini tanımlayın."
                />
            )}

            <Card>
                <div className="mb-4">
                    <Title level={4} className="!mb-1">Uygulama Yönetimi</Title>
                    <Text type="secondary">Bu değerler Firestore appSettings/mobile dokümanından mobil uygulamaya okunur.</Text>
                </div>

                <Form form={form} layout="vertical" initialValues={settings} onFinish={handleSubmit}>
                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item name="adsEnabled" label="Reklamlar" valuePropName="checked">
                                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="bannerAdsEnabled" label="Banner Reklam" valuePropName="checked">
                                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="rewardedAdsEnabled" label="Ödüllü Reklam" valuePropName="checked">
                                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item name="admobBannerId" label="AdMob Banner ID">
                                <Input placeholder="Boşsa app.json veya test ID kullanılır" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="admobRewardedId" label="AdMob Rewarded ID">
                                <Input placeholder="Boşsa app.json veya test ID kullanılır" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item name="freeDailyLimit" label="Ücretsiz Günlük Limit" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="searchRewardCredits" label="Arama Reklam Ödülü" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="visionRewardCredits" label="AI Tarama Reklam Ödülü" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item name="maintenanceMode" label="Bakım Modu" valuePropName="checked">
                                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="minimumSupportedVersion" label="Minimum Sürüm">
                                <Input placeholder="Örn: 1.0.0" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={24}>
                            <Form.Item name="maintenanceMessage" label="Bakım Mesajı">
                                <Input.TextArea rows={3} placeholder="Mobil uygulamada gösterilecek mesaj" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item className="mb-0">
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Kaydet
                            </Button>
                            <Button onClick={() => form.resetFields()} disabled={loading}>
                                Sıfırla
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </AdminLayout>
    );
}
