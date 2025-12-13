import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Tag, Avatar, Space, Card, Typography, Modal, Form, InputNumber, Select, message, Popconfirm, Switch, DatePicker, Row, Col } from 'antd';
import {
    UserOutlined,
    SearchOutlined,
    EyeOutlined,
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    PlusOutlined,
    CrownOutlined
} from '@ant-design/icons';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';

const { Search } = Input;
const { Title, Text } = Typography;

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    height?: number;
    weight?: number;
    age?: number;
    role: string;
    created_at: string;
    email_verified_at?: string;
    is_premium: boolean;
    premium_until?: string;
    premium_package_id?: number;
    premium_package?: {
        id: number;
        name: string;
    };
}

interface UsersPageProps {
    users: {
        data: User[];
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

export default function UsersPage({ users, filters }: UsersPageProps) {
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [packages, setPackages] = useState<{ id: number, name: string }[]>([]);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const response = await axios.get('/admin/api/packages/list');
            if (response.data.success) {
                setPackages(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch packages:', error);
        }
    };

    const handleSearch = (value: string) => {
        setLoading(true);
        router.get('/admin/users',
            { search: value, per_page: filters.per_page },
            {
                preserveState: true,
                onFinish: () => setLoading(false)
            }
        );
    };

    const handleTableChange = (pagination: any) => {
        setLoading(true);
        router.get('/admin/users',
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

    const showUserDetails = (user: User) => {
        setSelectedUser(user);
        setModalVisible(true);
    };

    const handleCreateUser = () => {
        form.resetFields();
        setCreateModalVisible(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        form.setFieldsValue({
            name: user.name,
            username: user.username,
            email: user.email,
            age: user.age,
            height: user.height,
            weight: user.weight,
            role: user.role,
            is_premium: Boolean(user.is_premium),
            premium_package_id: user.premium_package_id,
            premium_until: user.premium_until ? dayjs(user.premium_until) : null,
        });
        setEditModalVisible(true);
    };

    const handleCreateSubmit = async (values: any) => {
        try {
            setActionLoading(true);
            const formattedValues = {
                ...values,
                premium_until: values.premium_until ? values.premium_until.format('YYYY-MM-DD HH:mm:ss') : null
            };

            const response = await axios.post('/admin/api/users', formattedValues, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.success) {
                message.success('Kullanıcı başarıyla oluşturuldu!');
                setCreateModalVisible(false);
                form.resetFields();
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Create user error:', error);
            if (error.response?.data?.errors) {
                Object.values(error.response.data.errors).forEach((err: any) => {
                    message.error(err[0]);
                });
            } else {
                message.error('Kullanıcı oluşturulurken bir hata oluştu!');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditSubmit = async (values: any) => {
        if (!selectedUser) return;

        try {
            setActionLoading(true);
            const formattedValues = {
                ...values,
                premium_until: values.premium_until ? values.premium_until.format('YYYY-MM-DD HH:mm:ss') : null
            };

            const response = await axios.put(`/admin/api/users/${selectedUser.id}`, formattedValues, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.success) {
                message.success('Kullanıcı başarıyla güncellendi!');
                setEditModalVisible(false);
                form.resetFields();
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Update user error:', error);
            if (error.response?.data?.errors) {
                Object.values(error.response.data.errors).forEach((err: any) => {
                    message.error(err[0]);
                });
            } else {
                message.error('Kullanıcı güncellenirken bir hata oluştu!');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        try {
            setActionLoading(true);
            const response = await axios.delete(`/admin/api/users/${user.id}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.data.success) {
                message.success('Kullanıcı başarıyla silindi!');
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Delete user error:', error);
            message.error('Kullanıcı silinirken bir hata oluştu!');
        } finally {
            setActionLoading(false);
        }
    };

    const columns: ColumnsType<User> = [
        {
            title: 'Avatar',
            dataIndex: 'username',
            key: 'avatar',
            width: 80,
            render: (username) => (
                <Avatar icon={<UserOutlined />} size="small">
                    {username?.charAt(0).toUpperCase()}
                </Avatar>
            ),
        },
        {
            title: 'Ad',
            dataIndex: 'name',
            key: 'name',
            sorter: true,
        },
        {
            title: 'Kullanıcı Adı',
            dataIndex: 'username',
            key: 'username',
            sorter: true,
        },
        {
            title: 'E-mail',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Rol',
            dataIndex: 'role',
            key: 'role',
            width: 100,
            render: (role) => (
                <Tag color={role === 'admin' ? 'red' : 'blue'}>
                    {role === 'admin' ? 'Admin' : 'Kullanıcı'}
                </Tag>
            ),
        },
        {
            title: 'Premium',
            key: 'premium',
            width: 150,
            render: (_, record) => (
                record.is_premium ? (
                    <Tag icon={<CrownOutlined />} color="gold">
                        {record.premium_package?.name || 'Premium'}
                    </Tag>
                ) : (
                    <Tag>Standart</Tag>
                )
            ),
        },
        {
            title: 'İşlemler',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="link"
                        icon={<EyeOutlined />}
                        size="small"
                        onClick={() => showUserDetails(record)}
                    />
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleEditUser(record)}
                    />
                    <Popconfirm
                        title="Kullanıcı Silme"
                        description="Bu kullanıcıyı silmek istediğinizden emin misiniz?"
                        onConfirm={() => handleDeleteUser(record)}
                        okText="Evet"
                        cancelText="Hayır"
                        okButtonProps={{ loading: actionLoading }}
                    >
                        <Button
                            type="link"
                            icon={<DeleteOutlined />}
                            size="small"
                            danger
                            loading={actionLoading}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const renderPremiumFormFields = () => (
        <>
            <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
                <Text strong className="block mb-3">Premium Ayarları</Text>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item
                            name="is_premium"
                            label="Premium Durumu"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Aktif" unCheckedChildren="Pasif" />
                        </Form.Item>
                    </Col>

                    <Col span={16}>
                        <Form.Item
                            name="premium_package_id"
                            label="Tanımlı Paket"
                        >
                            <Select placeholder="Paket seçiniz" allowClear>
                                {packages.map(pkg => (
                                    <Select.Option key={pkg.id} value={pkg.id}>
                                        {pkg.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="premium_until"
                    label="Bitiş Tarihi"
                >
                    <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
            </div>
        </>
    );

    return (
        <AdminLayout title="Kullanıcı Yönetimi">
            <Head title="Admin - Kullanıcılar" />

            <Card>
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <Title level={4} className="!mb-1">Kullanıcılar</Title>
                        <Text type="secondary">Toplam {users.total} kullanıcı</Text>
                    </div>

                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreateUser}
                        >
                            Kullanıcı Ekle
                        </Button>
                        <Search
                            placeholder="Kullanıcı ara..."
                            allowClear
                            style={{ width: 300 }}
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
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={users.data}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: users.current_page,
                        total: users.total,
                        pageSize: users.per_page,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} / ${total} kullanıcı`,
                        pageSizeOptions: ['10', '25', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Kullanıcı Detay Modal */}
            <Modal
                title="Kullanıcı Detayları"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={700}
            >
                {selectedUser && (
                    <div className="space-y-4">
                        <div className="text-center pb-4 border-b">
                            <Avatar size={80} icon={<UserOutlined />}>
                                {selectedUser.name?.charAt(0).toUpperCase() || selectedUser.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Title level={4} className="!mt-2 !mb-1">{selectedUser.name || selectedUser.username}</Title>
                            <Text type="secondary">{selectedUser.email}</Text>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Text strong>Rol:</Text>
                                <br />
                                <Tag color={selectedUser.role === 'admin' ? 'red' : 'blue'}>
                                    {selectedUser.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                                </Tag>
                            </div>
                            <div>
                                <Text strong>Premium Durumu:</Text>
                                <br />
                                {selectedUser.is_premium ? (
                                    <Tag icon={<CrownOutlined />} color="gold">
                                        {selectedUser.premium_package?.name || 'Premium'}
                                    </Tag>
                                ) : (
                                    <Tag>Standart</Tag>
                                )}
                            </div>
                            <div>
                                <Text strong>Premium Bitiş:</Text>
                                <br />
                                <Text>{selectedUser.premium_until ? dayjs(selectedUser.premium_until).format('DD.MM.YYYY HH:mm') : '-'}</Text>
                            </div>
                            <div>
                                <Text strong>Kayıt Tarihi:</Text>
                                <br />
                                <Text>{dayjs(selectedUser.created_at).format('DD.MM.YYYY HH:mm')}</Text>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                            <div>
                                <Text strong>Yaş:</Text><br />
                                <Text>{selectedUser.age || '-'}</Text>
                            </div>
                            <div>
                                <Text strong>Boy:</Text><br />
                                <Text>{selectedUser.height ? `${selectedUser.height} cm` : '-'}</Text>
                            </div>
                            <div>
                                <Text strong>Kilo:</Text><br />
                                <Text>{selectedUser.weight ? `${selectedUser.weight} kg` : '-'}</Text>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Kullanıcı Oluşturma Modalı */}
            <Modal
                title="Yeni Kullanıcı Ekle"
                open={createModalVisible}
                onCancel={() => {
                    setCreateModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateSubmit}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="name"
                            label="Ad Soyad"
                            rules={[{ required: true, message: 'Ad soyad gereklidir!' }]}
                        >
                            <Input placeholder="Ad soyad" />
                        </Form.Item>

                        <Form.Item
                            name="username"
                            label="Kullanıcı Adı"
                            rules={[
                                { required: true, message: 'Kullanıcı adı gereklidir!' },
                                { max: 50, message: 'Kullanıcı adı en fazla 50 karakter olabilir!' }
                            ]}
                        >
                            <Input placeholder="Kullanıcı adı" />
                        </Form.Item>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="email"
                            label="E-mail"
                            rules={[
                                { required: true, message: 'E-mail gereklidir!' },
                                { type: 'email', message: 'Geçerli bir e-mail adresi giriniz!' },
                                { max: 100, message: 'E-mail en fazla 100 karakter olabilir!' }
                            ]}
                        >
                            <Input placeholder="E-mail" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Şifre"
                            rules={[
                                { required: true, message: 'Şifre gereklidir!' },
                                { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }
                            ]}
                        >
                            <Input.Password placeholder="Şifre" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="role"
                        label="Rol"
                        rules={[{ required: true, message: 'Rol seçimi gereklidir!' }]}
                        initialValue="user"
                    >
                        <Select placeholder="Rol seçiniz">
                            <Select.Option value="user">Kullanıcı</Select.Option>
                            <Select.Option value="admin">Admin</Select.Option>
                        </Select>
                    </Form.Item>

                    {renderPremiumFormFields()}

                    <div className="grid grid-cols-3 gap-4">
                        <Form.Item
                            name="age"
                            label="Yaş"
                            rules={[{ type: 'number', min: 0, max: 150, message: 'Yaş 0-150 arasında olmalıdır!' }]}
                        >
                            <InputNumber placeholder="Yaş" style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="height"
                            label="Boy (cm)"
                            rules={[{ type: 'number', min: 0, message: 'Boy pozitif bir sayı olmalıdır!' }]}
                        >
                            <InputNumber placeholder="Boy" style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="weight"
                            label="Kilo (kg)"
                            rules={[{ type: 'number', min: 0, message: 'Kilo pozitif bir sayı olmalıdır!' }]}
                        >
                            <InputNumber placeholder="Kilo" style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button onClick={() => {
                            setCreateModalVisible(false);
                            form.resetFields();
                        }}>
                            İptal
                        </Button>
                        <Button type="primary" htmlType="submit" loading={actionLoading}>
                            Oluştur
                        </Button>
                    </div>
                </Form>
            </Modal>

            {/* Kullanıcı Düzenleme Modalı */}
            <Modal
                title="Kullanıcı Düzenle"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    form.resetFields();
                }}
                footer={null}
                width={700}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleEditSubmit}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="name"
                            label="Ad Soyad"
                            rules={[{ required: true, message: 'Ad soyad gereklidir!' }]}
                        >
                            <Input placeholder="Ad soyad" />
                        </Form.Item>

                        <Form.Item
                            name="username"
                            label="Kullanıcı Adı"
                            rules={[
                                { required: true, message: 'Kullanıcı adı gereklidir!' },
                                { max: 50, message: 'Kullanıcı adı en fazla 50 karakter olabilir!' }
                            ]}
                        >
                            <Input placeholder="Kullanıcı adı" />
                        </Form.Item>
                    </div>

                    <Form.Item
                        name="email"
                        label="E-mail"
                        rules={[
                            { required: true, message: 'E-mail gereklidir!' },
                            { type: 'email', message: 'Geçerli bir e-mail adresi giriniz!' },
                            { max: 100, message: 'E-mail en fazla 100 karakter olabilir!' }
                        ]}
                    >
                        <Input placeholder="E-mail" />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="password"
                            label="Yeni Şifre (Boş bırakılabilir)"
                            rules={[
                                { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }
                            ]}
                        >
                            <Input.Password placeholder="Yeni şifre" />
                        </Form.Item>

                        <Form.Item
                            name="role"
                            label="Rol"
                            rules={[{ required: true, message: 'Rol seçimi gereklidir!' }]}
                        >
                            <Select placeholder="Rol seçiniz">
                                <Select.Option value="user">Kullanıcı</Select.Option>
                                <Select.Option value="admin">Admin</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>

                    {renderPremiumFormFields()}

                    <div className="grid grid-cols-3 gap-4">
                        <Form.Item
                            name="age"
                            label="Yaş"
                            rules={[{ type: 'number', min: 0, max: 150, message: 'Yaş 0-150 arasında olmalıdır!' }]}
                        >
                            <InputNumber placeholder="Yaş" style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="height"
                            label="Boy (cm)"
                            rules={[{ type: 'number', min: 0, message: 'Boy pozitif bir sayı olmalıdır!' }]}
                        >
                            <InputNumber placeholder="Boy" style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            name="weight"
                            label="Kilo (kg)"
                            rules={[{ type: 'number', min: 0, message: 'Kilo pozitif bir sayı olmalıdır!' }]}
                        >
                            <InputNumber placeholder="Kilo" style={{ width: '100%' }} />
                        </Form.Item>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button onClick={() => {
                            setEditModalVisible(false);
                            form.resetFields();
                        }}>
                            İptal
                        </Button>
                        <Button type="primary" htmlType="submit" loading={actionLoading}>
                            Güncelle
                        </Button>
                    </div>
                </Form>
            </Modal>
        </AdminLayout>
    );
}