import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, Popconfirm, Radio, Select, Space, Typography, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import AdminLayout from '@/layouts/admin-layout';
import { Head } from '@inertiajs/react';
import axios from 'axios';

const { Text, Title } = Typography;
const { TextArea } = Input;

type TargetType = 'all' | 'premium' | 'free' | 'users';

interface UserOption {
    uid: string;
    username: string;
    email: string;
}

interface PushNotificationsPageProps {
    users: UserOption[];
    firebaseConfigured: boolean;
    pushConfigured: boolean;
}

interface FormValues {
    title: string;
    body: string;
    targetType: TargetType;
    uids: string[];
}

// Maps the panel's 4 human-facing choices onto the Cloud Function's target contract:
// { type: 'all' } | { type: 'topic', topic: 'premium_users' | 'free_users' } | { type: 'users', uids: [...] }
const buildTarget = (values: FormValues) => {
    switch (values.targetType) {
        case 'premium':
            return { type: 'topic' as const, topic: 'premium_users' };
        case 'free':
            return { type: 'topic' as const, topic: 'free_users' };
        case 'users':
            return { type: 'users' as const, uids: values.uids };
        default:
            return { type: 'all' as const };
    }
};

export default function PushNotificationsPage({ users, firebaseConfigured, pushConfigured }: PushNotificationsPageProps) {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm<FormValues>();
    const targetType = Form.useWatch('targetType', form);

    const userOptions = useMemo(
        () => users.map((user) => ({
            value: user.uid,
            label: user.email ? `${user.username} (${user.email})` : user.username,
        })),
        [users]
    );

    const handleSend = async () => {
        let values: FormValues;
        try {
            values = await form.validateFields();
        } catch {
            return; // antd already highlights the invalid fields
        }

        try {
            setLoading(true);
            const response = await axios.post('/admin/api/push-notifications/send', {
                title: values.title,
                body: values.body,
                target: buildTarget(values),
            }, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });

            if (response.data.success) {
                message.success(response.data.message || 'Bildirim gönderildi.');
                form.resetFields();
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                Object.values(error.response.data.errors).forEach((err: any) => {
                    message.error(Array.isArray(err) ? err[0] : String(err));
                });
            } else {
                message.error(error.response?.data?.message || 'Bildirim gönderilemedi.');
            }
        } finally {
            setLoading(false);
        }
    };

    const targetSummary = {
        all: 'Herkese gönderilecek.',
        premium: '"premium_users" konusuna abone kullanıcılara gönderilecek.',
        free: '"free_users" konusuna abone kullanıcılara gönderilecek.',
        users: `Seçilen ${form.getFieldValue('uids')?.length || 0} kullanıcıya gönderilecek.`,
    }[targetType as TargetType] || '';

    return (
        <AdminLayout title="Push Bildirim Gönder">
            <Head title="Admin - Push Bildirim" />

            {!firebaseConfigured && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Firebase bağlantısı yapılandırılmamış"
                    description="FIREBASE_PROJECT_ID ve FIREBASE_CREDENTIALS env değerlerini tanımlayın."
                />
            )}

            {firebaseConfigured && !pushConfigured && (
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Bildirim gönderme yapılandırılmamış"
                    description="FIREBASE_WEB_API_KEY ve FIREBASE_FUNCTIONS_ADMIN_UID env değerlerini tanımlayın. FIREBASE_FUNCTIONS_ADMIN_UID, admins koleksiyonunda kayıtlı olan admin kullanıcının Firebase Auth UID'i olmalı."
                />
            )}

            <Card>
                <div className="mb-4">
                    <Title level={4} className="!mb-1">Push Bildirim Gönder</Title>
                    <Text type="secondary">
                        sendPushNotification Cloud Function'ını çağırarak mobil uygulama kullanıcılarına anlık bildirim gönderir.
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ targetType: 'all', uids: [] }}
                >
                    <Form.Item
                        name="title"
                        label="Başlık"
                        rules={[{ required: true, message: 'Başlık gereklidir' }]}
                    >
                        <Input placeholder="Örn: Bugün ne pişirsen?" maxLength={100} showCount />
                    </Form.Item>

                    <Form.Item
                        name="body"
                        label="Mesaj"
                        rules={[{ required: true, message: 'Mesaj gereklidir' }]}
                    >
                        <TextArea rows={3} placeholder="Bildirim metni" maxLength={500} showCount />
                    </Form.Item>

                    <Form.Item name="targetType" label="Hedef Kitle" rules={[{ required: true }]}>
                        <Radio.Group>
                            <Space direction="vertical">
                                <Radio value="all">Herkes</Radio>
                                <Radio value="premium">Sadece Premium</Radio>
                                <Radio value="free">Sadece Ücretsiz</Radio>
                                <Radio value="users">Belirli Kullanıcı(lar)</Radio>
                            </Space>
                        </Radio.Group>
                    </Form.Item>

                    {targetType === 'users' && (
                        <Form.Item
                            name="uids"
                            label="Kullanıcılar"
                            rules={[{ required: true, type: 'array', min: 1, message: 'En az bir kullanıcı seçin' }]}
                        >
                            <Select
                                mode="multiple"
                                showSearch
                                placeholder="Kullanıcı adı veya e-mail ile arayın"
                                optionFilterProp="label"
                                options={userOptions}
                                style={{ width: '100%' }}
                                maxTagCount={8}
                            />
                        </Form.Item>
                    )}

                    <Text type="secondary" className="block mb-4">{targetSummary}</Text>

                    <Form.Item className="mb-0">
                        <Popconfirm
                            title="Bildirimi gönder"
                            description="Bu işlem geri alınamaz, bildirim gerçek kullanıcılara anında gider. Emin misiniz?"
                            onConfirm={handleSend}
                            okText="Gönder"
                            cancelText="Vazgeç"
                            okButtonProps={{ loading, danger: true }}
                        >
                            <Button type="primary" icon={<SendOutlined />} loading={loading} disabled={!pushConfigured}>
                                Bildirimi Gönder
                            </Button>
                        </Popconfirm>
                    </Form.Item>
                </Form>
            </Card>
        </AdminLayout>
    );
}
