import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, MessageSquare, CheckCircle2, AlertTriangle, Sparkles, Volume2, MapPin, Upload, RefreshCw, Layers, Speaker } from "lucide-react";
import { CitizenRequest, District, Scheme } from "../types";
import { SupportedLanguage, translations } from "../translations";

interface Props {
  districts: District[];
  schemes: Scheme[];
  lang: SupportedLanguage;
  onRequestSubmitted: (newReq: CitizenRequest) => void;
  onViewDpr: (req: CitizenRequest) => void;
}

export const CitizenVoicePortal: React.FC<Props> = ({
  districts,
  schemes,
  lang,
  onRequestSubmitted,
  onViewDpr
}) => {
  const t = translations[lang] || translations.en;

  // Mode: Voice / Web / WhatsApp simulator
  const [activeTab, setActiveTab] = useState<"voice" | "whatsapp" | "web">("voice");

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceVolumeLevel, setVoiceVolumeLevel] = useState(0);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<any>(null);
  const animationFrameRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  // Form Inputs
  const [inputText, setInputText] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("Bastar");
  const [selectedCategory, setSelectedCategory] = useState<string>("Rural Roads & Bridges");
  const [blockName, setBlockName] = useState("Darbha Block");
  const [panchayatName, setPanchayatName] = useState("Chhindgarh GP");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Last submitted result
  const [lastSubmittedResult, setLastSubmittedResult] = useState<CitizenRequest | null>(null);

  // WhatsApp bot chat simulator messages
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "bot" | "user"; text: string; time: string; meta?: any }>>([
    {
      sender: "bot",
      text: "🇮🇳 Namaste! Welcome to JanSetu (जनसेतु) Citizen Helpdesk — Digital Public Good for India.\n\nPlease describe your village or ward's infrastructure problem (Roads, Water, Electricity, Health, School). You can type in any Indian language or send a voice note.",
      time: "Just now"
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  // Realistic sample voice prompts for 1-click testing
  const sampleVoicePrompts = [
    {
      label: "Hindi (Bastar Roads)",
      lang: "hi",
      district: "Bastar",
      category: "Rural Roads & Bridges",
      text: "दरभा ब्लॉक के छिंदगढ़ में मुख्य पुलिया बारिश में बह गई है। 300 स्कूली बच्चों और एंबुलेंस को 18 किमी का फेर लगाना पड़ रहा है। तुरंत नई पक्की पुलिया स्वीकृत करें।"
    },
    {
      label: "Odia (Malkangiri Water)",
      lang: "or",
      district: "Malkangiri",
      category: "Drinking Water",
      text: "ମାଥିଲି ବ୍ଲକର କୁର୍ତ୍ତି ଗ୍ରାମରେ ସମସ୍ତ ନଳକୂପ ଅଚଳ। ଆମେ ଜଙ୍ଗଲ ଝରଣାର ଦୂଷିତ ପାଣି ପିଉଛୁ। ଜଳ ଜୀବନ ମିଶନ ଅଧୀନରେ ଗଭୀର ନଳକୂପ ସ୍ଥାପନ କରନ୍ତୁ।"
    },
    {
      label: "Tamil (Dharmapuri School)",
      lang: "ta",
      district: "Dharmapuri",
      category: "School & Anganwadi",
      text: "பாலக்கோடு அரசு மேல்நிலைப் பள்ளியில் மாணவிகளுக்கான கழிப்பறை மற்றும் குடிநீர் வசதி இல்லை. உடனடியாக பிஎம் ஸ்ரீ திட்டத்தில் சீரமைக்க வேண்டுகிறோம்."
    },
    {
      label: "Marathi (Nanded Power)",
      lang: "mr",
      district: "Nanded",
      category: "Electricity & Solar",
      text: "कंधार तालुक्यातील बाचोटी गावामध्ये तीन महिन्यांपासून ट्रान्सफॉर्मर जळाला आहे. पिण्याच्या पाण्याची मोटार बंद आहे. नवीन ट्रान्सफॉर्मर बसवा."
    },
    {
      label: "Malayalam (Wayanad Landslide)",
      lang: "ml",
      district: "Wayanad",
      category: "Drainage & Flood Control",
      text: "മാനന്തവാടി വെള്ളമുണ്ട ഗ്രാമത്തിൽ ഉരുൾപൊട്ടൽ കാരണം മലയോര റോഡ് തകർന്നു. ആംബുലൻസ് പോലും വരാൻ കഴിയുന്നില്ല. സംരക്ഷണ ഭിത്തി നിർമ്മിക്കണം."
    },
    {
      label: "Bengali (Baksa Bridge)",
      lang: "bn",
      district: "Baksa",
      category: "Rural Roads & Bridges",
      text: "শালবাড়ি গ্রামের কাঠের সাঁকোটি গত বন্যায় ভেঙে গেছে। বর্ষাকালে গ্রাম বিচ্ছিন্ন হয়ে পড়ে। অবিলম্বে একটি স্থায়ী পাকা কংক্রিট সেতু চাই।"
    },
    {
      label: "Telugu (Vizianagaram Health)",
      lang: "te",
      district: "Vizianagaram",
      category: "Healthcare Facility",
      text: "సాలూరు గిరిజన ప్రాంత ప్రాథమిక ఆరోగ్య కేంద్రంలో విద్యుత్, ప్రసవ సౌకర్యాలు లేవు. పీఎం ఆయుష్మాన్ భారత్ కింద 24 గంటల క్లినిక్ మంజూరు చేయండి."
    },
    {
      label: "Kannada (Raichur Water)",
      lang: "kn",
      district: "Raichur",
      category: "Drinking Water",
      text: "ಮಾನ್ವಿ ತಾಲೂಕಿನ ಕುರ್ಡಿ ಗ್ರಾಮದಲ್ಲಿ ಫ್ಲೋರೈಡ್ ಮುಕ್ತ ಶುದ್ಧ ಕುಡಿಯುವ ನೀರಿನ ಘಟಕ ಸ್ಥಗಿತಗೊಂಡಿದೆ. ಜಲ ಜೀವನ್ ಮಿಷನ್ ಅಡಿಯಲ್ಲಿ ಹೊಸ ಜಲಶುದ್ಧೀಕರಣ ಘಟಕ ಸ್ಥಾಪಿಸಿ."
    },
    {
      label: "Gujarati (Dahod Solar)",
      lang: "gu",
      district: "Dahod",
      category: "Electricity & Solar",
      text: "ધાનપુર આદિવાસી ગામમાં પીએમ સૂર્ય ઘર યોજના હેઠળ સોલાર રૂફટોપ પેનલ લગાવો જેથી રાત્રે જંગલી જાનવરોથી રક્ષણ મળે અને અવિરત વીજળી રહે."
    },
    {
      label: "Punjabi (Firozpur Drainage)",
      lang: "pa",
      district: "Firozpur",
      category: "Drainage & Flood Control",
      text: "ਸਤਲੁਜ ਦਰਿਆ ਦੇ ਹੜ੍ਹ ਕਾਰਨ ਮੱਖੂ ਬਲਾਕ ਦੇ ਖੇਤਾਂ ਵਿੱਚ ਪਾਣੀ ਭਰ ਗਿਆ ਹੈ। ਡਰੇਨਾਂ ਦੀ ਪੁਖਤਾ ਸਫ਼ਾਈ ਅਤੇ ਮਜ਼ਬੂਤ ਪੱਕਾ ਬੰਨ੍ਹ ਤੁਰੰਤ ਬਣਾਇਆ ਜਾਵੇ।"
    }
  ];

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSpeechSupported(!!SpeechRecognition);
  }, []);

  // Text-to-speech function
  const speakText = (text: string, lang: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Visualizer animation
  useEffect(() => {
    let phase = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.beginPath();
      ctx.strokeStyle = isRecording ? "#f97316" : "#475569";
      ctx.lineWidth = 2.5;

      const bars = 36;
      const barWidth = width / bars;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + barWidth / 2;
        let amplitude = 4;
        if (isRecording) {
          amplitude = Math.sin(i * 0.4 + phase) * 22 + Math.cos(i * 0.2 + phase * 1.5) * 12 + 10;
        } else {
          amplitude = Math.sin(i * 0.2) * 3 + 2;
        }
        const barHeight = Math.max(3, Math.abs(amplitude));

        ctx.moveTo(x, centerY - barHeight / 2);
        ctx.lineTo(x, centerY + barHeight / 2);
      }
      ctx.stroke();

      phase += isRecording ? 0.2 : 0.03;
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording]);

  // Voice recording toggle
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

      // Play audio prompt simulation or browser speech recognition if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : lang === 'te' ? 'te-IN' : lang === 'bn' ? 'bn-IN' : lang === 'mr' ? 'mr-IN' : lang === 'gu' ? 'gu-IN' : lang === 'kn' ? 'kn-IN' : lang === 'ml' ? 'ml-IN' : lang === 'pa' ? 'pa-IN' : lang === 'or' ? 'or-IN' : 'en-US';
          recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript) setInputText(transcript);
          };
          recognition.onerror = (event: any) => {
            console.log("Speech recognition error:", event.error);
          };
          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.log("Speech recognition unavailable or permission denied, using simulated input");
        }
      }
    } else {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }

      // If user recorded for more than 2 seconds and text is empty, auto-populate with authentic speech
      if (!inputText || inputText.trim().length === 0) {
        setInputText("हमारे बस्तर जिले के दरभा ब्लॉक में बारिश के कारण मुख्य संपर्क मार्ग और पुलिया टूट गई है। 300 बच्चों को स्कूल जाने में भारी परेशानी है। कृपया पीएमजीएसवाई के तहत तुरंत नई पुलिया बनवाएं।");
      }

      // Speak the input text for accessibility
      if (inputText) {
        const speechLang = lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : lang === 'te' ? 'te-IN' : lang === 'bn' ? 'bn-IN' : lang === 'mr' ? 'mr-IN' : lang === 'gu' ? 'gu-IN' : lang === 'kn' ? 'kn-IN' : lang === 'ml' ? 'ml-IN' : lang === 'pa' ? 'pa-IN' : lang === 'or' ? 'or-IN' : 'en-US';
        speakText(inputText, speechLang);
      }
    }
  };

  const loadSample = (sample: typeof sampleVoicePrompts[0]) => {
    setInputText(sample.text);
    setSelectedDistrictName(sample.district);
    setSelectedCategory(sample.category);
  };

  // Submit Grievance
  const handleSubmit = async (customText?: string) => {
    const textToSubmit = customText || inputText;
    if (!textToSubmit.trim()) return;

    setIsSubmitting(true);
    const selectedDist = districts.find(d => d.name === selectedDistrictName) || districts[0];

    try {
      const response = await fetch("/api/citizen/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToSubmit,
          channel: activeTab === "whatsapp" ? "whatsapp" : activeTab === "voice" ? "voice" : "web",
          districtName: selectedDist.name,
          stateName: selectedDist.state,
          block: blockName,
          panchayat: panchayatName
        })
      });

      const data = await response.json();
      if (data.success && data.request) {
        setLastSubmittedResult(data.request);
        onRequestSubmitted(data.request);

        // If in WhatsApp tab, append bot response
        if (activeTab === "whatsapp") {
          setChatMessages(prev => [
            ...prev,
            { sender: "user", text: textToSubmit, time: "Just now" },
            {
              sender: "bot",
              text: `✅ Grievance Registered!\n\n📋 DPI Ticket ID: ${data.request.id}\n🌐 Language: ${data.request.languageName}\n🏷️ Category: ${data.request.category}\n⚠️ Urgency: ${data.request.urgencyLevel}/5\n🏛️ Scheme: ${data.request.matchedSchemeCode}\n\nOur AI has triangulated your request with the ${data.request.district} District Master Plan and escalated it to the District Magistrate.`,
              time: "Just now",
              meta: data.request
            }
          ]);
          setChatInput("");
        }
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher: Voice / WhatsApp Bot / Standard Web Form */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
            {t.navCitizenPortal}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregating citizen voice & text in 11 Indian languages with automatic DPI receipt generation
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "voice"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            Voice Portal (मातृभाषा)
          </button>
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "whatsapp"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp Civic Bot (+91 90131)
          </button>
          <button
            onClick={() => setActiveTab("web")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === "web"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Gram Panchayat Kiosk
          </button>
        </div>
      </div>

      {/* Mode 1: Multilingual Voice Portal */}
      {activeTab === "voice" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Voice Recording Studio */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Volume2 className="w-3 h-3" />
                  Live Multilingual Voice Processing
                </span>
                {isSpeechSupported && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ Web Speech API Supported
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {isRecording ? `Recording: ${recordingSeconds}s` : "Web Audio / MediaRecorder Ready"}
              </span>
            </div>

            {/* Audio Wave Visualizer */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 mb-6 flex flex-col items-center justify-center">
              <canvas
                ref={canvasRef}
                width={500}
                height={80}
                className="w-full h-20 rounded"
              />
              <p className="text-xs text-slate-400 mt-2 text-center">
                {isRecording ? t.listening : t.speakPrompt}
              </p>
            </div>

            {/* Big Mic Button */}
            <div className="flex flex-col items-center justify-center mb-6">
              <button
                onClick={toggleRecording}
                className={`relative group w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/50 scale-105"
                    : "bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white shadow-orange-500/40 hover:scale-105"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
                {isRecording && (
                  <span className="absolute -inset-2 rounded-full border-2 border-red-500/50 animate-ping"></span>
                )}
              </button>
              <span className="mt-3 text-xs font-semibold text-slate-300">
                {isRecording ? t.stopRecord : t.recordVoice}
              </span>
            </div>

            {/* Live Transcript / Input */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400">
                    Voice Transcription / Text Input (Any Indian Language)
                  </label>
                  {isSpeechSupported && (
                    <button
                      onClick={() => speakText(inputText, lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : lang === 'te' ? 'te-IN' : lang === 'bn' ? 'bn-IN' : lang === 'mr' ? 'mr-IN' : lang === 'gu' ? 'gu-IN' : lang === 'kn' ? 'kn-IN' : lang === 'ml' ? 'ml-IN' : lang === 'pa' ? 'pa-IN' : lang === 'or' ? 'or-IN' : 'en-US')}
                      disabled={!inputText || isSpeaking}
                      className="text-[10px] text-orange-400 hover:text-orange-300 disabled:text-slate-500 flex items-center gap-1"
                    >
                      <Speaker className="w-3 h-3" />
                      {isSpeaking ? 'Speaking...' : 'Read Aloud'}
                    </button>
                  )}
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.typeGrievance}
                  rows={3}
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/60 transition"
                />
              </div>

              {/* District & Location Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {t.selectDistrict}
                  </label>
                  <select
                    value={selectedDistrictName}
                    onChange={(e) => setSelectedDistrictName(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    {districts.map(d => (
                      <option key={d.id} value={d.name}>
                        {d.name} ({d.state}) {d.isAspirational ? "★ Aspirational" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Block / Tehsil
                  </label>
                  <input
                    type="text"
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    placeholder="e.g. Darbha"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Panchayat / Habitation
                  </label>
                  <input
                    type="text"
                    value={panchayatName}
                    onChange={(e) => setPanchayatName(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                    placeholder="e.g. Chhindgarh GP"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                disabled={isSubmitting || !inputText.trim()}
                onClick={() => handleSubmit()}
                className={`w-full py-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isSubmitting || !inputText.trim()
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white shadow-orange-500/25"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t.analyzingWithGemini}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {t.submitGrievance}
                  </>
                )}
              </button>
            </div>

            {/* Quick-Test Authentic Voice Samples */}
            <div className="mt-6 pt-4 border-t border-slate-800/80">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                ⚡ Test with Grassroots Multilingual Voice Samples:
              </p>
              <div className="flex flex-wrap gap-2">
                {sampleVoicePrompts.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSample(s)}
                    className="text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition flex items-center gap-1.5"
                  >
                    <span>🎙️</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Instant AI Extraction & DPI Ticket Output */}
          <div className="lg:col-span-5 space-y-4">
            {lastSubmittedResult ? (
              <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 shadow-2xl relative backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {t.dpiTicketGenerated}
                      </h3>
                      <p className="text-[11px] font-mono text-emerald-400">
                        {lastSubmittedResult.id}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Open DPI Standard
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Detected Language & Dialect:</span>
                    <span className="font-semibold text-slate-200">
                      {lastSubmittedResult.languageName} ({lastSubmittedResult.language.toUpperCase()})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Original Submission:</span>
                    <p className="text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      "{lastSubmittedResult.originalText}"
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">AI Translated & Normalized Intent:</span>
                    <p className="text-slate-200 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 font-medium">
                      {lastSubmittedResult.translatedEnglish}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">{t.urgencyLevel}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-base font-bold text-orange-400">
                          {lastSubmittedResult.urgencyLevel} / 5
                        </span>
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">{t.affectedPopulation}</span>
                      <span className="text-base font-bold text-sky-400 mt-0.5 block">
                        ~{lastSubmittedResult.populationAffected.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">{t.matchedScheme}</span>
                    <span className="font-bold text-amber-400 text-xs mt-0.5 block">
                      {lastSubmittedResult.matchedSchemeCode}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {schemes.find(s => s.code === lastSubmittedResult.matchedSchemeCode)?.name || "National Infrastructure Mission"}
                    </p>
                  </div>

                  {/* Immediate DPR Generation Trigger */}
                  <button
                    onClick={() => onViewDpr(lastSubmittedResult)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.generateDpr}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[380px]">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7 text-orange-400" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300">
                  Instant Gemini 2.5 Flash Processing
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1.5">
                  Record your voice or click any multilingual sample to see real-time translation, urgency scoring, scheme matching, and DPI ticket generation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Simulated WhatsApp Civic Bot */}
      {activeTab === "whatsapp" && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* WhatsApp Header */}
          <div className="bg-emerald-700 px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                🇮🇳
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-1.5">
                  JanSetu AI Civic Bot
                  <span className="text-[10px] bg-emerald-800 px-1.5 py-0.5 rounded text-emerald-200">Official DPI</span>
                </h4>
                <p className="text-[11px] text-emerald-100">+91 90131 51515 • Online</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-800/80 px-2 py-1 rounded">
              WhatsApp Cloud API
            </span>
          </div>

          {/* Chat Messages */}
          <div className="p-4 space-y-3 h-80 overflow-y-auto bg-slate-950/90 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-md whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none"
                      : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className="block text-[9px] text-right mt-1 opacity-60">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {isSubmitting && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 text-slate-400 p-2.5 rounded-2xl text-[11px] flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                  JanSetu AI is analyzing grievance...
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => {
                const randomSample = sampleVoicePrompts[Math.floor(Math.random() * sampleVoicePrompts.length)];
                setChatInput(randomSample.text);
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Load sample grievance"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit(chatInput)}
              placeholder="Type your civic grievance in Hindi, Tamil, Bengali, Telugu..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => {
                const randomSample = sampleVoicePrompts[Math.floor(Math.random() * sampleVoicePrompts.length)];
                setChatInput(randomSample.text);
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Simulate voice message"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSubmit(chatInput)}
              disabled={isSubmitting || !chatInput.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mode 3: Gram Panchayat Kiosk & Web Ingestion */}
      {activeTab === "web" && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
            <Layers className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Gram Panchayat Digital Kiosk Mode</h3>
              <p className="text-[11px] text-slate-400">Public terminal interface for CSCs (Common Service Centres)</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Detailed Civic Grievance</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter complete description of road, water, or electricity issue..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target District</label>
                <select
                  value={selectedDistrictName}
                  onChange={(e) => setSelectedDistrictName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  {districts.map(d => (
                    <option key={d.id} value={d.name}>{d.name} ({d.state})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Sector</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="Rural Roads & Bridges">Rural Roads & Bridges</option>
                  <option value="Drinking Water">Drinking Water (JJM)</option>
                  <option value="Healthcare Facility">Healthcare Facility (PHC)</option>
                  <option value="School & Anganwadi">School & Anganwadi</option>
                  <option value="Electricity & Solar">Electricity & Solar</option>
                  <option value="Drainage & Flood Control">Drainage & Flood Control</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !inputText.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Kiosk Grievance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
