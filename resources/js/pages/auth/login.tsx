import React from 'react';
import { Form, Input, Button, Checkbox, Card, Typography, Space, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const { Title, Text, Link } = Typography;

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            router.post('/login', {
                email: values.email,
                password: values.password,
                remember: values.remember || false,
            });
        } catch (error) {
            message.error('Giriş yapılırken bir hata oluştu!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Admin Panel Girişi" />
            
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                        <UserOutlined className="text-3xl text-orange-600" />
                    </div>
                    <Title level={2} className="text-gray-900">
                        Food App Admin Panel
                    </Title>
                    <Text type="secondary" className="text-base">
                        Yönetim paneline giriş yapın
                    </Text>
                </div>

                <Card className="shadow-lg border-0" style={{ borderRadius: 12 }}>
                    {status && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <Text className="text-green-800 text-sm">{status}</Text>
                        </div>
                    )}

                    <Form
                        form={form}
                        name="login"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                        autoComplete="off"
                    >
                        <Form.Item
                            name="email"
                            label="E-mail Adresi"
                            rules={[
                                { required: true, message: 'E-mail adresi gereklidir!' },
                                { type: 'email', message: 'Geçerli bir e-mail adresi giriniz!' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined className="text-gray-400" />}
                                placeholder="admin@foodapp.com"
                                autoComplete="email"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Şifre"
                            rules={[{ required: true, message: 'Şifre gereklidir!' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-400" />}
                                placeholder="Şifrenizi giriniz"
                                autoComplete="current-password"
                            />
                        </Form.Item>

                        <div className="flex items-center justify-between mb-6">
                            <Form.Item name="remember" valuePropName="checked" className="!mb-0">
                                <Checkbox>Beni hatırla</Checkbox>
                            </Form.Item>
                            
                            {canResetPassword && (
                                <Link href="/forgot-password" className="text-sm">
                                    Şifremi unuttum?
                                </Link>
                            )}
                        </div>

                        <Form.Item className="!mb-4">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="w-full h-12 text-base font-medium"
                                style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}
                            >
                                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                            </Button>
                        </Form.Item>
                        
                       

                    </Form>
                </Card>

                <div className="text-center">
                    <Text type="secondary" className="text-xs">
                        © 2024 Food App Admin Panel. Tüm hakları saklıdır.
                    </Text>
                </div>
            </div>
        </div>
    );
}
