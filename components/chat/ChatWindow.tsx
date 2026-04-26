'use client';
// components/chat/ChatWindow.tsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToMessages, sendMessage } from '@/services/chat';
import { Message, Chat } from '@/lib/types';
import { format } from 'date-fns';

interface ChatWindowProps {
  chat: Chat;
  chatId: string;
}

export default function ChatWindow({ chat, chatId }: ChatWindowProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });
    return () => unsub();
  }, [chatId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !profile) return;
    setSending(true);
    try {
      await sendMessage(chatId, profile.uid, profile.name, text.trim());
      setText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!profile) return null;

  const otherName = profile.uid === chat.landlordId ? chat.tenantName : chat.landlordName;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', borderRadius: 8, border: '1px solid var(--gray-200)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--gray-200)',
        background: 'var(--black)', display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 40, height: 40, background: 'var(--red)', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0,
        }}>
          {otherName?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>{otherName}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            Re: {chat.propertyTitle}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--gray-400)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 15 }}>Start the conversation</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Ask about the property, viewing times, or anything else.
            </p>
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.senderId === profile.uid;
          return (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: isMe ? 'flex-end' : 'flex-start',
            }}>
              <div style={{ maxWidth: '72%' }}>
                {!isMe && (
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 4, marginLeft: 4 }}>
                    {msg.senderName}
                  </div>
                )}
                <div style={{
                  padding: '12px 16px',
                  background: isMe ? 'var(--black)' : 'var(--gray-100)',
                  color: isMe ? '#fff' : 'var(--black)',
                  borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontSize: 14, lineHeight: 1.6,
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4, textAlign: isMe ? 'right' : 'left', marginLeft: 4, marginRight: 4 }}>
                  {msg.timestamp instanceof Date
                    ? format(msg.timestamp, 'HH:mm · d MMM')
                    : ''}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        padding: '16px 20px', borderTop: '1px solid var(--gray-200)',
        display: 'flex', gap: 10, background: '#fff',
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1, padding: '11px 16px', border: '1px solid var(--gray-200)',
            borderRadius: 24, fontSize: 14, outline: 'none', fontFamily: 'var(--font-sans)',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--red)')}
          onBlur={e => (e.target.style.borderColor = 'var(--gray-200)')}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{
            padding: '11px 20px', background: 'var(--red)', color: '#fff',
            border: 'none', borderRadius: 24, fontSize: 14, fontWeight: 600,
            cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1,
            transition: 'opacity .2s',
          }}
        >
          {sending ? '…' : '→'}
        </button>
      </form>
    </div>
  );
}
