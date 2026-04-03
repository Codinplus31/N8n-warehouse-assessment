import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ChatPanel from './components/ChatPanel';
import Toast from './components/Toast';

const App = () => {
    const [activePanel, setActivePanel] = useState('health');
    const [toasts, setToasts] = useState([]);
    const [chatSessionId] = useState('user-' + Math.random().toString(36).slice(2, 7));
    const N8N_URL = 'https://codinplus30.app.n8n.cloud/webhook-test/warehouse';

    const addToast = (type, title, msg) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, title, msg }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const callN8N = async (payload) => {
        const res = await fetch(N8N_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    };

    return (
        <div className='app-container'>
            <Header />
            <div className='app'>
                <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
                <MainContent activePanel={activePanel} addToast={addToast} callN8N={callN8N} />
                <ChatPanel addToast={addToast} callN8N={callN8N} chatSessionId={chatSessionId} />
            </div>
            <div className='toast-container'>
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} />
                ))}
            </div>
        </div>
    );
};

export default App;