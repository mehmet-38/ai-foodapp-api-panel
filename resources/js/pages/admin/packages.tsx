import React, { useState } from 'react';
import { Table, Input, Button, Tag, Space, Card, Typography, Modal, Form, InputNumber, Switch, message, Popconfirm } from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';

const { Search } = Input;
const { Title, Text } = Typography;

interface PremiumPackage {
    id: number;
    name: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    trial_days: number;
    is_active: boolean;
    created_at: string;
}

interface PackagesPageProps {
    packages: {
        data: PremiumPackage[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        per_page: number;
    };
}

export default function PackagesPage({ packages, filters }: PackagesPageProps) {
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingPackage, setEditingPackage] = useState<PremiumPackage | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSearch = (value: string) => {
        setLoading(true);
        router.get('/admin/packages',
            { search: value, per_page: filters.per_page },
            {
                preserveState: true,
                onFinish: () => setLoading(false)
            }
        );
    };

    const handleTableChange = (pagination: any) => {
        setLoading(true);
        router.get('/admin/packages',
            {
                search: filters.search,
                page: pagination.current,
                per_page: pagination.pageSize
            },
            {
                preserveState: true,
                onFinish: () => setLoading(false)
            }
        );
    };

    const handleAdd = () => {
        setEditingPackage(null);
        form.resetFields();
        // Set default values for new package
        form.setFieldsValue({
            is_active: true,
            trial_days: 0,
            price_monthly: 0,
            price_yearly: 0
        });
        setModalVisible(true);
    };

    const handleEdit = (pkg: PremiumPackage) => {
        setEditingPackage(pkg);
        form.setFieldsValue({
            ...pkg,
            // Ensure numeric fields are numbers
            price_monthly: Number(pkg.price_monthly),
            price_yearly: Number(pkg.price_yearly),
            trial_days: Number(pkg.trial_days),
        });
        setModalVisible(true);
    };

    const handleSubmit = async (values: any) => {
        try {
            setActionLoading(true);
            const url = editingPackage
                ? `/admin/api/packages/${editingPackage.id}`
                : '/admin/api/packages';

            const method = editingPackage ? 'put' : 'post';

            const response = await axios[method](url, values, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                }
            });

            if (response.data.success) {
                message.success(editingPackage ? 'Paket güncellendi!' : 'Paket oluşturuldu!');
                setModalVisible(false);
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Package save error:', error);
            if (error.response?.data?.errors) {
                const formErrors = Object.keys(error.response.data.errors).map(key => ({
                    name: key,
                    errors: error.response.data.errors[key]
                }));
                form.setFields(formErrors);
            } else {
                message.error(error.response?.data?.message || 'Bir hata oluştu!');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            setActionLoading(true);
            const response = await axios.delete(`/admin/api/packages/${id}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (response.data.success) {
                message.success('Paket silindi!');
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Delete package error:', error);
            message.error(error.response?.data?.message || 'Silme işlemi başarısız!');
        } finally {
            setActionLoading(false);
        }
    };

    const columns: ColumnsType<PremiumPackage> = [
        {
            title: 'Paket Adı',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: 'Aylık Ücret',
            dataIndex: 'price_monthly',
            key: 'price_monthly',
            width: 120,
            render: (price) => <Text>₺{Number(price).toFixed(2)}</Text>,
        },
        {
            title: 'Yıllık Ücret',
            dataIndex: 'price_yearly',
            key: 'price_yearly',
            width: 120,
            render: (price) => <Text>₺{Number(price).toFixed(2)}</Text>,
        },
        {
            title: 'Deneme Süresi',
            dataIndex: 'trial_days',
            key: 'trial_days',
            width: 120,
            render: (days) => <Text>{days} Gün</Text>,
        },
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Durum',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 100,
            render: (active) => (
                <Tag color={active ? 'green' : 'red'}>
                    {active ? 'Aktif' : 'Pasif'}
                </Tag>
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Paketi Sil"
                        description="Bu paketi silmek istediğinizden emin misiniz?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Evet"
                        cancelText="Hayır"
                        okButtonProps={{ loading: actionLoading }}
                    >
                        <Button
                            type="link"
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <AdminLayout title="Premium Paket Yönetimi">
            <Head title="Admin - Paketler" />

            <Card>
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <Title level={4} className="!mb-1">Premium Paketler</Title>
                        <Text type="secondary">Toplam {packages.total} paket</Text>
                    </div>

                    <Space>
                        <Search
                            placeholder="Paket ara..."
                            allowClear
                            style={{ width: 250 }}
                            onSearch={handleSearch}
                            defaultValue={filters.search}
                            loading={loading}
                        />
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => window.location.reload()}
                        >
                            Yenile
                        </Button>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                        >
                            Yeni Paket
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={packages.data}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: packages.current_page,
                        total: packages.total,
                        pageSize: packages.per_page,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '25', '50'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </Card>

            <Modal
                title={editingPackage ? "Paket Düzenle" : "Yeni Paket Oluştur"}
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item
                        name="name"
                        label="Paket Adı"
                        rules={[{ required: true, message: 'Paket adı gereklidir' }]}
                    >
                        <Input placeholder="Örn: Gold Üyelik" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="price_monthly"
                            label="Aylık Ücret (₺)"
                            rules={[{ required: true, message: 'Aylık ücret gereklidir' }]}
                        >
                            <InputNumber
                                min={0}
                                precision={2}
                                style={{ width: '100%' }}
                                placeholder="0.00"
                            />
                        </Form.Item>

                        <Form.Item
                            name="price_yearly"
                            label="Yıllık Ücret (₺)"
                            rules={[{ required: true, message: 'Yıllık ücret gereklidir' }]}
                        >
                            <InputNumber
                                min={0}
                                precision={2}
                                style={{ width: '100%' }}
                                placeholder="0.00"
                            />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="trial_days"
                            label="Deneme Süresi (Gün)"
                            rules={[{ required: true, message: 'Gün sayısı gereklidir' }]}
                        >
                            <InputNumber
                                min={0}
                                style={{ width: '100%' }}
                                placeholder="0"
                            />
                        </Form.Item>

                        <Form.Item
                            name="is_active"
                            label="Durum"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="description"
                        label="Açıklama"
                    >
                        <Input.TextArea rows={3} placeholder="Paket detayları..." />
                    </Form.Item>

                    <Form.Item className="flex justify-end mb-0">
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>
                                İptal
                            </Button>
                            <Button type="primary" htmlType="submit" loading={actionLoading}>
                                {editingPackage ? 'Güncelle' : 'Oluştur'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </AdminLayout>
    );
}
