import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, Divider, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import { Head, router } from '@inertiajs/react';

const { Title, Text, Link } = Typography;

export default function Register() {
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            router.post('/register', {
                name: values.name,
                username: values.username,
                email: values.email,
                password: values.password,
                password_confirmation: values.password_confirmation,
            });
        } catch (error) {
            message.error('Kayıt yapılırken bir hata oluştu!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Admin Panel Kayıt" />
            
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <UserAddOutlined className="text-3xl text-green-600" />
                    </div>
                    <Title level={2} className="text-gray-900">
                        Food App Admin Kayıt
                    </Title>
                    <Text type="secondary" className="text-base">
                        Yönetim paneli için hesap oluşturun
                    </Text>
                </div>

                <Card className="shadow-lg border-0" style={{ borderRadius: 12 }}>
                    <Form
                        form={form}
                        name="register"
                        onFinish={onFinish}
                        layout="vertical"
                        size="large"
                        autoComplete="off"
                    >
                        <Form.Item
                            name="name"
                            label="Ad Soyad"
                            rules={[
                                { required: true, message: 'Ad soyad gereklidir!' },
                                { min: 2, message: 'Ad soyad en az 2 karakter olmalıdır!' }
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined className="text-gray-400" />}
                                placeholder="Ad Soyadınızı giriniz"
                                autoComplete="name"
                            />
                        </Form.Item>

                        <Form.Item
                            name="username"
                            label="Kullanıcı Adı"
                            rules={[
                                { required: true, message: 'Kullanıcı adı gereklidir!' },
                                { min: 3, message: 'Kullanıcı adı en az 3 karakter olmalıdır!' },
                                { max: 50, message: 'Kullanıcı adı en fazla 50 karakter olabilir!' }
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined className="text-gray-400" />}
                                placeholder="Kullanıcı adınızı giriniz"
                                autoComplete="username"
                            />
                        </Form.Item>

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
                            rules={[
                                { required: true, message: 'Şifre gereklidir!' },
                                { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-400" />}
                                placeholder="Şifrenizi giriniz"
                                autoComplete="new-password"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password_confirmation"
                            label="Şifre Tekrar"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Şifre tekrarı gereklidir!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Şifreler eşleşmiyor!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                prefix={<LockOutlined className="text-gray-400" />}
                                placeholder="Şifrenizi tekrar giriniz"
                                autoComplete="new-password"
                            />
                        </Form.Item>

                        <Form.Item className="!mb-4">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="w-full h-12 text-base font-medium"
                                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                            >
                                {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
                            </Button>
                        </Form.Item>

                        <Divider>
                            <Text type="secondary" className="text-sm">veya</Text>
                        </Divider>

                        <div className="text-center">
                            <Text type="secondary" className="text-sm">
                                Zaten hesabınız var mı?{' '}
                            </Text>
                            <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
                                Giriş yapın
                            </Link>
                        </div>
                    </Form>
                </Card>

                <div className="text-center">
                    <Text type="secondary" className="text-xs">
                        Kayıt olarak{' '}
                        <Link href="#" className="text-gray-600 hover:text-gray-800">
                            Kullanım Koşulları
                        </Link>
                        {' '}ve{' '}
                        <Link href="#" className="text-gray-600 hover:text-gray-800">
                            Gizlilik Politikası
                        </Link>
                        nı kabul etmiş olursunuz.
                    </Text>
                </div>
            </div>
        </div>
    );
}
