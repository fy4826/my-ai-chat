import './App.css';
import { Bot, Send, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChat } from './hooks/useChat';

const App = () => {
  const { messages, input, isLoading, setInput, sendMessage } = useChat();

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="p-4 bg-white border-b shadow-sm text-center font-bold text-xl text-blue-600">
        My AI Chat (Rsbuild)
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">开始新的对话...</div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
            >
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 markdown-body'
              }`}
            >
              {msg.role === 'user' ? (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入消息..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
