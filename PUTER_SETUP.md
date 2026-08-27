# Puter server setup

โปรเจกต์นี้รองรับการเรียก Puter จาก server route ผ่าน `PUTER_API_KEY` หรือ `PUTER_AUTH_TOKEN` โดยค่าต้องเป็น Puter auth token ที่ใช้กับ Node.js SDK ไม่ใช่ข้อความจำลองหรือคีย์ที่ฝังในหน้าเว็บ

## ตั้งค่าบนโฮสต์

เพิ่ม environment variables บนโฮสต์ที่รัน Node.js:

```env
PUTER_API_KEY=ใส่_Puter_auth_token_ที่นี่
PUTER_MODEL=gpt-5-nano
```

ห้ามใส่ค่าจริงใน GitHub, `.env.example`, `public/chat.html` หรือไฟล์ฝั่ง browser จากนั้น restart/redeploy service

## ตรวจสอบ

หลังล็อกอินแล้วเรียก:

```text
GET /api/puter/status
GET /api/puter/models
```

สถานะที่พร้อมควรมี `configured: true` และ `/api/puter/models` ควรคืนรายการโมเดลที่บัญชี/ระบบนั้นเห็นจริง ถ้าไม่มี token ระบบควรคืน error ที่ระบุสาเหตุและไม่ใช้ mock เป็นคำตอบ

## แชต

หน้าแชตจะส่ง model ที่ผู้ใช้เลือกไปยัง `/api/chat` และผลลัพธ์จะระบุ `provider: puter` กับชื่อโมเดลจริง ถ้า Puter เรียกไม่ได้ ระบบจะแสดง provider error แทนการทำเหมือนเป็นคำตอบจากโมเดล

เอกสารอ้างอิง: https://docs.puter.com/supported-platforms/ และ https://docs.puter.com/AI/chat/
