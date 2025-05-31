'use client';

import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SocialWaitingArea = ({ isSecret = false }) => {
  const socket = io(isSecret ? 'http://localhost:3001/secret' : 'http://localhost:3001/public');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [nickname, setNickname] = useState(`Anon${Math.floor(Math.random() * 1000)}`);

  useEffect(() => {
    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data].slice(-50));
    });
    return () => socket.off('receive_message');
  }, [socket]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const messageData = {
      nickname,
      text: newMessage,
      timestamp: new Date().toISOString()
    };
    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  return (
    <div className="w-full max-w-2xl bg-card p-6 rounded-lg shadow-neon border-accent">
      <h2 className="text-2xl font-bold text-cyan-400 mb-4">
        {isSecret ? 'Secret Hoodie Chat Room' : 'Social Waiting Area'}
      </h2>
      <p className="text-foreground mb-4">
        {isSecret
          ? 'Welcome, verified Hoodies! Chat with the elite.'
          : 'Chat with degens while you wait to access Hoodie Academy!'}
      </p>
      <div className="h-64 overflow-y-auto mb-4 p-4 bg-muted rounded-lg">
        {messages.map((msg, index) => (
          <div key={index} className="mb-2">
            <span className="text-accent font-bold">{msg.nickname}: </span>
            <span className="text-foreground">{msg.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex space-x-2">
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Nickname"
          className="flex-1 bg-muted text-foreground border-accent"
        />
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-muted text-foreground border-accent"
        />
        <Button type="submit" className="bg-gradient-to-r from-green-600 to-purple-600 text-white">
          Send
        </Button>
      </form>
    </div>
  );
};

export default SocialWaitingArea; 