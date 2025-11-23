import React, { useState,useEffect} from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator, ScrollView } from "react-native";
import {categoriesStyles} from "../styles/CategoriesStyles";
import {categoryService, authService} from "../services/api";

export default function CategoriesScreen(){
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    useEffect(() => {
        loadcurrentUser();
        loadCategories();
    }, []);

    const loadcurrentUser = async () => {
        try {
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error al cargar usuario:', error);
        }
    };

    const loadCategories = async () => {
        setLoading(true);
        setError('');
        try{
            const response = await categoryService.getALL();
            setCategories(response?.data || []);
            } catch (error){
                setError('Error al cargar categorías');
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        const handlesave = async () => {
            if (!formData.name.trim()) {
                Alert.alert('Error', 'El nombre es obligatorio');
                return;
            }
            try {
                if (editing) {
                    await categoryService.update(editing.id, formData);
                    Alert.alert('Éxito', 'Categoría actualizada');
                } else {
                    await categoryService.create(formData);
                    Alert.alert('Éxito', 'Categoría creada exitosamente');
                }

                setModalVisible(false);
                resetForm();
                loadCategories();
            } catch (error) {
                Alert.alert('Error', 'No se pudo guardar la categoría');
            }
        };

        const handleDelete = (item: any) => {
            if (currentUser?.role !== 'ADMIN') {
                Alert.alert('Acceso denegado', 'Solo los administradores pueden eliminar.');
                return;
            }
                Alert.alert('Confiar', `¿Eliminar ${item.name}?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                            try{
                                await categoryService.delete(item.id);
                                Alert.alert('Éxito', 'Categoría eliminada');
                                loadCategories();
                            } catch (error) {
                                Alert.alert('Error', 'No se pudo eliminar la categoría');
                            }
                        }
                    }
            ]);

        };
        const handleToggleActive = async (item: any) => {
            const action = item.active ? 'desactivar' : 'activar';
            Alert.alert('Confirmar', `¿${action.charAt(0).toUpperCase() + action.slice(1)} la categoría ${item.name}?`, [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: action.charAt(0).toUpperCase() + action.slice(1),
                    onPress: async () => {
                        try {
                            await categoryService.update(item.id, { 
                                name: item.name,
                                description: item.description,
                                active: !item.active 
                            });
                            Alert.alert('Éxito', `Categoria ${item.active ? 'desactivada' : 'activada'}`);
                            loadCategories();
                        } catch (error) {
                            Alert.alert('Error', `No se pudo ${action}`);
                        }
                    }
                }
            ]);
        };

        const handleEdit = (item: any) => {
            setFormData({ name: item.name, description: item.description || '' });
            setEditing(item);
            setModalVisible(true);
        };

        const resetForm = () => {
            setFormData({ name: '', description: '' });
            setEditing(null);
        };

        //vista completa
        const renderCategory= ({ item }: { item: any }) => (
            <View style={categoriesStyles.categoryCard}>
            <View style={categoriesStyles.categoryInfo}>
            <Text style={categoriesStyles.categoryName}>
                {item.name} {item.active && <Text style={{color: '#999'}}> (Inactivo)</Text>}
            </Text>
            {item.description && (
                <Text style={categoriesStyles.categoryDescription}>{item.description}</Text>
            )}
        </View>

        <View style={categoriesStyles.actionsContainer}>
            <TouchableOpacity
                style={[categoriesStyles.actionButton, categoriesStyles.editButton]}
                onPress={() => handleEdit(item)}>
                <Text style={[categoriesStyles.actionButtonText, categoriesStyles.editButtonText]}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[categoriesStyles.actionButton, item.active ? categoriesStyles.deactivateButton : categoriesStyles.editButton]}
                onPress={() => handleToggleActive(item)}>
                <Text style={[categoriesStyles.actionButtonText, item.active ? categoriesStyles.deleteButtonText : categoriesStyles.editButtonText]}>
                    {item.active ? 'Desactivar' : 'Activar'}
                </Text>
            </TouchableOpacity>

            {currentUser?.role === 'ADMIN' && (
            <TouchableOpacity
            style={[categoriesStyles.actionButton, categoriesStyles.deleteButton]}
            onPress={() => handleDelete(item)}>
            <Text style={[categoriesStyles.actionButtonText, categoriesStyles.deleteButtonText]}>Eliminar</Text>
            </TouchableOpacity>
                )}
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={categoriesStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={categoriesStyles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    return (
        <View style={categoriesStyles.container}>
            <View style={categoriesStyles.header}>
                <View style={categoriesStyles.headerContent}>
                    <Text style={categoriesStyles.headerTitle}>Gestion Categorías</Text>
                    <TouchableOpacity
                    style={categoriesStyles.addButton}
                    onPress={() => {
                        resetForm();
                        setModalVisible(true);
                    }}>
                    <Text style={categoriesStyles.addButtonText}>+ Añadir Categoría</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {error ? (
            <View style={categoriesStyles.errorContainer}>
                <Text style={categoriesStyles.errorText}>{error}</Text>
                <TouchableOpacity style={categoriesStyles.retryButton} onPress={loadCategories}>
                    <Text style={categoriesStyles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
                </View>
            ) : null}
            
            <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={categoriesStyles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !loading && !error ?(
                        <View style={categoriesStyles.empyContainer}>
                        <Text style={categoriesStyles.empyText}>No hay categorías disponibles.</Text>
                        </View>
                    ): null
                }
                />

            <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <View style={categoriesStyles.modalOverlay}>
                    <View style={categoriesStyles.modalContainer}>
                        <ScrollView>
                            <View style={categoriesStyles.modalHeader}>
                                <Text style={categoriesStyles.modalTitle}>
                                    {editing ? 'Editar Categoría' : 'Nueva Categoría'}
                                </Text>
                            </View>

                            <View style={categoriesStyles.formContainer}>
                                <View style={categoriesStyles.inputGroup}>
                                    <Text style={categoriesStyles.inputLabel}>Nombre:</Text>
                                    <TextInput
                                        style={categoriesStyles.input}
                                        value={formData.name}
                                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                                        placeholder="Nombre de la categoría"
                                        placeholderTextColor="#999"
                                        />
                                </View>

                                <View style={categoriesStyles.inputGroup}>
                                    <Text style={categoriesStyles.inputLabel}>Descripcion:</Text>
                                    <TextInput
                                        style={[categoriesStyles.input, categoriesStyles.textArea]}
                                        value={formData.description}
                                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                                        placeholder="Descripción de la categoría"
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={3}
                                        textAlignVertical="top"
                                        />
                                    </View>
                                </View>

                                <View style={categoriesStyles.modalButtons}>
                                    <TouchableOpacity
                                        style={[categoriesStyles.modalButton, categoriesStyles.cancelButton]}
                                        onPress={() => setModalVisible(false)}>
                                        <Text style={[categoriesStyles.modalButtonText, categoriesStyles.cancelButtonText]}>Cancelar</Text>
                                        </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[categoriesStyles.modalButton, categoriesStyles.saveButton]}
                                        onPress={handlesave}>
                                        <Text style={[categoriesStyles.modalButtonText, categoriesStyles.saveButtonText]}>
                                            {editing ? 'Actualizar' : 'Guardar'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
        </View>
    );
}