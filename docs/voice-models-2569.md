# ชุดเสียง SILELO ปี 2569

ระบบใช้ `gpt-4o-mini-tts` เป็น provider เสริมเมื่อมี `OPENAI_API_KEY` และเลือก 10 preset ได้แก่ `coral`, `marin`, `cedar`, `alloy`, `ash`, `echo`, `fable`, `nova`, `onyx` และ `sage` โดยส่ง style instructions แยกตาม preset ส่วนระบบเดิม `msedge-tts`, Google TTS และ ElevenLabs ยังคงเป็น fallback ตามลำดับเดิม

เอกสาร OpenAI ระบุว่า `gpt-4o-mini-tts` เป็นโมเดล TTS รุ่นใหม่สำหรับงาน realtime และรองรับการควบคุม accent, emotional range, intonation, speed, tone และ whispering อีกทั้งรายการ voice ปัจจุบันมี 13 ตัว โดยแนะนำ `marin` และ `cedar`; voice ถูกปรับให้เหมาะกับภาษาอังกฤษ จึงควรทดสอบเสียงไทยจริงใน deployment ก่อนเปิดใช้เป็นค่าเริ่มต้น [1]

ระบบโทรของแอปยังคงใช้ browser microphone และ server TTS แบบเดิม ไม่ได้อ้างว่าเป็น full-duplex Realtime API โดยอัตโนมัติ หากต้องการเปิดการสนทนา realtime รุ่นใหม่ ต้องตั้งค่าและออกแบบเส้นทาง WebRTC/WebSocket เพิ่มต่างหาก [2]

## แหล่งอ้างอิง

[1]: https://developers.openai.com/api/docs/guides/text-to-speech "OpenAI Text to speech"
[2]: https://openai.com/index/advancing-voice-intelligence-with-new-models-in-the-api/ "OpenAI Advancing voice intelligence with new models in the API"
[3]: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support "Azure Speech language and voice support"
