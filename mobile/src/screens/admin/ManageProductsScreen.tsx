import React, { useState } from 'react';
import { Alert, FlatList, Image, Modal, Pressable, StyleSheet, Switch, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Product, ProductType } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Body, Button, Card, H2, H3, Input, Muted, Loading, ErrorView } from '../../components/ui';
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../api/admin';
import { uploadImage } from '../../api/upload';
import { productImage } from '../../brand/assets';
import { apiErrorMessage } from '../../lib/api';
import { money } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

const TYPE_LABELS: Record<ProductType, string> = {
  WATER_20L: 'Вода 20л',
  WATER_05L: 'Вода 0.5л',
  COOLER: 'Кулер',
  PUMP_MANUAL: 'Помпа ручная',
  PUMP_ELECTRIC: 'Помпа электр.',
  OTHER: 'Другое',
};

export function ManageProductsScreen() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-products'],
    queryFn: getAllProducts,
  });

  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    price: string;
    type: ProductType;
    photoUrl: string | null;
  }>({ name: '', price: '', type: ProductType.WATER_20L, photoUrl: null });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', price: '', type: ProductType.WATER_20L, photoUrl: null });
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, price: String(p.price), type: p.type, photoUrl: p.photoUrl });
    setModalOpen(true);
  };

  // Выбор фото из галереи + загрузка на сервер.
  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t().common.appName, 'Нет доступа к галерее');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const contentType = asset.mimeType ?? 'image/jpeg';
    setUploading(true);
    try {
      const url = await uploadImage(asset.uri, contentType, 'product');
      setForm((f) => ({ ...f, photoUrl: url }));
    } catch (e) {
      Alert.alert(t().common.error, apiErrorMessage(e));
    } finally {
      setUploading(false);
    }
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['products'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        type: form.type,
        photoUrl: form.photoUrl,
      };
      if (editing) return updateProduct(editing.id, payload);
      return createProduct({ ...payload, isActive: true });
    },
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  const toggleActive = useMutation({
    mutationFn: (p: Product) => updateProduct(p.id, { isActive: !p.isActive }),
    onSuccess: invalidate,
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: invalidate,
  });

  const confirmDelete = (p: Product) =>
    Alert.alert(t().common.delete, p.name, [
      { text: t().common.cancel, style: 'cancel' },
      { text: t().common.delete, style: 'destructive', onPress: () => removeMutation.mutate(p.id) },
    ]);

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListHeaderComponent={
          <Button title={t().admin.addProduct} onPress={openCreate} style={{ marginBottom: spacing.md }} />
        }
        renderItem={({ item }) => (
          <Card style={{ opacity: item.isActive ? 1 : 0.5 }}>
            <View style={styles.row}>
              <Image source={productImage(item.type, item.photoUrl)} style={styles.listThumb} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <H3 numberOfLines={1}>{item.name}</H3>
                <Muted>{TYPE_LABELS[item.type]} • {money(item.price)}</Muted>
              </View>
              <Switch value={item.isActive} onValueChange={() => toggleActive.mutate(item)} />
            </View>
            <View style={styles.actions}>
              <Button title={t().common.edit} variant="outline" small style={{ flex: 1, marginRight: spacing.sm }} onPress={() => openEdit(item)} />
              <Button title={t().common.delete} variant="danger" small style={{ flex: 1 }} onPress={() => confirmDelete(item)} />
            </View>
          </Card>
        )}
      />

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <H2 style={{ fontSize: 18, marginBottom: spacing.md }}>
              {editing ? t().common.edit : t().admin.addProduct}
            </H2>

            {/* Фото товара — публикация изображения */}
            <Muted style={{ marginBottom: spacing.xs }}>{t().admin.photo}</Muted>
            <Pressable onPress={pickPhoto} style={styles.photoPick}>
              <Image
                source={productImage(form.type, form.photoUrl)}
                style={styles.photoPreview}
                resizeMode="contain"
              />
            </Pressable>
            <Button
              title={uploading ? t().admin.uploading : form.photoUrl ? t().admin.changePhoto : t().admin.addPhoto}
              variant="secondary"
              small
              loading={uploading}
              onPress={pickPhoto}
              style={{ marginBottom: spacing.md }}
            />

            <Input label={t().admin.name} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <Input
              label={t().admin.price}
              value={form.price}
              onChangeText={(v) => setForm({ ...form, price: v.replace(/[^\d.]/g, '') })}
              keyboardType="decimal-pad"
            />
            <Muted style={{ marginBottom: spacing.xs }}>Тип</Muted>
            <View style={styles.typeWrap}>
              {(Object.keys(TYPE_LABELS) as ProductType[]).map((tp) => (
                <Button
                  key={tp}
                  title={TYPE_LABELS[tp]}
                  small
                  variant={form.type === tp ? 'primary' : 'secondary'}
                  style={styles.typeBtn}
                  onPress={() => setForm({ ...form, type: tp })}
                />
              ))}
            </View>
            <Button
              title={t().common.save}
              onPress={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
              disabled={!form.name.trim() || !form.price}
              style={{ marginTop: spacing.md }}
            />
            <Button title={t().common.cancel} variant="outline" onPress={() => setModalOpen(false)} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  listThumb: { width: 44, height: 44, marginRight: spacing.md, borderRadius: radius.sm },
  photoPick: { alignSelf: 'center', marginBottom: spacing.sm },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  modalBg: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  typeWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  typeBtn: { marginRight: spacing.sm, marginBottom: spacing.sm },
});
