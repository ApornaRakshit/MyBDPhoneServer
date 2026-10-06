const express = require("express");
const router = express.Router();
const { getVoicePersonas, generateTts } = require("../controllers/voicePersonaController");

// Public endpoints
router.get("/voice-personas", getVoicePersonas);
router.post("/generate-tts", generateTts);

module.exports = router;

