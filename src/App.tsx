import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Sparkles, 
  Mic, 
  Volume2, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Copy, 
  Languages, 
  Headphones, 
  Check, 
  Loader2, 
  History, 
  FileText, 
  Clock, 
  VolumeX, 
  Wand2 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AdScript, GeneratedVoice, VoiceSpeaker } from "./types";

// Static Speaker configurations
const SPEAKERS: VoiceSpeaker[] = [
  {
    id: "Kore",
    name: "Kore",
    gender: "Ayol",
    description: "Yumshoq, iliq va jozibador ovoz. Go'zallik, moda, ta'lim, estetika yoki silliq hikoyalar uchun qulay.",
    enDescription: "Soft, warm, and highly charming voice. Perfect for cosmetics, lifestyle brand campaigns.",
    bestSuited: "Go'zallik, Moda, Ta'lim ssenariylari",
    accent: "Muloyim & Melodik"
  },
  {
    id: "Zephyr",
    name: "Zephyr",
    gender: "Erkak",
    description: "Professional, rasmiy va ishonchli ovoz. Korporativ videoroliklar, yangiliklar, bank, IT va jiddiy reklama e'lonlari uchun.",
    enDescription: "Professional, authoritative, and trustworthy tone. Best for corporate, technology, banking ads.",
    bestSuited: "Korporativ & Texnik reklama",
    accent: "Ishonchli & Ravon"
  },
  {
    id: "Puck",
    name: "Puck",
    gender: "Ayol",
    description: "Quvnoq, samimiy, dadil va g'ayratli ovoz. Kafe, do'konlar sotuvi, bolalar mahsulotlari va bayram aksiyalari uchun.",
    enDescription: "Joyful, friendly, bold and highly energetic. Perfect for retail sales, events, and festival promos.",
    bestSuited: "Tezkor aksiyalar & Do'konlar",
    accent: "Jonli & Sho'x"
  },
  {
    id: "Fenrir",
    name: "Fenrir",
    gender: "Erkak",
    description: "Dovur va dadil, jiddiy, chuqur va mustahkam ovoz. Avtomobillar, sport, fitness va tezkor chaqiruv e'lonlari uchun.",
    enDescription: "Bold, serious, deep and robust tone. Excellent for automotive, sports, active promotions.",
    bestSuited: "Avtosalonlar & Sport",
    accent: "Qat'iy & Kuchli"
  },
  {
    id: "Charon",
    name: "Charon",
    gender: "Erkak",
    description: "Vazmin, nufuzli va chuqur erkaklar ovozi. Premium brend e'lonlari, ko'chmas mulk va tarixiy loyihalar uchun ideal.",
    enDescription: "Classy, slow-paced, atmospheric and authoritative. Great for premium real estate or luxury brands.",
    bestSuited: "Premium brendlar & Rieltorlik",
    accent: "Vazmin & Nufuzli"
  }
];

// Presets for Uzbek advertisement templates to help user fill immediately
const UZBEK_PHRASES = [
  { label: "🔥 Shoshiling!", text: "Shoshiling! Mahsulotlar soni juda cheklangan! Hoziroq qo'ng'iroq qiling!" },
  { label: "⚡ Chegirmalar", text: "Katta bahoriy chegirmalar boshlandi! Barcha tovarlarga ellik foizgacha chegirgma!" },
  { label: "📞 Aloqa", text: "Batafsil ma'lumot olish uchun quyidagi raqamga bog'laning, yoki saytimizga tashrif buyuring." },
  { label: "🏆 Kafolat", text: "Biz mahsulotimizning 100 foizlik sifatiga to'liq kafolat beramiz." },
  { label: "📍 Manzil", text: "Bizning manzilimiz: Toshkent shahri, Amir Temur ko'chasi, o'n birinchi uy." }
];

// Tone pre-sets for instructions
const TONE_PRESETS = [
  { value: "Confident, urgent with high commercial appeal", label: "Tijoriy & Hayajonli (Urgent & Commercial)" },
  { value: "Warm, inviting, friendly, trustful and smiling tone", label: "Do'stona & Iliq (Warm & Trustworthy)" },
  { value: "Highly professional, serious, corporate broadcasting style", label: "Jiddiy & Rasmiy (Serious & Corporate)" },
  { value: "Deep, luxurious, slow, elite sound narrative", label: "Premium & Hashamatli (Luxury & Calm)" },
  { value: "Energetic, dynamic, loud, selling directly to younger audiences", label: "Dinamik & Yoshlarbop (Energetic & Youthful)" }
];

export default function App() {
  // TTS State
  const [ttsText, setTtsText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("Kore");
  const [selectedTone, setSelectedTone] = useState("Confident, urgent with high commercial appeal");
  const [customTone, setCustomTone] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  // Active playing audio state
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Copywriting generator states
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [adTone, setAdTone] = useState("Ishonchli va jozibador");
  const [extraNotes, setExtraNotes] = useState("");
  const [languageRule, setLanguageRule] = useState<"latin" | "cyrillic">("latin");
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [generatedScripts, setGeneratedScripts] = useState<AdScript[]>([]);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [selectedScriptIndex, setSelectedScriptIndex] = useState<number | null>(null);

  // Audio history / library states
  const [historyList, setHistoryList] = useState<GeneratedVoice[]>([]);
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);

  // Audio duration / playback status trackers (manual progress bar)
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Load history from localstorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("uzbek_tts_ad_history");
      if (stored) {
        setHistoryList(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to retrieve stored voice library", e);
    }
  }, []);

  // Save history to localstorage
  const saveHistoryList = (newList: GeneratedVoice[]) => {
    setHistoryList(newList);
    try {
      localStorage.setItem("uzbek_tts_ad_history", JSON.stringify(newList));
    } catch (e) {
      console.warn("Failed to store voice library to localStorage", e);
    }
  };

  // Setup sample text on first load if empty
  useEffect(() => {
    if (!ttsText) {
      setTtsText("Diqqat xonimlar va janoblar! Biz sizga eng yangi va unutilmas mahsulotlarimizni taqdim etishda davom etamiz. Sifat va ishonch - bizning bosh shiorimiz! Hoziroq bog'laning!");
    }
  }, []);

  // Playback handlers
  useEffect(() => {
    const audio = audioPlayerRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  // Adjust playback speed
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, audioUrl]);

  const togglePlay = () => {
    const audio = audioPlayerRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Audio playback interrupted", err);
      });
    }
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  // Format seconds to legible clock format (mm:ss)
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
  };

  // Quick preset inserts
  const insertPreset = (phraseText: string) => {
    setTtsText((prev) => {
      const separator = prev.endsWith(" ") || prev === "" ? "" : " ";
      return prev + separator + phraseText;
    });
  };

  // Generate Ad scripts via server-side Gemini API
  const generateAdScripts = async () => {
    if (!productName.trim()) {
      setCopyError("Iltimos, avval mahsulot yoki xizmat nomini kiriting.");
      return;
    }

    setIsGeneratingCopy(true);
    setCopyError(null);
    setSelectedScriptIndex(null);

    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: productName,
          audience: targetAudience,
          tone: adTone,
          extraNotes: extraNotes,
          languageRule: languageRule
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Server xatoligi");
      }

      setGeneratedScripts(data.scripts || []);
    } catch (err: any) {
      console.error(err);
      setCopyError(err.message || "Ssenariyni yaratib bo'lmadi. Internet tarmoq yoki sozlamalarni tekshiring.");
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Run Text to Speech Synthesis
  const handleSynthesize = async () => {
    if (!ttsText.trim()) {
      setTtsError("Iltimos, ovozlashtirish uchun o'zbekcha matn kiriting.");
      return;
    }

    setIsSynthesizing(true);
    setTtsError(null);

    const activeToneInstruction = customTone.trim() !== "" ? customTone : selectedTone;

    try {
      const res = await fetch("/api/generate-tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ttsText,
          voice: selectedVoice,
          toneInstructions: activeToneInstruction
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "TTS synthesis error on backend");
      }

      // Play and configure
      setAudioUrl(data.audioUrl);
      setCurrentTime(0);
      setIsPlaying(false);

      // Auto play generated voiceover
      setTimeout(() => {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.load();
          audioPlayerRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(err => console.log("Auto-playing voice failed", err));
        }
      }, 300);

      // Add to Library history
      const newVoiceRecord: GeneratedVoice = {
        id: "v_" + Date.now(),
        title: ttsText.slice(0, 32).trim() + (ttsText.length > 32 ? "..." : ""),
        text: ttsText,
        voiceName: selectedVoice,
        tone: activeToneInstruction,
        audioUrl: data.audioUrl,
        durationEst: data.durationEst || 0,
        createdAt: new Date().toLocaleString("uz-UZ", { hour12: false })
      };

      saveHistoryList([newVoiceRecord, ...historyList]);

    } catch (err: any) {
      console.error(err);
      setTtsError(err.message || "Audioni shakllantirishda xatolik yuz berdi. Gemini audio quvvati sozlamalariga e'tibor qarating.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Load a voice from history list to active play or text workspace
  const loadHistoryItemToPlayer = (item: GeneratedVoice) => {
    setAudioUrl(item.audioUrl);
    setTtsText(item.text);
    setSelectedVoice(item.voiceName);
    setIsPlaying(false);
    setCurrentTime(0);

    // Auto-load and play
    setTimeout(() => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.load();
        audioPlayerRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.log("History play failed", err));
      }
    }, 200);
  };

  // Delete from history
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyList.filter(item => item.id !== id);
    saveHistoryList(updated);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedId(id);
    setTimeout(() => setIsCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 flex flex-col font-sans selection:bg-[#C5A368] selection:text-black" id="studio-root">
      {/* Hidden native player */}
      {audioUrl && (
        <audio ref={audioPlayerRef}>
          <source src={audioUrl} type="audio/wav" />
        </audio>
      )}

      {/* Header Deck */}
      <header className="border-b border-white/5 bg-[#0F0F11] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4" id="header-deck">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-tr from-[#C5A368] to-[#927139] rounded-sm rotate-45 flex items-center justify-center shadow-lg shadow-[#C5A368]/15">
            <Mic className="h-4 w-4 text-black -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-medium tracking-tight text-[#E5E5E5]">
                OVOZ<span className="text-[#C5A368] font-bold">PRO</span>
              </h1>
              <span className="bg-amber-950/40 text-[#C5A368] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#C5A368]/30 uppercase tracking-widest">
                Professional Uzbek TTS
              </span>
            </div>
            <p className="text-[11px] text-gray-500 font-serif">Commercial ads and broadcast voiceover studio</p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs bg-[#141417] p-2 rounded-lg border border-white/5 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A368] animate-ping"></span>
          <span className="text-gray-400 uppercase tracking-wider text-[10px]">Studio Engine: Online</span>
          <span className="text-white/10">|</span>
          <span className="text-gray-500 text-[10px]">Gemini-3.1-flash-tts</span>
        </div>
      </header>

      {/* Workspace Grid */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: AI Copywriting script builder - spans 5 columns */}
        <section className="lg:col-span-5 bg-[#141417] rounded-xl border border-white/5 p-5 shadow-2xl flex flex-col gap-5 self-stretch" id="copywriting-section">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#C5A368]" />
              <h2 className="text-sm font-semibold text-[#E5E5E5] tracking-tight">AI Kopirayter (Ssenariy Yarmarkasi)</h2>
            </div>
            <span className="text-[10px] text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-white/5 font-mono">Flash-3.5</span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed font-serif">
            O'zbek tilida reklama, e'lon va radio/TV tijoriy rolik ssenariylarini professional darajada avtomatlashtirilgan holda generatsiya qiling.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Product input */}
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider font-mono">
                  Mahsulot, Xizmat yoki Brendingiz nomi <span className="text-[#C5A368]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masalan: 'Toshkent Motors' avtosaloni"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#C5A368]/30 transition-colors placeholder:text-gray-700 font-medium"
                />
              </div>

              {/* Audience */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider font-mono">
                  Maqsadli Auditoriya
                </label>
                <input
                  type="text"
                  placeholder="Masalan: Yosh haydovchilar"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#C5A368]/30 transition-colors placeholder:text-gray-700"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider font-mono">
                  Ssenariy Ohangi (Tone)
                </label>
                <select
                  value={adTone}
                  onChange={(e) => setAdTone(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-[#C5A368]/30 transition-colors cursor-pointer"
                >
                  <option value="Ishonchli va jozibador">Ishonchli va jozibador</option>
                  <option value="Shoshilinch va jo'shqin">Shoshilinch (Chegirmalar uchun)</option>
                  <option value="Sokin va premium brend">Sokin va obro'li (Luxury)</option>
                  <option value="Quvnoq va do'stona">Quvnoq va do'stona (Yengil)</option>
                  <option value="Hissiyotga boy va ta'sirchan">Ta'sirchan (Ijtimoiy xabarlar)</option>
                </select>
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider font-mono">
                Qo'shimcha tafsilotlar yoki chegirmalar (Optional)
              </label>
              <textarea
                placeholder="Masalan: 'Barcha avtomobillarga 10% chegirma, Amir Temur ko'chasi, 22-uy.'"
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                rows={2}
                className="w-full bg-[#0A0A0B] border border-white/5 rounded-lg p-2.5 text-sm text-gray-200 outline-none focus:border-[#C5A368]/30 transition-colors placeholder:text-gray-700 resize-none"
              />
            </div>

            {/* Alphabet policy select */}
            <div className="flex items-center gap-4 bg-[#0A0A0B]/60 p-2.5 rounded-lg border border-white/5">
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-[#C5A368]" />
                Yozuv Alifbosi:
              </span>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="languageRule"
                    checked={languageRule === "latin"}
                    onChange={() => setLanguageRule("latin")}
                    className="accent-[#C5A368]"
                  />
                  Lotin (Latin)
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="radio"
                    name="languageRule"
                    checked={languageRule === "cyrillic"}
                    onChange={() => setLanguageRule("cyrillic")}
                    className="accent-[#C5A368]"
                  />
                  Kirill (Cyrillic)
                </label>
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={generateAdScripts}
              disabled={isGeneratingCopy || !productName.trim()}
              className="w-full py-2.5 px-4 bg-[#C5A368] hover:bg-[#d4b57c] disabled:bg-slate-800 disabled:opacity-50 disabled:text-slate-500 text-black font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#C5A368]/5 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingCopy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  Ssenariylar loyihalanmoqda...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 text-black" />
                  AI Ssenariylar loyihasini yaratish
                </>
              )}
            </button>

            {copyError && (
              <div className="p-3 bg-[#141417] border border-red-900/35 rounded-lg text-red-300 text-xs">
                {copyError}
              </div>
            )}
          </div>

          {/* Generated scripts container */}
          <div className="flex-1 min-h-[250px] flex flex-col justify-between" id="scripts-view">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono mt-3 mb-2 flex items-center justify-between">
              <span>Ssenariy Loyihalari ({generatedScripts.length})</span>
              {generatedScripts.length > 0 && <span className="text-[#C5A368] capitalize text-[10px] font-normal hover:underline cursor-pointer" onClick={() => setGeneratedScripts([])}>Tozalash</span>}
            </h3>

            {generatedScripts.length === 0 ? (
              <div className="flex-1 border border-dashed border-white/5 rounded-xl flex flex-col items-center justify-center p-6 text-center text-gray-650 bg-[#0A0A0B]/50">
                <FileText className="h-8 w-8 text-gray-800 mb-2" />
                <p className="text-xs font-medium text-gray-400">Hali ssenariylar yaratilmadi.</p>
                <p className="text-[11px] text-gray-600 mt-1">Brend ma'lumotlarini to'ldiring va ssenariyni shakllantiring.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {generatedScripts.map((script, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedScriptIndex(idx)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      selectedScriptIndex === idx
                        ? "bg-[#0F0F11] border-[#C5A368]/65 shadow-md shadow-[#C5A368]/5"
                        : "bg-[#0A0A0B]/40 border-white/5 hover:bg-[#0A0A0B]/80 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-[#C5A368]">{script.title}</span>
                      <span className="text-[10px] font-mono text-gray-400 bg-white/5 border border-white/5 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {script.duration}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-300 line-clamp-3 italic mb-2 font-serif leading-relaxed">
                       "{script.text}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-white/5 pt-2 mt-2">
                      <span className="truncate max-w-[200px] text-gray-400"><b>Tanlangan ohang:</b> {script.styleNotes}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTtsText(script.text);
                          setSelectedScriptIndex(idx);
                        }}
                        className="text-[10px] text-black font-semibold bg-[#C5A368] hover:bg-[#d4b57c] px-2 py-1 rounded transition-colors"
                      >
                        Ssenariy import
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT DECK: TTS synthesizer and Voice configurations - spans 7 columns */}
        <section className="lg:col-span-7 flex flex-col gap-6 self-stretch">
          
          {/* Synthesizer Workspace */}
          <div className="bg-[#141417] rounded-xl border border-white/5 p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-[#C5A368]" />
                <h2 className="text-sm font-semibold text-[#E5E5E5] tracking-tight">Ovoz Sintezlash Maydoni (TTS Deck)</h2>
              </div>
              <span className="text-[10px] text-[#C5A368] bg-[#C5A368]/5 px-2.5 py-1 rounded-md border border-[#C5A368]/15 font-mono">High Precision Audio Output</span>
            </div>

            {/* Preset phrases toolbox */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider font-mono text-gray-500 mb-2">Tezkor Reklama Iboralari (Klik orqali qo'shing):</span>
              <div className="flex flex-wrap gap-2">
                {UZBEK_PHRASES.map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertPreset(phrase.text)}
                    className="text-xs bg-[#0A0A0B] hover:bg-black text-gray-300 border border-white/5 hover:border-[#C5A368]/30 px-2.5 py-1.5 rounded-lg transition-all active:scale-[0.97]"
                  >
                    {phrase.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Large Text Synthesizer Box */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider font-mono">
                OVOZLASHTIRILADIGAN MATN (Professional Diktor Matni)
              </label>
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                maxLength={900}
                placeholder="Bu erda siz professional ovoz orqali e'lon qilmoqchi bo'lgan o'zbekcha matningizni yozishingiz, yoki AI ssenariylar bo'limidan biron-bir ssenariyni qo'shishingiz mumkin..."
                rows={6}
                className="w-full bg-[#0A0A0B] text-gray-200 border border-white/5 focus:border-[#C5A368]/35 transition-colors rounded-xl p-4 text-sm leading-relaxed outline-none resize-none font-serif"
              />
              <div className="absolute bottom-3 right-3 text-[9px] font-mono text-gray-500 bg-black/40 px-2 py-0.5 rounded border border-white/5 select-none">
                {ttsText.length} / 900 ta simvol
              </div>
            </div>

            {/* Speaker settings catalog */}
            <div>
              <span className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider font-mono">Professional O'zbek Ovozini Tanlang (Speakers):</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {SPEAKERS.map((spk) => (
                  <div
                    key={spk.id}
                    onClick={() => setSelectedVoice(spk.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                      selectedVoice === spk.id
                        ? "bg-[#C5A368]/5 border-[#C5A368] ring-1 ring-[#C5A368]/30"
                        : "bg-[#0A0A0B]/50 border-white/5 hover:bg-[#0A0A0B] hover:border-white/10"
                    }`}
                  >
                    {selectedVoice === spk.id && (
                      <span className="absolute top-1.5 right-1.5 block w-2 h-2 rounded-full bg-[#C5A368]"></span>
                    )}
                    <div className="w-8 h-8 rounded-full bg-[#0A0A0B] border border-white/5 flex items-center justify-center mx-auto mb-1">
                      <Headphones className={`h-4 w-4 ${selectedVoice === spk.id ? 'text-[#C5A368]' : 'text-gray-500'}`} />
                    </div>
                    <div className="text-xs font-bold text-gray-200 tracking-wide">{spk.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 bg-black/50 py-0.5 rounded border border-white/5">
                      {spk.gender} • {spk.accent.split(" ")[0]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Display speaker guidelines */}
              {selectedVoice && (
                <div className="mt-2.5 p-3 bg-[#0A0A0B]/40 rounded-xl border border-white/5 text-xs my-1">
                  <div className="font-semibold text-gray-300 flex items-center justify-between mb-1.5">
                    <span className="text-[#C5A368] flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5" />
                      Ovoz turi: {selectedVoice}
                    </span>
                    <span className="text-gray-500 text-[10px] font-mono">Soha: {SPEAKERS.find(s => s.id === selectedVoice)?.bestSuited}</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed font-sans">{SPEAKERS.find(s => s.id === selectedVoice)?.description}</p>
                </div>
              )}
            </div>

            {/* Custom Tone instructions */}
            <div className="bg-[#0A0A0B]/30 p-3 rounded-xl border border-white/5 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 font-mono">
                  Audiodagi Ohang va Kayfiyat (Speech Tone instruction):
                </label>
                <select
                  value={selectedTone}
                  onChange={(e) => {
                    setSelectedTone(e.target.value);
                    setCustomTone(""); // reset custom when standard selected
                  }}
                  className="w-full bg-[#0A0A0B] border border-white/5 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-[#C5A368]/30 cursor-pointer"
                >
                  {TONE_PRESETS.map((preset, idx) => (
                    <option key={idx} value={preset.value}>{preset.label}</option>
                  ))}
                  <option value="custom">Maxsus o'zgacha ohang qo'shish...</option>
                </select>
              </div>

              {selectedTone === "custom" && (
                <div className="mt-2">
                  <label className="block text-[10px] font-mono font-semibold text-gray-500 mb-1">
                    Yozma ko'rsatma (Inglizcha yoki O'zbekcha yo'riqnoma yozing):
                  </label>
                  <input
                    type="text"
                    value={customTone}
                    onChange={(e) => setCustomTone(e.target.value)}
                    placeholder="Masalan: Energetik, shoshqoloq, baqiror, yoki fojiali ohang"
                    className="w-full bg-[#0A0A0B] border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#C5A368]/30"
                  />
                </div>
              )}
            </div>

            {/* Main TTS synthesis button - Designed following Sophisticated Dark highlight button style */}
            <button
              onClick={handleSynthesize}
              disabled={isSynthesizing || !ttsText.trim()}
              className="w-full py-4 px-5 bg-[#C5A368] hover:bg-[#d4b57c] text-black font-bold uppercase tracking-widest rounded-lg text-xs leading-none shadow-[0_10px_40px_rgba(197,163,104,0.15)] active:scale-[0.99] disabled:bg-[#141417] disabled:text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-black" />
                  Professional Ovoz Shakllantirilmoqda...
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 text-black" />
                  Ovozli Trekni Yarating (Generate Audio)
                </>
              )}
            </button>

            {ttsError && (
              <div className="p-3 bg-red-950/40 border border-red-900/35 rounded-lg text-red-300 text-xs">
                {ttsError}
              </div>
            )}
          </div>

          {/* Master Deck: Played sound controller */}
          <div className="bg-[#141417] rounded-xl border border-white/5 p-5 shadow-2xl flex flex-col gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-wider font-mono text-gray-500 flex items-center gap-2">
              <Headphones className="h-4 w-4 text-[#C5A368]" />
              Master Sound Deck & Audio Controls
            </h3>

            {audioUrl ? (
              <div className="bg-[#0A0A0B]/60 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F0F11] p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="bg-[#C5A368] hover:bg-[#d4b57c] text-black p-3 rounded-full shadow-lg shadow-[#C5A368]/20 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                    >
                      {isPlaying ? <Pause className="h-4 w-4 text-black" /> : <Play className="h-4 w-4 fill-black text-black ml-0.5" />}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-gray-200">Shakllantirilgan Reklama Ovozli Fayli</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-1.5">
                        <span className="font-bold text-[#C5A368] uppercase">WAV Mono 24KHz</span>• Speed {playbackSpeed}x
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Speed change slider */}
                    <div className="flex items-center gap-2 bg-[#0A0A0B] px-2.5 py-1.5 rounded-lg border border-white/5">
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Tezlik (Pace):</span>
                      <select
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                        className="bg-transparent text-xs text-gray-300 font-bold font-mono outline-none cursor-pointer"
                      >
                        <option value="0.75" className="bg-[#0A0A0B]">0.75x</option>
                        <option value="0.9" className="bg-[#0A0A0B]">0.9x</option>
                        <option value="1" className="bg-[#0A0A0B]">1.0x (Normal)</option>
                        <option value="1.1" className="bg-[#0A0A0B]">1.1x</option>
                        <option value="1.2" className="bg-[#0A0A0B]">1.2x</option>
                        <option value="1.3" className="bg-[#0A0A0B]">1.3x</option>
                      </select>
                    </div>

                    <a
                      href={audioUrl}
                      download={`uzbek_ad_${selectedVoice}_${Date.now()}.wav`}
                      className="border border-[#C5A368]/30 hover:bg-[#C5A368]/10 text-[#C5A368] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download WAV
                    </a>
                  </div>
                </div>

                {/* Progress bar controller */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-gray-500 w-10 text-right">{formatTime(currentTime)}</span>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleProgressBarChange}
                      className="w-full h-1 bg-gray-800 rounded-full appearance-none cursor-pointer accent-[#C5A368] outline-none"
                      style={{
                        background: `linear-gradient(to right, #C5A368 ${duration ? (currentTime / duration) * 100 : 0}%, #1e1e24 ${duration ? (currentTime / duration) * 100 : 0}%)`
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-gray-500 w-10">{formatTime(duration)}</span>
                </div>

                {/* Static/Dynamic wave preview decoration */}
                <div className="flex items-end justify-between h-9 px-1 gap-0.5 bg-[#0F0F11] rounded-lg p-2 overflow-hidden border border-white/5 select-none">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const seedHeight = Math.abs(Math.sin((i + 1) * 0.3)) * 100;
                    const playingHeight = isPlaying ? Math.random() * 85 + 15 : 12;
                    const finalHeight = isPlaying ? playingHeight : seedHeight * 0.3 + 10;
                    return (
                      <span
                        key={i}
                        className={`w-0.5 max-w-[3px] rounded transition-all duration-150 ${isPlaying ? 'bg-[#C5A368]' : 'bg-gray-800'}`}
                        style={{ height: `${finalHeight}%` }}
                      ></span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-white/5 rounded-xl py-6 px-1 text-center text-gray-600 bg-[#0A0A0B]/50">
                <VolumeX className="h-8 w-8 text-gray-800 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-500">Hozircha audio fayllar shakllantirilmadi.</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Matningizni to'ldirib, e'lon ovoz trekini yarating.</p>
              </div>
            )}
          </div>

          {/* Broadcast history / Archive library */}
          <div className="bg-[#141417] rounded-xl border border-white/5 p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-gray-400" />
                <h2 className="text-sm font-semibold text-[#E5E5E5] tracking-tight">Audio Kutubxona va Ssenariylar Tarixi</h2>
              </div>
              {historyList.length > 0 && (
                <button
                  type="button"
                  onClick={() => saveHistoryList([])}
                  className="text-[10px] text-red-400 hover:text-red-300 font-mono flex items-center gap-1 border border-red-950/40 px-2 py-0.5 rounded hover:bg-red-950/20 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Arxivni tozalash
                </button>
              )}
            </div>

            {historyList.length === 0 ? (
              <div className="text-center py-6 text-gray-600 font-serif">
                <p className="text-xs text-gray-500">Sintez qilingan barcha e'lonlar bu erda saqlanadi.</p>
                <p className="text-[10px] text-gray-700 mt-0.5 font-sans">WAV audio lentalari offline kompyuteringiz keshida saqlanadi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[290px] overflow-y-auto pr-1">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItemToPlayer(item)}
                    className="p-3 bg-[#0A0A0B]/60 border border-white/5 hover:bg-[#0A0A0B] hover:border-[#C5A368]/30 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-gray-300 truncate pr-1" title={item.text}>{item.title}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(item.text, item.id);
                            }}
                            className="bg-black/60 text-gray-500 hover:text-gray-300 p-1 rounded border border-white/5 transition-colors"
                            title="Matnni nusxalash"
                          >
                            {isCopiedId === item.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                          <button
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="bg-black/60 text-red-400/80 hover:text-red-400 p-1 rounded border border-white/5 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-400 line-clamp-2 italic mb-2.5 font-serif">
                        "{item.text}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-gray-500">
                      <span className="bg-black text-[#C5A368] font-mono font-bold px-1.5 py-0.5 rounded border border-[#C5A368]/20">
                        Ovoz: {item.voiceName}
                      </span>
                      <span>{item.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Footer copyright */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-[11px] text-gray-600 font-mono bg-[#0F0F11]" id="footer-deck">
        <p>© 2026 OVOZPRO Uzbek Text-to-Speech Ad Studio. Crafted for premium commercials, video narration, and ad campaigns.</p>
      </footer>
    </div>
  );
}
