import { useState, useRef, useEffect } from "react"
import axios from "axios"
import ReactMarkdown from "react-markdown"

const SESSION_ID = crypto.randomUUID()

export default function Chat() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading])

    const sendMessage = async () => {
        if (!input.trim() || loading) return

        const userMessage = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")
        setLoading(true)

        try {
            const res = await axios.post("http://localhost:8000/chat/", {
                message: input,
                session_id: SESSION_ID,
            })
            const agentMessage = { role: "agent", content: res.data.response }
            setMessages(prev => [...prev, agentMessage])
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

    return (
        <div className="flex flex-col h-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 text-center">
                <h1 className="text-xl font-semibold text-purple-400">SmartAgent</h1>
                <p className="text-xs text-gray-500">Agente IA con memoria y herramientas reales</p>
            </div>

            {/* Messages */}
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

            {/* Input */}
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
    )
}