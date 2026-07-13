import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChatMessageDto, SocketEvent } from '@obi/shared';
import { getConversation, sendMessage } from '../../api';
import { connectSocket } from '../../lib/socket';
import { useAuth } from '../../store/auth';
import { dateTime } from '../../lib/format';
import { Spinner } from '../../components/ui';

export function Chat() {
  const { peerId = '' } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const orderId = sp.get('order') ?? undefined;
  const peerName = sp.get('name') ?? 'Собеседник';
  const myId = useAuth((s) => s.user?.id);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getConversation(peerId, orderId).then(setMessages).finally(() => setLoading(false));
  }, [peerId, orderId]);

  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    const handler = (m: ChatMessageDto) => {
      const inChat = (m.senderId === peerId && m.recipientId === myId) || (m.senderId === myId && m.recipientId === peerId);
      if (inChat) setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    };
    socket.on(SocketEvent.CHAT_MESSAGE, handler);
    return () => { socket.off(SocketEvent.CHAT_MESSAGE, handler); };
  }, [peerId, myId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      const msg = await sendMessage({ recipientId: peerId, orderId, text: body });
      setMessages((prev) => (prev.some((x) => x.id === msg.id) ? prev : [...prev, msg]));
    } catch { setText(body); }
  };

  return (
    <>
      <div className="page__head">
        <h1>{peerName}</h1>
        <button className="btn btn--ghost btn--sm" onClick={() => nav(-1)}>← Назад</button>
      </div>
      {loading ? <Spinner /> : (
        <div className="chat" style={{ maxWidth: 640 }}>
          <div className="chat__msgs">
            {messages.map((m) => (
              <div key={m.id} className={`bubble ${m.senderId === myId ? 'bubble--me' : 'bubble--them'}`}>
                {m.text}
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{dateTime(m.createdAt)}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="chat__bar">
            <input className="input grow" value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Сообщение…" onKeyDown={(e) => e.key === 'Enter' && send()} />
            <button className="btn" onClick={send}>Отпр.</button>
          </div>
        </div>
      )}
    </>
  );
}
