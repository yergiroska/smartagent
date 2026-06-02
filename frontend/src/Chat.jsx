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
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [selectedFile, setSelectedFile] = useState(null)

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
        if ((!input.trim() && !selectedFile) || loading) return

        setLoading(true)

        if (selectedFile) {
            // content como objeto estructurado en lugar de string
            const userMessage = {
                role: "user",
                content: {
                    type: "file",
                    fileName: selectedFile.name,
                    prompt: input.trim() || "Resume este documento"
                }
            }
            setMessages(prev => [...prev, userMessage])
            const formData = new FormData()
            formData.append("file", selectedFile)
            formData.append("message", input.trim() || "Resume este documento")
            formData.append("session_id", activeSession)
            setInput("")
            setSelectedFile(null)
            try {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/upload/`, formData)
                setMessages(prev => [...prev, { role: "agent", content: res.data.response }])
                fetchConversations()
            } catch (error) {
                setMessages(prev => [...prev, { role: "agent", content: "Error al procesar el documento." }])
            } finally {
                setLoading(false)
            }
            return
        }

        const userMessage = { role: "user", content: input }
        setMessages(prev => [...prev, userMessage])
        setInput("")

        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/chat/`, {
                message: input,
                session_id: activeSession,
            })
            setMessages(prev => [...prev, { role: "agent", content: res.data.response }])
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

    const handleDeleteConversation = async (sessionId) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/conversations/${sessionId}`)
            if (activeSession === sessionId) {
                newConversation()
            }
            setConfirmDelete(null)
            fetchConversations()
        } catch (e) {
            console.error("Error eliminando conversación", e)
        }
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setSelectedFile(file)
    }

    const shortId = (id) => id.length > 8 ? id.substring(0, 8) + "..." : id

    // función auxiliar para renderizar el contenido del mensaje
    const renderMessageContent = (msg) => {
        const content = msg.content

        // Mensaje de archivo nuevo (objeto estructurado)
        if (typeof content === "object" && content !== null && content.type === "file") {
            return (
                <div>
                    <div className="flex items-center gap-2 font-semibold text-white mb-1">
                        📄 <span className="truncate">{content.fileName}</span>
                    </div>
                    {content.prompt && content.prompt !== "Resume este documento" && (
                        <div className="text-purple-200 text-xs mt-1 border-t border-purple-500/40 pt-1">
                            {content.prompt}
                        </div>
                    )}
                </div>
            )
        }

        // Mensaje de archivo antiguo
        if (typeof content === "string" && content.startsWith("📄 ")) {
            const withoutIcon = content.slice(3) // quita "📄 "
            const separatorIndex = withoutIcon.indexOf(" — ")
            if (separatorIndex !== -1) {
                const fileName = withoutIcon.slice(0, separatorIndex)
                const prompt = withoutIcon.slice(separatorIndex + 3)
                return (
                    <div>
                        <div className="flex items-center gap-2 font-semibold text-white mb-1">
                            📄 <span className="truncate">{fileName}</span>
                        </div>
                        {prompt && (
                            <div className="text-purple-200 text-xs mt-1 border-t border-purple-500/40 pt-1">
                                {prompt}
                            </div>
                        )}
                    </div>
                )
            }
            // Solo nombre, sin instrucción adicional
            return (
                <div className="flex items-center gap-2 font-semibold text-white">
                    📄 <span>{withoutIcon}</span>
                </div>
            )
        }

        // Mensaje normal de texto
        return <ReactMarkdown>{typeof content === "string" ? content : JSON.stringify(content)}</ReactMarkdown>
    }

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            {/* Modal de confirmación */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-80 space-y-4">
                        <h2 className="text-white font-semibold text-base">¿Eliminar conversación?</h2>
                        <p className="text-gray-400 text-sm">Esta acción no se puede deshacer.</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteConversation(confirmDelete)}
                                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        <div
                            key={conv.session_id}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors group ${
                                activeSession === conv.session_id
                                    ? "bg-purple-600 text-white"
                                    : "text-gray-400 hover:bg-gray-800"
                            }`}
                        >
                            <button
                                onClick={() => loadConversation(conv.session_id)}
                                className="flex-1 text-left truncate"
                            >
                                💬 {conv.title || shortId(conv.session_id)}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setConfirmDelete(conv.session_id)
                                }}
                                className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"
                            >
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main chat */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                    <p className="text-xs text-gray-500">
                        {conversations.find(c => c.session_id === activeSession)?.title || "Nueva conversación"}
                    </p>
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
                                {renderMessageContent(msg)}
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

                <div className="p-4 border-t border-gray-800 flex gap-2 items-end">
                    <label className="cursor-pointer flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-purple-400 rounded-xl px-3 py-2 text-sm transition-colors whitespace-nowrap">
                        📎 Adjuntar
                        <input
                            type="file"
                            accept=".pdf,.docx"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                    {selectedFile && (
                        <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1 text-xs text-purple-300 pb-2">
                            📄 {selectedFile.name}
                            <button onClick={() => setSelectedFile(null)} className="ml-1 text-gray-500 hover:text-red-400">✕</button>
                        </div>
                    )}
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