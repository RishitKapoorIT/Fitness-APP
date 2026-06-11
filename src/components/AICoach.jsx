import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, Sparkles, AlertTriangle, CornerDownLeft } from 'lucide-react';

export default function AICoach() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`coach_chat_${profile?.id}`);
      return saved ? JSON.parse(saved) : [
        {
          sender: 'coach',
          text: `Hi ${profile?.name || 'there'}! I'm your AI Fitness & Recovery Coach. I see your goal is **${profile?.goal || 'General Health'}**, and you're working around **${profile?.injuries || 'No injuries'}**. How can I help you safely train today?`
        }
      ];
    } catch {
      return [
        {
          sender: 'coach',
          text: "Hi! I'm your AI Fitness & Recovery Coach. How can I help you safely train today?"
        }
      ];
    }
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Save history to localStorage
  useEffect(() => {
    if (profile?.id) {
      localStorage.setItem(`coach_chat_${profile.id}`, JSON.stringify(messages));
    }
  }, [messages, profile]);

  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) setInput('');

    // Append user message
    const updatedMessages = [...messages, { sender: 'user', text: query }];
    setMessages(updatedMessages);
    setLoading(true);

    if (!geminiApiKey || geminiApiKey === 'your-gemini-api-key') {
      // Mock fallback if API key is not yet set up
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'coach',
            text: "**Gemini API Key is not configured yet.** Please add your `VITE_GEMINI_API_KEY` to the `.env` file in your project directory to activate real-time Gemini AI coaching. \n\n*Note for Rishit: Ensure your key is from Google AI Studio.*"
          }
        ]);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      // Build context payload
      const systemPrompt = `You are a professional athletic coach, recovery expert, and physical therapist. 
      You are coaching ${profile?.name || 'an athlete'}, age ${profile?.age || 21}, weight ${profile?.weight_kg || 84}kg, height ${profile?.height_cm || 173}cm, whose goal is "${profile?.goal || 'General Fitness'}".
      They have logged their active injury/soreness concern as: "${profile?.injuries || 'None'}".
      
      RULES:
      1. Keep your tone encouraging, professional, and science-based.
      2. Since the user logs "${profile?.injuries || 'None'}", always ensure any workout changes you advise respect this concern. For "Shin/Calf Pain", warn against high-impact concrete running. Recommend low-impact warmups (ankle circles, slow walks) and calf stretches.
      3. CRITICAL: If they describe sharp bone pain or intense pain, advise them to immediately stop and seek medical evaluation. Do not give official medical diagnoses, but prioritize safety.
      4. Keep answers relatively concise and highly actionable. Use bullet points for exercise adjustments.`;

      // Filter messages history so it starts with a user turn and contains alternating roles
      const userStartedHistory = updatedMessages.filter((m, idx) => {
        if (idx === 0 && m.sender === 'coach') return false;
        return true;
      });

      // Merge consecutive messages of the same role to strictly alternate user -> model
      const apiMessages = [];
      userStartedHistory.forEach((m) => {
        const role = m.sender === 'user' ? 'user' : 'model';
        if (apiMessages.length > 0 && apiMessages[apiMessages.length - 1].role === role) {
          // Append text to the last message's parts
          apiMessages[apiMessages.length - 1].parts[0].text += `\n\n${m.text}`;
        } else {
          apiMessages.push({
            role: role,
            parts: [{ text: m.text }]
          });
        }
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey
          },
          body: JSON.stringify({
            contents: apiMessages,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            }
          })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        let errMsg = data.error.message || "Unknown error";
        if (data.error.status === "INVALID_ARGUMENT" || errMsg.includes("API key")) {
          errMsg = "Your Gemini API Key is invalid or not active. Please check the `VITE_GEMINI_API_KEY` setting in your `.env` file.";
        }
        setMessages((prev) => [
          ...prev,
          {
            sender: 'coach',
            text: `**Connection Error:** ${errMsg}`
          }
        ]);
        return;
      }

      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I had trouble connecting. Please try again.";

      setMessages((prev) => [...prev, { sender: 'coach', text: botText }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: 'coach', text: "Error connecting to AI Coach. Please check your internet connection or API keys." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to reset your coaching chat history?")) {
      const initial = [
        {
          sender: 'coach',
          text: `Hi ${profile?.name || 'there'}! I'm your AI Fitness & Recovery Coach. I see your goal is **${profile?.goal || 'General Health'}**, and you're working around **${profile?.injuries || 'No injuries'}**. How can I help you safely train today?`
        }
      ];
      setMessages(initial);
    }
  };

  const PRESETS = [
    "How do I prevent shin splints?",
    "Suggest a gentle calf-stretching routine",
    "Should I run if my shins hurt?"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[450px] page-fade-in text-left">
      
      {/* Sidebar - Context Details */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <h3 className="font-extrabold text-base text-slate-100">Coaching Context</h3>
          </div>
          
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-3 text-xs">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Athlete Profile</span>
              <p className="text-slate-300 font-semibold mt-0.5">{profile?.name || 'Rishit Kapoor'} (Age {profile?.age || 21})</p>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Injuries / Concerns</span>
              <p className="text-red-400 font-semibold mt-0.5 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {profile?.injuries || 'Shin/Calf Pain'}
              </p>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Target Goal</span>
              <p className="text-blue-400 font-semibold mt-0.5">{profile?.goal || 'Fat Loss + Endurance'}</p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Ask Coach Quick Questions</span>
            <div className="flex flex-col gap-1.5">
              {PRESETS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={loading}
                  className="w-full text-left p-3 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-xs rounded-xl border border-slate-850/50 transition-all cursor-pointer font-medium flex items-center gap-2"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{q}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={clearChat}
          className="w-full text-slate-500 hover:text-slate-400 text-xs py-2 border border-slate-800 hover:bg-slate-800/10 rounded-xl transition-all cursor-pointer"
        >
          Reset Chat History
        </button>
      </div>

      {/* Main Chat Panel */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">Coach Gemini</h4>
            <span className="text-[9px] text-green-400 font-semibold block">Online · Active Training Assistant</span>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} page-fade-in`}
            >
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-950 text-slate-200 border border-slate-850 rounded-tl-none space-y-2'
                }`}
              >
                {/* Parse simple markdown headers and bold points for bot text */}
                <span className="block whitespace-pre-wrap">
                  {m.text.split('\n').map((line, lIdx) => {
                    let formattedLine = line;
                    // Bold matcher
                    const boldRegex = /\*\*(.*?)\*\*/g;
                    const parts = [];
                    let lastIndex = 0;
                    let match;

                    while ((match = boldRegex.exec(line)) !== null) {
                      parts.push(line.substring(lastIndex, match.index));
                      parts.push(<strong key={match.index} className="font-extrabold text-white">{match[1]}</strong>);
                      lastIndex = boldRegex.lastIndex;
                    }
                    parts.push(line.substring(lastIndex));

                    return (
                      <span key={lIdx} className="block mt-0.5">
                        {parts.length > 0 ? parts : formattedLine}
                      </span>
                    );
                  })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-950 text-slate-400 border border-slate-850 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" />
                <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-4 bg-slate-950 border-t border-slate-850 flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask your coach anything (e.g. Can you swap squats with a lighter set?)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-blue-500 text-white placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-all shadow-md shadow-blue-600/10 cursor-pointer flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

    </div>
  );
}
