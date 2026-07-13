import React, { useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PHONE_REGEX } from '@obi/shared';
import { Screen } from '../../components/Screen';
import { Button, Card, H2, H3, Input, Muted, Loading, ErrorView } from '../../components/ui';
import { getOperators, createStaff, setStaffActive } from '../../api/admin';
import { apiErrorMessage } from '../../lib/api';
import { colors, spacing } from '../../theme';
import { t } from '../../i18n';

export function ManageOperatorsScreen() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-operators'],
    queryFn: getOperators,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ phone: '+992', name: '' });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-operators'] });

  const addMutation = useMutation({
    mutationFn: () =>
      createStaff({ phone: form.phone.replace(/\s/g, ''), name: form.name.trim(), role: 'OPERATOR' }),
    onSuccess: () => {
      invalidate();
      setModalOpen(false);
      setForm({ phone: '+992', name: '' });
    },
    onError: (e) => Alert.alert(t().common.error, apiErrorMessage(e)),
  });

  const blockMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setStaffActive(id, isActive),
    onSuccess: invalidate,
  });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView message={apiErrorMessage(error)} onRetry={refetch} />;

  const canAdd = PHONE_REGEX.test(form.phone.replace(/\s/g, '')) && form.name.trim().length > 0;

  return (
    <Screen padded={false}>
      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListHeaderComponent={
          <Button title={t().admin.addOperator} onPress={() => setModalOpen(true)} style={{ marginBottom: spacing.md }} />
        }
        renderItem={({ item }) => (
          <Card style={{ opacity: item.isActive ? 1 : 0.55 }}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <H3 numberOfLines={1}>{item.name ?? '—'}</H3>
                <Muted>{item.phone}</Muted>
                {!item.isActive ? <Muted style={styles.pending}>⏳ {t().admin.pending}</Muted> : null}
              </View>
              <Button
                title={item.isActive ? t().admin.block : t().admin.approve}
                variant={item.isActive ? 'danger' : 'success'}
                small
                onPress={() => blockMutation.mutate({ id: item.id, isActive: !item.isActive })}
              />
            </View>
          </Card>
        )}
      />

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <H2 style={{ fontSize: 18, marginBottom: spacing.md }}>{t().admin.addOperator}</H2>
            <Input label={t().common.phone} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
            <Input label={t().admin.name} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
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
