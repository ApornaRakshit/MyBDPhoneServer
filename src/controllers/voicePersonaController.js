const path = require("path");
const fs = require("fs");

const VOICE_PERSONAS = [
  {
    id: "tanvir",
    name: "Tanvir (Executive Male)",
    category: "Corporate Announcements & Banking Alerts",
    audio_url: "/audio/demos/tanvir.mp3",
    gender: "male",
    accent: "Dhaka Standard (Neutral)",
    bangla_script: "আসসালামু আলাইকুম। মাই বিডি ফোন থেকে বলছি। আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে ওটিপি কোডটি কারও সাথে শেয়ার করবেন না।",
    english_script: "Assalamu Alaikum. Calling from MyBDPhone. To ensure your account security, never share your OTP code with anyone.",
    duration: "0:12"
  },
  {
    id: "nusrat",
    name: "Nusrat (Friendly Female)",
    category: "E-Commerce Order Verification & Customer Care",
    audio_url: "/audio/demos/nusrat.mp3",
    gender: "female",
    accent: "Dhaka Standard (Friendly)",
    bangla_script: "শুভ সকাল! আপনার অনলাইন অর্ডারের ডেলিভারি আজ দুপুর ২টায় নিশ্চিত করা হয়েছে। বিস্তারিত জানতে অনুগ্রহ করে লাইনে থাকুন।",
    english_script: "Good morning! Your online order delivery is confirmed for 2:00 PM today. Please stay on the line for more details.",
    duration: "0:15"
  },
  {
    id: "sabbir",
    name: "Sabbir (Conversational Assistant)",
    category: "Automated Appointment Booking & Clinic Reminder",
    audio_url: "/audio/demos/sabbir.mp3",
    gender: "male",
    accent: "Conversational Natural",
    bangla_script: "নমস্কার, আগামীকাল বিকাল ৪টায় আপনার ডক্টর অ্যাপয়েন্টমেন্ট নির্ধারিত আছে। কনফার্ম করতে ১ বলুন অথবা পরিবর্তন করতে ২ বলুন।",
    english_script: "Hello, you have a doctor appointment scheduled for tomorrow at 4:00 PM. Say 1 to confirm or 2 to reschedule.",
    duration: "0:14"
  },
  {
    id: "ayesha",
    name: "Ayesha (Support Specialist)",
    category: "Technical Support & Helpdesk",
    audio_url: "/audio/demos/ayesha.mp3",
    gender: "female",
    accent: "Empathetic Support",
    bangla_script: "প্রিয় গ্রাহক, আপনার ইন্টারনেট সার্ভিসের মাসিক বিল পরিশোধের শেষ তারিখ আগামী পরশু। বিকাশ বা নগদ দিয়ে সহজে বিল পরিশোধ করুন।",
    english_script: "Dear customer, your monthly internet service bill due date is in two days. Pay conveniently via bKash or Nagad.",
    duration: "0:16"
  }
];

const getVoicePersonas = (req, res) => {
  res.json({
    success: true,
    count: VOICE_PERSONAS.length,
    personas: VOICE_PERSONAS,
    data: VOICE_PERSONAS
  });
};

const generateTts = (req, res) => {
  const { text = "", voice_id = "tanvir" } = req.body || {};
  const persona = VOICE_PERSONAS.find((p) => p.id === voice_id) || VOICE_PERSONAS[0];

  const acceptHeader = req.headers.accept || "";
  if (acceptHeader.includes("audio/")) {
    const audioFilePath = path.join(__dirname, "..", "..", "public", "audio", "demos", `${persona.id}.wav`);
    if (fs.existsSync(audioFilePath)) {
      res.setHeader("Content-Type", "audio/wav");
      return fs.createReadStream(audioFilePath).pipe(res);
    }
  }

  res.json({
    success: true,
    voice_id: persona.id,
    voice_name: persona.name,
    category: persona.category,
    text: text || persona.bangla_script,
    audio_url: persona.audio_url,
    duration: persona.duration,
    generated_at: new Date().toISOString()
  });
};

module.exports = {
  VOICE_PERSONAS,
  getVoicePersonas,
  generateTts
};

