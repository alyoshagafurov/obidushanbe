import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ChatMessageDto, SocketEvent } from '@obi/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyView, Loading } from '../../components/ui';
import { getConversation, sendMessage } from '../../api/chat';
import { connectSocket } from '../../lib/socket';
import { useAuthStore } from '../../store/auth.store';
import { dateTime } from '../../lib/format';
import { colors, radius, spacing } from '../../theme';
import { t } from '../../i18n';

type ParamList = { Chat: { peerId: string; orderId?: string; peerName?: string } };

export function ChatScreen() {
  const { params } = useRoute<RouteProp<ParamList, 'Chat'>>();
  const myId = useAuthStore((s) => s.user?.id);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList<ChatMessageDto>>(null);

  // Загрузка истории
  useEffect(() => {
    let active = true;
    getConversation(params.peerId, params.orderId)
      .then((msgs) => active && setMessages(msgs))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [params.peerId, params.orderId]);

  // Реалтайм: входящие сообщения этого диалога
  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | undefined;
    (async () => {
      const socket = await connectSocket();
      if (!socket || !active) return;
      const handler = (m: ChatMessageDto) => {
        const inThisChat =
          (m.senderId === params.peerId && m.recipientId === myId) ||
          (m.senderId === myId && m.recipientId === params.peerId);
        if (inThisChat) setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      };
      socket.on(SocketEvent.CHAT_MESSAGE, handler);
      cleanup = () => socket.off(SocketEvent.CHAT_MESSAGE, handler);
    })();
    return () => {
      active = false;
      cleanup?.();
    };
  }, [params.peerId, myId]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      const msg = await sendMessage({ recipientId: params.peerId, orderId: params.orderId, text: body });
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
    } catch {
      setText(body); // вернуть текст при ошибке
    }
  };

  if (loading) return <Loading />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<EmptyView text={t().chat.empty} icon="💬" />}
          renderItem={({ item }) => {
            const mine = item.senderId === myId;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.msgText, mine && { color: colors.onPrimary }]}>{item.text}</Text>
                <Text style={[styles.time, mine && { color: '#DCEBF8' }]}>{dateTime(item.createdAt)}</Text>
              </View>
            );
          }}
        />
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder={t().chat.placeholder}
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Text style={styles.sendText}>{t().chat.send}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 2 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 2 },
  msgText: { color: colors.text, fontSize: 15 },
  time: { color: colors.textMuted, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
  },
  sendText: { color: colors.onPrimary, fontWeight: '700' },
});
