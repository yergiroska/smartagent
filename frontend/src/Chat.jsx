import { useState, useRef, useEffect } from "react"
import axios from "axios"
import ReactMarkdown from "react-markdown"

const SESSION_ID = crypto.randomUUID()

export default function Chat() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [conversations, setConversations] = useState([])
    const [activeSession, setActiveSession] = useState(SESSION_ID)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading])

    useEffect(() => {
        fetchConversations()
    }, [])

    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/conversations/`)
            setConversations(res.data.conversations)
        } catch (e) {
            console.error("Error cargando conversaciones", e)
        }
    }

    const loadConversation = async (sessionId) => {
        setActiveSession(sessionId)
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/conversations/${sessionId}`)
            setMessages(res.data.messages || [])
        } catch (e) {
            console.error("Error cargando conversación", e)
        }
    }

    const newConversation = () => {
        const newId = crypto.randomUUID()
        setActiveSession(newId)
        setMessages([])
    }

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const userMessage = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setLoading(true)

        try {
             const res = await axios.post(`${import.meta.env.VITE_API_URL}/chat/`, {
                message: input,
                session_id: activeSession,
            })
            const agentMessage = { role: "agent", content: res.data.response }
            setMessages(prev => [...prev, agentMessage])
            fetchConversations()
        } catch (error) {
            setMessages(prev => [...prev, { role: "agent", content: "Error al conectar con el agente." }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const shortId = (id) => id.length > 8 ? id.substring(0, 8) + "..." : id

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-lg font-semibold text-purple-400">SmartAgent</h1>
                    <p className="text-xs text-gray-500 mt-1">Agente IA con memoria</p>
                </div>
                <div className="p-3">
                    <button
                        onClick={newConversation}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    >
                        + Nueva conversación
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-2 space-y-1">
                    {conversations.map((conv) => (
                        <button
                            key={conv.session_id}
                            onClick={() => loadConversation(conv.session_id)}
                            className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors truncate ${
                                activeSession === conv.session_id
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-400 hover:bg-gray-800"
                            }`}
                        >
                            💬 {shortId(conv.session_id)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main chat */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                    <p className="text-xs text-gray-500">Sesión: {activeSession.substring(0, 8)}...</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-600 mt-20 text-sm">
                            Empieza una conversación con SmartAgent
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                                msg.role === "user"
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-800 text-gray-100"
                            }`}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-800 rounded-2xl px-4 py-2 text-sm text-gray-400 animate-pulse">
                                SmartAgent está pensando...
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-gray-800 flex gap-2">
          <textarea
              className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2 text-sm resize-none outline-none focus:ring-2 focus:ring-purple-500"
              rows={1}
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
          />
                    <button
                        onClick={sendMessage}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                    >
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    )
}