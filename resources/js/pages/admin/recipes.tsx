import React, { useState } from 'react';
import { Table, Input, Button, Tag, Space, Card, Typography, Modal, Image, Form, InputNumber, message, Popconfirm } from 'antd';
import { 
    SearchOutlined, 
    EyeOutlined, 
    EditOutlined,
    DeleteOutlined,
    ReloadOutlined,
    ClockCircleOutlined,
    PlusOutlined
} from '@ant-design/icons';
import AdminLayout from '@/layouts/admin-layout';
import { Head, router } from '@inertiajs/react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axios from 'axios';

const { Search } = Input;
const { Title, Text } = Typography;

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

interface Recipe {
    id: number;
    name: string;
    description: string;
    ingredients: string;
    instructions: string;
    image_url?: string;
    prep_time: number;
    cook_time: number;
    servings: number;
    created_at: string;
}

interface RecipesPageProps {
    recipes: {
        data: Recipe[];
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

export default function RecipesPage({ recipes, filters }: RecipesPageProps) {
    const [loading, setLoading] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSearch = (value: string) => {
        setLoading(true);
        router.get('/admin/recipes', 
            { search: value, per_page: filters.per_page },
            { 
                preserveState: true,
                onFinish: () => setLoading(false)
            }
        );
    };

    const handleTableChange = (pagination: any) => {
        setLoading(true);
        router.get('/admin/recipes',
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

    const showRecipeDetails = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setModalVisible(true);
    };

    const handleCreateRecipe = () => {
        form.resetFields();
        setCreateModalVisible(true);
    };

    const handleEditRecipe = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        form.setFieldsValue({
            name: recipe.name,
            description: recipe.description,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
            image_url: recipe.image_url,
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            servings: recipe.servings,
        });
        setEditModalVisible(true);
    };

    const handleDeleteRecipe = async (recipe: Recipe) => {
        try {
            setActionLoading(true);
            const response = await axios.delete(`/admin/api/recipes/${recipe.id}`, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            
            if (response.data.success) {
                message.success('Tarif başarıyla silindi!');
                window.location.reload();
            }
        } catch (error: any) {
            console.error('Delete recipe error:', error);
            message.error('Tarif silinirken bir hata oluştu!');
        } finally {
            setActionLoading(false);
        }
    };

    const columns: ColumnsType<Recipe> = [
        {
            title: 'Görsel',
            dataIndex: 'image_url',
            key: 'image',
            width: 80,
            render: (image_url, record) => {
                const fullImageUrl = getImageUrl(image_url);
                return fullImageUrl ? (
                    <Image
                        width={50}
                        height={50}
                        src={fullImageUrl}
                        alt={record.name}
                        style={{ borderRadius: 8, objectFit: 'cover' }}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ij6RnG4W+FmuVYvLITu7OTFXfu1M5OXoCvwE5sN+5kJ7N3YndmJ3Zmd2Yn7szOzk5Wdmdmd2YnO3k5OzM7szM7OzuxMzuxM7O7M7OzO7Oz14I/8Kfny98AAABkkRBsJkQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBt"
                    />
                ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-400 text-xs">Resim yok</span>
                    </div>
                );
            },
        },
        {
            title: 'Tarif Adı',
            dataIndex: 'name',
            key: 'name',
            sorter: true,
        },
        {
            title: 'Açıklama',
            dataIndex: 'description',
            key: 'description',
            width: 300,
            render: (description) => (
                <Text ellipsis={{ tooltip: description }}>
                    {description?.substring(0, 50)}...
                </Text>
            ),
        },
        {
            title: 'Süre',
            key: 'time',
            width: 120,
            render: (_, record) => (
                <div className="flex items-center gap-1">
                    <ClockCircleOutlined />
                    <span>{record.prep_time + record.cook_time} dk</span>
                </div>
            ),
        },
        {
            title: 'Porsiyon',
            dataIndex: 'servings',
            key: 'servings',
            width: 80,
            render: (servings) => `${servings} kişi`,
        },
        {
            title: 'Tarih',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (date) => dayjs(date).format('DD.MM.YYYY'),
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
                        onClick={() => showRecipeDetails(record)}
                    />
                    <Button 
                        type="link" 
                        icon={<EditOutlined />} 
                        size="small"
                        onClick={() => handleEditRecipe(record)}
                    />
                    <Popconfirm
                        title="Tarif Silme"
                        description="Bu tarifi silmek istediğinizden emin misiniz?"
                        onConfirm={() => handleDeleteRecipe(record)}
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
        <AdminLayout title="Tarif Yönetimi">
            <Head title="Admin - Tarifler" />
            
            <Card>
                <div className="mb-4 flex justify-between items-center">
                    <div>
                        <Title level={4} className="!mb-1">Tarifler</Title>
                        <Text type="secondary">Toplam {recipes.total} tarif</Text>
                    </div>
                    
                    <Space>
                        <Button 
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreateRecipe}
                        >
                            Tarif Ekle
                        </Button>
                        <Search
                            placeholder="Tarif ara..."
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
                    dataSource={recipes.data}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: recipes.current_page,
                        total: recipes.total,
                        pageSize: recipes.per_page,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) => 
                            `${range[0]}-${range[1]} / ${total} tarif`,
                        pageSizeOptions: ['10', '25', '50', '100'],
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Tarif Detay Modal */}
            <Modal
                title="Tarif Detayları"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedRecipe && (
                    <div className="space-y-4">
                        <div className="text-center pb-4 border-b">
                            {selectedRecipe.image_url && (
                                <Image
                                    width={200}
                                    height={150}
                                    src={getImageUrl(selectedRecipe.image_url) || ''}
                                    alt={selectedRecipe.name}
                                    style={{ borderRadius: 8, objectFit: 'cover', marginBottom: 16 }}
                                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ij6RnG4W+FmuVYvLITu7OTFXfu1M5OXoCvwE5sN+5kJ7N3YndmJ3Zmd2Yn7szOzk5Wdmdmd2YnO3k5OzM7szM7OzuxMzuxM7O7M7OzO7Oz14I/8Kfny98AAABkkRBsJkQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBtJEQbCdFGQrSREG0kRBsJ0UZCtJEQbSREGwnRRkK0kRBt"
                                />
                            )}
                            <Title level={3} className="!mt-2 !mb-1">{selectedRecipe.name}</Title>
                            <Text type="secondary">{selectedRecipe.description}</Text>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Text strong>Hazırlık Süresi:</Text>
                                <br />
                                <Text>{selectedRecipe.prep_time} dakika</Text>
                            </div>
                            <div>
                                <Text strong>Pişirme Süresi:</Text>
                                <br />
                                <Text>{selectedRecipe.cook_time} dakika</Text>
                            </div>
                            <div>
                                <Text strong>Porsiyon:</Text>
                                <br />
                                <Text>{selectedRecipe.servings} kişilik</Text>
                            </div>
                            <div>
                                <Text strong>Oluşturulma Tarihi:</Text>
                                <br />
                                <Text>{dayjs(selectedRecipe.created_at).format('DD.MM.YYYY HH:mm')}</Text>
                            </div>
                        </div>

                        <div>
                            <Text strong>Malzemeler:</Text>
                            <div className="mt-2 p-3 bg-gray-50 rounded">
                                <Text>{selectedRecipe.ingredients}</Text>
                            </div>
                        </div>

                        <div>
                            <Text strong>Yapılışı:</Text>
                            <div className="mt-2 p-3 bg-gray-50 rounded">
                                <Text>{selectedRecipe.instructions}</Text>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}