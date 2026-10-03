import React, { useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Switch, Typography, message } from 'antd';
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
    admobBannerIdIOS: string;
    admobRewardedIdIOS: string;
    admobInterstitialIdIOS: string;
    recipeDetailBannerEnabled: boolean;
    savedListBannerEnabled: boolean;
    interstitialAdsEnabled: boolean;
    interstitialSearchFrequency: number;
    admobInterstitialId: string;
    freeDailyLimit: number;
    searchRewardCredits: number;
    visionRewardCredits: number;
    premiumFairUseDailyLimit: number;
    dailyPostLimit: number;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    minimumSupportedVersion: string;
    streakMilestones: number[];
    dailyReminderHour: number;
    dailyReminderMinute: number;
    streakRiskHour: number;
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
            const payload = {
                ...values,
                streakMilestones: (values.streakMilestones || [])
                    .map((value) => Number(value))
                    .filter((value) => !Number.isNaN(value))
                    .sort((a, b) => a - b),
            };
            const response = await axios.put('/admin/api/settings/mobile', payload, {
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
                            <Form.Item name="admobBannerId" label="AdMob Banner ID (Android)">
                                <Input placeholder="Boşsa app.json veya test ID kullanılır" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="admobRewardedId" label="AdMob Rewarded ID (Android)">
                                <Input placeholder="Boşsa app.json veya test ID kullanılır" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item name="admobBannerIdIOS" label="AdMob Banner ID (iOS)">
                                <Input placeholder="Boşsa app.json veya test ID kullanılır" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="admobRewardedIdIOS" label="AdMob Rewarded ID (iOS)">
                                <Input placeholder="Boşsa app.json veya test ID kullanılır" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="admobInterstitialIdIOS" label="AdMob Interstitial ID (iOS)">
                                <Input placeholder="Boşsa app.json veya test ID kullanılır" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={6}>
                            <Form.Item name="freeDailyLimit" label="Ücretsiz Günlük Limit" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item name="searchRewardCredits" label="Arama Reklam Ödülü" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item name="visionRewardCredits" label="AI Tarama Reklam Ödülü" rules={[{ required: true }]}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={6}>
                            <Form.Item
                                name="premiumFairUseDailyLimit"
                                label="Premium Gizli Günlük Tavan"
                                rules={[{ required: true }]}
                                tooltip="Premium kullanıcı için görünmez arama+tarama tavanı. Aşılırsa kullanıcıya sadece genel bir hata mesajı gösterilir, 'limit' denmez."
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="dailyPostLimit"
                                label="Günlük Paylaşım Limiti"
                                rules={[{ required: true }]}
                                tooltip="Bir kullanıcının günde topluluğa paylaşabileceği tarif sayısı. Kullanıcıya açıkça gösterilir."
                            >
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

                    <div className="mb-4 mt-2">
                        <Title level={5} className="!mb-1">Reklam Yerleşimleri</Title>
                        <Text type="secondary">Belirli ekranlardaki reklamları ayrı ayrı aç/kapat; hepsi yine de "Reklamlar" anahtarına bağlıdır.</Text>
                    </div>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item name="recipeDetailBannerEnabled" label="Tarif Detayı Banner" valuePropName="checked">
                                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="savedListBannerEnabled" label="Kayıtlı Liste Banner" valuePropName="checked">
                                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item name="interstitialAdsEnabled" label="Geçiş (Interstitial) Reklam" valuePropName="checked">
                                <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24} md={12}>
                            <Form.Item
                                name="interstitialSearchFrequency"
                                label="Geçiş Reklam Sıklığı (her N aramada bir)"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item name="admobInterstitialId" label="AdMob Interstitial ID">
                                <Input placeholder="Boşsa app.json veya test ID kullanılır" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="mb-4 mt-2">
                        <Title level={5} className="!mb-1">Bildirim ve Seri (Streak) Ayarları</Title>
                        <Text type="secondary">Günlük hatırlatma bildirimi ve seri kaybı uyarısının saatleri; kilometre taşları başarı bildirimini tetikleyen gün sayıları.</Text>
                    </div>

                    <Row gutter={16}>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="dailyReminderHour"
                                label="Günlük Hatırlatma Saati (0-23)"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={0} max={23} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="dailyReminderMinute"
                                label="Günlük Hatırlatma Dakikası (0-59)"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={0} max={59} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item
                                name="streakRiskHour"
                                label="Seri Risk Uyarı Saati (0-23)"
                                rules={[{ required: true }]}
                            >
                                <InputNumber min={0} max={23} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col xs={24}>
                            <Form.Item
                                name="streakMilestones"
                                label="Seri Kilometre Taşları (gün)"
                                rules={[{ required: true, message: 'En az bir değer girin' }]}
                                extra="Enter'a basarak veya virgülle ayırarak gün sayıları ekleyin, örn: 3, 7, 14, 30"
                            >
                                <Select mode="tags" tokenSeparators={[',', ' ']} placeholder="Örn: 3, 7, 14, 30, 60, 100" />
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
