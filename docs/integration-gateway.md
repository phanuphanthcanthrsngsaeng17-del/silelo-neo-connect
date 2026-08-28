# Real Connector Gateway

โปรเจ็กต์นี้เรียกบริการภายนอกผ่าน gateway ที่ตั้งค่าใน `CONNECTOR_GATEWAY_URL` และ `CONNECTOR_GATEWAY_TOKEN` เท่านั้น โดย token ต้องอยู่ใน environment ฝั่งเซิร์ฟเวอร์และห้ามส่งให้ browser

## Endpoints ของ Neo-Connect

`GET /api/integrations/status` ใช้ตรวจสถานะ gateway และคืนค่า `online`, `unreachable`, `timeout`, `error` หรือ `needs_configuration` โดยไม่เปิดเผย token

`GET /api/integrations/capabilities` ใช้ดู service/action ที่ allowlist ไว้

`POST /api/integrations/execute` รับ JSON รูปแบบนี้:

```json
{
  "service": "gmail",
  "action": "search_messages",
  "payload": { "q": "is:unread", "max_results": 10 },
  "confirmed": false
}
```

คำสั่งอ่านจะถูกส่งต่อได้ทันทีเมื่อ gateway ตั้งค่าแล้ว ส่วนคำสั่งเขียน เช่น ส่งอีเมล สร้างนัดหมาย แก้ไฟล์ ส่งข้อความ หรือแก้ข้อมูลร้านค้า ต้องส่ง `confirmed: true` หลัง UI แสดงรายละเอียดการกระทำให้ผู้ใช้ยืนยันก่อนเสมอ หากไม่ยืนยัน endpoint จะตอบ HTTP `428 CONFIRMATION_REQUIRED`

## Contract ของ upstream gateway

Gateway ต้องมี `GET /v1/status` และ `POST /v1/integrations/:service/:action` รับ header `Authorization: Bearer <token>` และ JSON body `{ "payload": { ... }, "confirmed": false }` ผลสำเร็จควรคืน JSON ที่อธิบายผลจริงของผู้ให้บริการ ส่วนความผิดพลาดควรคืน HTTP status ที่เหมาะสมและฟิลด์ `error`

โปรเจ็กต์มี self-hosted gateway ใน `server.js` แล้ว โดย gateway นี้เรียก Manus API v2 ด้วย `MANUS_API_KEY`, ส่ง connector UUID ของ Gmail/Google Calendar/Google Workspace และ poll ผลลัพธ์จนจบ การเรียกคำสั่งเขียนจะถูกป้องกันด้วย confirmation สองชั้น และไม่คืนค่า secret ให้ client

บริการที่ allowlist ไว้ ได้แก่ Gmail, Google Calendar, Google Drive, Google Docs, Google Sheets, Google Slides, LINE, Messenger, WhatsApp, Instagram, Reddit และ Shopify การมีชื่ออยู่ใน allowlist ไม่ได้หมายความว่าเชื่อมต่อสำเร็จ ระบบจะแสดงผลสำเร็จต่อผู้ใช้ก็ต่อเมื่อ upstream ตอบกลับจริงเท่านั้น

## Callback และการตั้งค่าบน Render

ใช้ `https://silelo-neo-connect.onrender.com` เป็น `APP_URL` และ callback หลักของ login เดิมคือ `/api/auth/google/callback`, `/api/auth/line/callback` และ `/api/auth/fb/callback` สำหรับ OAuth ของผู้ให้บริการใน gateway ให้ใช้ callback ของ gateway ตามเอกสารของ gateway แล้วให้ gateway ส่งผลผ่าน contract ข้างต้น

ตั้งค่า secret เหล่านี้ใน Render Environment Variables:

```text
MANUS_API_KEY=<manus-api-key-with-connector-access>
CONNECTOR_GATEWAY_URL=https://silelo-neo-connect.onrender.com
CONNECTOR_GATEWAY_TOKEN=<server-only-secret>
CONNECTOR_GATEWAY_TIMEOUT_MS=15000
```

ห้ามใส่ค่าจริงใน `.env.example`, Git หรือ JavaScript ฝั่ง `public/`
