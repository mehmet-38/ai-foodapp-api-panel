import React, { useState } from 'react';
import { Table, Input, Button, Tag, Space, Card, Typography, Modal, Avatar, Image, message, Popconfirm } from 'antd';
import { 
    SearchOutlined, 
    EyeOutlined, 
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    UserOutlined,
    HeartOutlined,
    PlusOutlined
} from '@ant-design/icons';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';

const { Search } = Input;
const { Title, Text } = Typography;

interface Post {
    id: number;
    title: string;
    description: string;
    image_url?: string;
    likes_count: number;
    status: number;
    created_at: string;
    user: {
        id: number;
        name: string;
        username: string;
        email: string;
    };
}

interface PostsPageProps {
    posts: {
        data: Post[];
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

// Helper function to construct full image URL
const getImageUrl = (imagePath: string | null): string | null => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // If it starts with /api/images/, construct full URL with base URL
    if (imagePath.startsWith('/api/images/')) {
        return `https://foodapp.forthback.com${imagePath}`;
    }
    
    // If it's just a filename, construct full URL
    return `https://foodapp.forthback.com/api/images/${imagePath}`;
};

export default function PostsPage({ posts, filters }: PostsPageProps) {
    const [loading, setLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const handleSearch = (value: string) => {
        setLoading(true);
        router.get('/admin/posts', 
            { search: value, per_page: filters.per_page },
            { 
                preserveState: true,
                onFinish: () => setLoading(false)
            }
        );
    };

    const handleTableChange = (pagination: any) => {
        setLoading(true);
        router.get('/admin/posts',
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

    const showPostDetails = (post: Post) => {
        setSelectedPost(post);
        setModalVisible(true);
    };

    const showEditModal = (post: Post) => {
        setSelectedPost(post);
        setEditModalVisible(true);
    };

    const handleDeletePost = async (post: Post) => {
        try {
            setActionLoading(true);
            const response = await axios.delete(`/admin/api/posts/${post.id}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            if (response.data.success) {
                message.success('Paylaşım başarıyla silindi!');
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Delete post error:', error);
            message.error('Paylaşım silinirken bir hata oluştu!');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (status: number) => {
        if (!selectedPost) return;
        
        try {
            setActionLoading(true);
            const response = await axios.put(`/admin/api/posts/${selectedPost.id}`, {
                status: status
            }, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.data.success) {
                message.success('Paylaşım durumu başarıyla güncellendi!');
                setEditModalVisible(false);
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Update post status error:', error);
            message.error('Paylaşım durumu güncellenirken bir hata oluştu!');
        } finally {
            setActionLoading(false);
        }
    };

    const columns: ColumnsType<Post> = [
        {
            title: 'Yazar',
            dataIndex: ['user', 'name'],
            key: 'user',
            width: 200,
            render: (_, record) => (
                <div className="flex items-center gap-2">
                    <Avatar icon={<UserOutlined />} size="small">
                        {record.user.name?.charAt(0).toUpperCase() || record.user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <div className="font-medium">{record.user.name || record.user.username}</div>
                        <div className="text-xs text-gray-500">@{record.user.username}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Başlık',
            dataIndex: 'title',
            key: 'title',
            sorter: true,
            width: 250,
        },
        {
            title: 'Görsel',
            dataIndex: 'image_url',
            key: 'image_url',
            width: 120,
            render: (image_url) => (
                image_url ? (
                    <Image
                        width={60}
                        height={60}
                        src={getImageUrl(image_url) || ''}
                        alt="Post görseli"
                        style={{ borderRadius: 8, objectFit: 'cover' }}
                        placeholder
                    />
                ) : (
                    <div className="w-15 h-15 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                        Görsel Yok
                    </div>
                )
            ),
        },
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
            width: 350,
            render: (description) => (
                <Text ellipsis={{ tooltip: description }}>
                    {description?.substring(0, 100)}...
                </Text>
            ),
        },
        {
            title: 'Beğeni',
            dataIndex: 'likes_count',
            key: 'likes_count',
            width: 80,
            render: (likes_count) => (
                <Space>
                    <HeartOutlined className="text-red-500" />
                    <Text>{likes_count || 0}</Text>
                </Space>
            ),
        },
        {
            title: 'Tarih',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date) => dayjs(date).format('DD.MM.YYYY HH:mm'),
        },
        {
            title: 'Durum',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => (
                <Tag color={status === 1 ? 'green' : 'red'}>
                    {status === 1 ? 'Aktif' : 'Pasif'}
                </Tag>
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
                        onClick={() => showPostDetails(record)}
                    />
                    <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => showEditModal(record)}
                    />
                    <Popconfirm
                        title="Paylaşım Silme"
                        description="Bu paylaşımı silmek istediğinizden emin misiniz?"
                        onConfirm={() => handleDeletePost(record)}
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
        <AdminLayout title="Paylaşım Yönetimi">
            <Head title="Admin - Paylaşımlar" />
            
            <Card>
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <Title level={4} className="!mb-1">Paylaşımlar</Title>
                        <Text type="secondary">Toplam {posts.total} paylaşım</Text>
                    </div>
                    
                    <Space>
                        <Search
                            placeholder="Paylaşım ara..."
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
                    dataSource={posts.data}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: posts.current_page,
                        total: posts.total,
                        pageSize: posts.per_page,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} / ${total} paylaşım`,
                        pageSizeOptions: ['10', '25', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Post Detay Modal */}
            <Modal
                title="Paylaşım Detayları"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={700}
            >
                {selectedPost && (
                    <div className="space-y-4">
                        <div className="pb-4 border-b">
                            <div className="flex items-center gap-3 mb-3">
                                <Avatar icon={<UserOutlined />} size="large">
                                    {selectedPost.user.name?.charAt(0).toUpperCase() || selectedPost.user.username.charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                    <Title level={5} className="!mb-0">{selectedPost.user.name || selectedPost.user.username}</Title>
                                    <Text type="secondary">@{selectedPost.user.username}</Text>
                                </div>
                            </div>
                            <Title level={4} className="!mb-2">{selectedPost.title}</Title>
                            <Text type="secondary">{dayjs(selectedPost.created_at).format('DD.MM.YYYY HH:mm')}</Text>
                        </div>
                        
                        <div>
                            <Text strong>Açıklama:</Text>
                            <div className="mt-2 p-3 bg-gray-50 rounded">
                                <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedPost.description}</Text>
                            </div>
                        </div>

                        {selectedPost.image_url && (
                            <div>
                                <Text strong>Görsel:</Text>
                                <div className="mt-2">
                                    <Image
                                        width="100%"
                                        src={getImageUrl(selectedPost.image_url)|| ''}
                                        alt="Post görseli"
                                        style={{ borderRadius: 8, maxHeight: 400, objectFit: 'cover' }}
                                        placeholder
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <HeartOutlined className="text-red-500" />
                                <Text>Beğeni: {selectedPost.likes_count || 0}</Text>
                            </div>
                            <div className="flex items-center gap-2">
                                <Text>Durum:</Text>
                                <Tag color={selectedPost.status === 1 ? 'green' : 'red'}>
                                    {selectedPost.status === 1 ? 'Aktif' : 'Pasif'}
                                </Tag>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <Text strong>Yazar Bilgileri:</Text>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                                <div>
                                    <Text type="secondary">Ad:</Text>
                                    <br />
                                    <Text>{selectedPost.user.name || 'Belirtilmemiş'}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">E-mail:</Text>
                                    <br />
                                    <Text>{selectedPost.user.email}</Text>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Post Edit Modal */}
            <Modal
                title="Paylaşım Durumunu Güncelle"
                open={editModalVisible}
                onCancel={() => setEditModalVisible(false)}
                footer={null}
                width={500}
            >
                {selectedPost && (
                    <div className="space-y-4">
                        <div className="pb-4 border-b">
                            <Title level={5} className="!mb-2">{selectedPost.title}</Title>
                            <Text type="secondary">Mevcut durum: </Text>
                            <Tag color={selectedPost.status === 1 ? 'green' : 'red'}>
                                {selectedPost.status === 1 ? 'Aktif' : 'Pasif'}
                            </Tag>
                        </div>
                        
                        <div className="flex justify-center gap-4 pt-4">
                            <Button 
                                type={selectedPost.status === 0 ? "primary" : "default"}
                                onClick={() => handleUpdateStatus(1)}
                                loading={actionLoading}
                                size="large"
                            >
                                Aktif Yap
                            </Button>
                            <Button 
                                type={selectedPost.status === 1 ? "primary" : "default"}
                                danger={selectedPost.status === 1}
                                onClick={() => handleUpdateStatus(0)}
                                loading={actionLoading}
                                size="large"
                            >
                                Pasif Yap
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}