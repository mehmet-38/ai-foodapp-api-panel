import React from 'react';
import { Button, Card, Row, Col, Typography, Space } from 'antd';
import { 
    UserOutlined, 
    BookOutlined, 
    FileTextOutlined, 
    SettingOutlined,
    DashboardOutlined,
    RightOutlined
} from '@ant-design/icons';
import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

const { Title, Paragraph, Text } = Typography;

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    const features = [
        {
            icon: <DashboardOutlined className="text-2xl text-blue-600" />,
            title: "Dashboard Yönetimi",
            description: "Genel istatistikleri ve önemli metrikleri takip edin"
        },
        {
            icon: <UserOutlined className="text-2xl text-green-600" />,
            title: "Kullanıcı Yönetimi",
            description: "Kullanıcıları yönetin, profilleri düzenleyin ve takip edin"
        },
        {
            icon: <BookOutlined className="text-2xl text-orange-600" />,
            title: "Tarif Yönetimi",
            description: "Yemek tariflerini ekleyin, düzenleyin ve kategori'leyin"
        },
        {
            icon: <FileTextOutlined className="text-2xl text-purple-600" />,
            title: "Paylaşım Yönetimi",
            description: "Kullanıcı paylaşımlarını moderate edin ve yönetin"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
            <Head title="Food App Admin Panel">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">F</span>
                            </div>
                            <Title level={4} className="!mb-0 text-gray-800">
                                Food App
                            </Title>
                        </div>
                        
                        <Space>
                            {auth.user ? (
                                <Link href="/admin/dashboard">
                                    <Button type="primary" size="large" style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}>
                                        Admin Panel'e Git
                                    </Button>
                                </Link>
                            ) : (
                                <Space>
                                    <Link href="/login">
                                        <Button size="large">
                                            Giriş Yap
                                        </Button>
                                    </Link>
                                    {/* Kayıt ol butonu yoruma alındı - sadece admin girişi */}
                                    {/* <Link href="/register">
                                        <Button type="primary" size="large" style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}>
                                            Kayıt Ol
                                        </Button>
                                    </Link> */}
                                </Space>
                            )}
                        </Space>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6">
                            <SettingOutlined className="text-3xl text-white" />
                        </div>
                    </div>
                    
                    <Title className="text-5xl font-bold text-gray-900 mb-6">
                        Food App
                        <span className="block text-orange-600">Admin Panel</span>
                    </Title>
                    
                    <Paragraph className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                        Yemek uygulamamızın tüm içeriklerini yönetin. Kullanıcılar, tarifler ve paylaşımları 
                        kolaylıkla kontrol edin ve uygulamamızın performansını takip edin.
                    </Paragraph>

                    {!auth.user && (
                        <Space size="large">
                            <Link href="/login">
                                <Button type="primary" size="large" className="h-12 px-8 text-base" style={{ backgroundColor: '#f97316', borderColor: '#f97316' }}>
                                    Admin Girişi <RightOutlined />
                                </Button>
                            </Link>
                            {/* Kayıt ol butonu yoruma alındı - sadece admin girişi */}
                            {/* <Link href="/register">
                                <Button size="large" className="h-12 px-8 text-base">
                                    Kayıt Ol
                                </Button>
                            </Link> */}
                        </Space>
                    )}
                </div>

                {/* Features Grid */}
                <Row gutter={[24, 24]} className="mb-16">
                    {features.map((feature, index) => (
                        <Col xs={24} sm={12} lg={6} key={index}>
                            <Card 
                                className="h-full text-center hover:shadow-lg transition-all duration-300 border-0"
                                style={{ borderRadius: 16 }}
                            >
                                <div className="mb-4">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        {feature.icon}
                                    </div>
                                    <Title level={4} className="text-gray-800 mb-2">
                                        {feature.title}
                                    </Title>
                                    <Text type="secondary">
                                        {feature.description}
                                    </Text>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Stats Section */}
                <Card className="text-center mb-16 border-0" style={{ borderRadius: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <div className="py-8">
                        <Title level={2} className="text-white mb-8">
                            Neden Food App Admin Panel?
                        </Title>
                        <Row gutter={[48, 24]}>
                            <Col xs={24} sm={8}>
                                <div className="text-center">
                                    <Title level={1} className="text-white !mb-0">100%</Title>
                                    <Text className="text-white/80 text-base">Güvenli</Text>
                                </div>
                            </Col>
                            <Col xs={24} sm={8}>
                                <div className="text-center">
                                    <Title level={1} className="text-white !mb-0">24/7</Title>
                                    <Text className="text-white/80 text-base">Erişim</Text>
                                </div>
                            </Col>
                            <Col xs={24} sm={8}>
                                <div className="text-center">
                                    <Title level={1} className="text-white !mb-0">Real-time</Title>
                                    <Text className="text-white/80 text-base">Güncelleme</Text>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Card>

                {/* Footer */}
                <div className="text-center pt-16 border-t">
                    <Text type="secondary">
                        © 2024 Food App Admin Panel. Tüm hakları saklıdır.
                    </Text>
                </div>
            </div>
        </div>
    );
}