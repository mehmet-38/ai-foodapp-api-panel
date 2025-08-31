import React, { useState } from 'react';
import { Table, Input, Button, Tag, Avatar, Space, Card, Typography, Modal, Form, InputNumber, message, Popconfirm } from 'antd';
import { 
    UserOutlined, 
    SearchOutlined, 
    EyeOutlined, 
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    PlusOutlined
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
    created_at: string;
    email_verified_at?: string;
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
    const [form] = Form.useForm();

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
        });
        setEditModalVisible(true);
    };

    const handleCreateSubmit = async (values: any) => {
        try {
            setActionLoading(true);
            const response = await axios.post('/admin/api/users', values, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.data.success) {
                message.success('Kullanıcı başarıyla oluşturuldu!');
                setCreateModalVisible(false);
                form.resetFields();
                window.location.reload(); // Refresh the page to show new user
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
            const response = await axios.put(`/admin/api/users/${selectedUser.id}`, values, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.data.success) {
                message.success('Kullanıcı başarıyla güncellendi!');
                setEditModalVisible(false);
                form.resetFields();
                window.location.reload(); // Refresh the page to show updated user
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
                window.location.reload(); // Refresh the page to remove deleted user
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
                    {username.charAt(0).toUpperCase()}
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
            title: 'Yaş',
            dataIndex: 'age',
            key: 'age',
            width: 80,
            render: (age) => age || '-',
        },
        {
            title: 'Boy/Kilo',
            key: 'physical',
            width: 120,
            render: (_, record) => (
                <div>
                    {record.height ? `${record.height}cm` : '-'} / {record.weight ? `${record.weight}kg` : '-'}
                </div>
            ),
        },
        {
            title: 'Durum',
            dataIndex: 'email_verified_at',
            key: 'status',
            width: 100,
            render: (verified) => (
                <Tag color={verified ? 'green' : 'orange'}>
                    {verified ? 'Doğrulanmış' : 'Beklemede'}
                </Tag>
            ),
        },
        {
            title: 'Kayıt Tarihi',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date) => dayjs(date).format('DD.MM.YYYY HH:mm'),
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
                width={600}
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
                                <Text strong>Kullanıcı ID:</Text>
                                <br />
                                <Text>{selectedUser.id}</Text>
                            </div>
                            <div>
                                <Text strong>Ad:</Text>
                                <br />
                                <Text>{selectedUser.name || 'Belirtilmemiş'}</Text>
                            </div>
                            <div>
                                <Text strong>Kullanıcı Adı:</Text>
                                <br />
                                <Text>{selectedUser.username}</Text>
                            </div>
                            <div>
                                <Text strong>E-mail Durumu:</Text>
                                <br />
                                <Tag color={selectedUser.email_verified_at ? 'green' : 'orange'}>
                                    {selectedUser.email_verified_at ? 'Doğrulanmış' : 'Beklemede'}
                                </Tag>
                            </div>
                            <div>
                                <Text strong>Yaş:</Text>
                                <br />
                                <Text>{selectedUser.age || 'Belirtilmemiş'}</Text>
                            </div>
                            <div>
                                <Text strong>Boy:</Text>
                                <br />
                                <Text>{selectedUser.height ? `${selectedUser.height} cm` : 'Belirtilmemiş'}</Text>
                            </div>
                            <div>
                                <Text strong>Kilo:</Text>
                                <br />
                                <Text>{selectedUser.weight ? `${selectedUser.weight} kg` : 'Belirtilmemiş'}</Text>
                            </div>
                            <div>
                                <Text strong>Kayıt Tarihi:</Text>
                                <br />
                                <Text>{dayjs(selectedUser.created_at).format('DD.MM.YYYY HH:mm')}</Text>
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
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleCreateSubmit}
                >
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
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleEditSubmit}
                >
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
                        label="Yeni Şifre (Boş bırakılabilir)"
                        rules={[
                            { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }
                        ]}
                    >
                        <Input.Password placeholder="Yeni şifre" />
                    </Form.Item>

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