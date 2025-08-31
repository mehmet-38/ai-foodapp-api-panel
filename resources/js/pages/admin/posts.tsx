import React, { useState } from 'react';
import { Table, Input, Button, Tag, Space, Card, Typography, Modal, Avatar, message, Popconfirm } from 'antd';
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
    content: string;
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

export default function PostsPage({ posts, filters }: PostsPageProps) {
    const [loading, setLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
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
            width: 300,
        },
        {
            title: 'İçerik',
            dataIndex: 'content',
            key: 'content',
            width: 400,
            render: (content) => (
                <Text ellipsis={{ tooltip: content }}>
                    {content?.substring(0, 100)}...
                </Text>
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
                            <Text strong>İçerik:</Text>
                            <div className="mt-2 p-3 bg-gray-50 rounded">
                                <Text style={{ whiteSpace: 'pre-wrap' }}>{selectedPost.content}</Text>
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
        </AdminLayout>
    );
}