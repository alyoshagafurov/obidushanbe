import React, { useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PHONE_REGEX } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Body, Button, Card, H2, H3, Input, Muted, Loading, ErrorView } from '../../components/ui';
import { Avatar } from '../../components/widgets';
import { getCouriers, createStaff, setStaffActive } from '../../api/admin';
import { apiErrorMessage } from '../../lib/api';
import { colors, spacing } from '../../theme';
import { t } from '../../i18n';

export function ManageCouriersScreen() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-couriers'],
    queryFn: getCouriers,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ phone: '+992', name: '', bio: '' });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-couriers'] });

  const addMutation = useMutation({
    mutationFn: () =>
      createStaff({
        phone: form.phone.replace(/\s/g, ''),
        name: form.name.trim(),
        role: 'COURIER',
        bio: form.bio.trim() || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setForm({ phone: '+992', name: '', bio: '' });
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setStaffActive(id, isActive),
    onSuccess: invalidate,
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const canAdd = PHONE_REGEX.test(form.phone.replace(/\s/g, '')) && form.name.trim().length > 0;

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListHeaderComponent={
          <Button title={t().admin.addCourier} onPress={() => setModalOpen(true)} style={{ marginBottom: spacing.md }} />
        }
        renderItem={({ item }) => (
          <Card style={{ opacity: item.isActive ? 1 : 0.55 }}>
            <View style={styles.row}>
              <Avatar uri={item.photoUrl} name={item.name} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <H3 numberOfLines={1}>{item.name}</H3>
                <Muted>{item.phone}</Muted>
                <Muted>
                  ★ {item.rating.toFixed(1)} • {item.deliveriesCount} дост. • {item.reviewsCount} отз.
                </Muted>
                {!item.isActive ? <Muted style={styles.pending}>⏳ {t().admin.pending}</Muted> : null}
              </View>
            </View>
            <Button
              title={item.isActive ? t().admin.block : t().admin.approve}
              variant={item.isActive ? 'danger' : 'success'}
              small
              style={{ marginTop: spacing.md }}
              onPress={() => blockMutation.mutate({ id: item.id, isActive: !item.isActive })}
            />
          </Card>
        )}
      />

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <H2 style={{ fontSize: 18, marginBottom: spacing.md }}>{t().admin.addCourier}</H2>
            <Input label={t().common.phone} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
            <Input label={t().admin.name} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <Input label="Био" value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} multiline />
            <Button title={t().common.save} onPress={() => addMutation.mutate()} loading={addMutation.isPending} disabled={!canAdd} style={{ marginTop: spacing.md }} />
            <Button title={t().common.cancel} variant="outline" onPress={() => setModalOpen(false)} style={{ marginTop: spacing.sm }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  pending: { color: colors.warning, marginTop: 2, fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
