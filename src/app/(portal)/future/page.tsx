'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Mic, 
  Camera, 
  Apple, 
  Truck, 
  Send,
  Play,
  CheckCircle,
  Plus
} from 'lucide-react';

export default function FutureEnhancementsPage() {
  const [activeTab, setActiveTab] = useState<'chatbot' | 'voice' | 'image' | 'nutrition' | 'delivery'>('chatbot');
  
  // AI Chatbot State Mock
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'chef', text: 'Hello! I am your AI Chef Assistant. Tell me what ingredients you have, and I will create custom recipe steps for you!' }
  ]);

  // Voice Assistant Mock State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceText, setVoiceText] = useState('Click the mic and say: "Suggest a quick vegetarian dinner for tonight"');

  // Image Upload Mock State
  const [ingredientsDetected, setIngredientsDetected] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Grocery Delivery Mock State
  const [cartSent, setCartSent] = useState(false);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages([...chatMessages, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let reply = "That sounds delicious! You can make a custom stir fry using those ingredients. Would you like me to generate step-by-step instructions?";
      if (userMsg.toLowerCase().includes('paneer')) {
        reply = "Great choice! Since you have paneer, I suggest making a quick Paneer Bhurji. It takes only 15 minutes. Just sauté onions, tomatoes, and crumbled paneer with spices!";
      } else if (userMsg.toLowerCase().includes('egg')) {
        reply = "With eggs, you can make a classic French Omelette or Egg Fried Rice. Let me know which one you prefer!";
      }
      setChatMessages(prev => [...prev, { sender: 'chef', text: reply }]);
    }, 1000);
  };

  const handleVoiceTrigger = () => {
    setIsRecording(true);
    setVoiceText('Listening to voice input...');
    setTimeout(() => {
      setIsRecording(false);
      setVoiceText('Transcribed: "Add Paneer and Onion to my pantry list"');
    }, 3000);
  };

  const handleMockImageUpload = () => {
    setIsAnalyzing(true);
    setIngredientsDetected([]);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIngredientsDetected(['Paneer', 'Tomato', 'Onion', 'Green Chillies']);
    }, 2500);
  };

  const handleSendToDelivery = () => {
    setCartSent(true);
    setTimeout(() => setCartSent(false), 4000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Sparkles style={{ color: 'var(--primary)' }} />
          Appendix K: Future Enhancements
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Explore interactive prototypes of upcoming features, showing next-generation system integrations.
        </p>
      </div>

      {/* Tabs Menu */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'chatbot', label: 'AI Chef Chatbot', icon: MessageSquare },
          { id: 'voice', label: 'Voice Assistant', icon: Mic },
          { id: 'image', label: 'Fridge Scanner', icon: Camera },
          { id: 'nutrition', label: 'Macros Tracker', icon: Apple },
          { id: 'delivery', label: 'Grocery Delivery', icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.25rem',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 400,
                transition: 'var(--transition-fast)',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Prototype Canvas */}
      <div className="card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '2.5rem' }}>
        
        {/* TAB 1: AI Chatbot */}
        {activeTab === 'chatbot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Interactive AI Culinary Assistant</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Conversational cooking advice, ingredient substitutions, and instant recipe steps generator.
              </p>
            </div>

            {/* Chat Box */}
            <div style={{
              flex: 1,
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '350px',
              overflowY: 'auto'
            }}>
              {chatMessages.map((m, idx) => (
                <div key={idx} style={{
                  alignSelf: m.sender === 'chef' ? 'flex-start' : 'flex-end',
                  backgroundColor: m.sender === 'chef' ? 'rgba(255,255,255,0.03)' : 'var(--primary)',
                  border: m.sender === 'chef' ? '1px solid var(--border-color)' : 'none',
                  color: '#fff',
                  padding: '0.8rem 1.2rem',
                  borderRadius: '15px',
                  maxWidth: '75%',
                  fontSize: '0.9rem',
                  lineHeight: 1.4
                }}>
                  {m.text}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Ask Chef: 'I have eggs and cheese, what can I make?'..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Voice Assistant */}
        {activeTab === 'voice' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '2rem', flex: 1 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Voice-Activated Cooking Companion</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Hands-free portal interaction. Dictate pantry items and trigger calendar plans while cooking.
              </p>
            </div>

            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isRecording && (
                <div style={{
                  position: 'absolute',
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 71, 111, 0.15)',
                  animation: 'pulse 1.5s infinite'
                }} />
              )}
              <button 
                onClick={handleVoiceTrigger}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: isRecording ? 'var(--error)' : 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 25px rgba(255, 90, 54, 0.3)',
                  zIndex: 2,
                  transition: 'var(--transition-fast)'
                }}
              >
                <Mic size={32} className={isRecording ? 'animate-bounce' : ''} />
              </button>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              padding: '1rem 2rem',
              borderRadius: '30px',
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              maxWidth: '500px'
            }}>
              {voiceText}
            </div>
          </div>
        )}

        {/* TAB 3: Fridge Scanner (Image Recognition) */}
        {activeTab === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>AI Fridge Scanner</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Upload snapshots of your refrigerator or pantry shelves. The AI automatically parses vegetables, dairy products, and meats, adding them to your virtual pantry.
              </p>
            </div>

            <div 
              onClick={handleMockImageUpload}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '3rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'rgba(255,255,255,0.01)',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <Camera size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <p style={{ fontWeight: 600 }}>Click here to simulate uploading a photo of your fridge</p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Supports JPG, PNG (Simulates shelf item extraction)</span>
            </div>

            {isAnalyzing && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ marginBottom: '0.5rem' }} />
                <span>Running neural network classification models...</span>
              </div>
            )}

            {ingredientsDetected.length > 0 && (
              <div style={{
                backgroundColor: 'rgba(6, 214, 160, 0.08)',
                border: '1px solid var(--success)',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={14} />
                  Classification Successful (4 items detected):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {ingredientsDetected.map((ing) => (
                    <span key={ing} className="badge badge-success" style={{ fontSize: '0.8rem' }}>
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Nutrition Dashboard */}
        {activeTab === 'nutrition' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Personalized Nutrition Tracker</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Track calories, protein targets, carbs, and fat splits calculated automatically from your scheduled meals.
              </p>
            </div>

            {/* Macros Breakdown cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Calories Intake', current: 1850, goal: 2200, color: 'var(--primary)', unit: 'kcal' },
                { label: 'Protein Target', current: 68, goal: 85, color: 'var(--secondary)', unit: 'g' },
                { label: 'Carbs Limit', current: 195, goal: 250, color: 'var(--warning)', unit: 'g' },
                { label: 'Fat Limit', current: 52, goal: 70, color: 'var(--success)', unit: 'g' },
              ].map((macro) => {
                const percent = Math.round((macro.current / macro.goal) * 100);
                return (
                  <div key={macro.label} style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px'
                  }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{macro.label}</span>
                    <h4 style={{ fontSize: '1.4rem', margin: '0.25rem 0' }}>
                      {macro.current} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {macro.goal} {macro.unit}</span>
                    </h4>
                    {/* Bar */}
                    <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${percent}%`,
                        backgroundColor: macro.color,
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                      {percent}% of daily goal met
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: Grocery Delivery */}
        {activeTab === 'delivery' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Direct Grocery Checkout Integration</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Export your finalized recipe ingredients list straight to popular local delivery carts (Instacart, Amazon Fresh, Blinkit, and BigBasket) with one click.
              </p>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <h4 style={{ fontSize: '1.1rem' }}>Active Shopping List: 12 Items pending checkout</h4>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', margin: '0.5rem 0' }}>
                {['Instacart', 'Amazon Fresh', 'Blinkit', 'BigBasket'].map((provider) => (
                  <button 
                    key={provider}
                    onClick={handleSendToDelivery}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.8rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <Plus size={14} />
                    <span>Send to {provider}</span>
                  </button>
                ))}
              </div>

              {cartSent && (
                <div style={{
                  color: 'var(--success)',
                  backgroundColor: 'rgba(6, 214, 160, 0.1)',
                  border: '1px solid var(--success)',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '30px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  animation: 'scale-up 0.2s ease-out'
                }}>
                  <CheckCircle size={16} />
                  <span>Cart exported! Open your delivery provider app to verify and checkout.</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
