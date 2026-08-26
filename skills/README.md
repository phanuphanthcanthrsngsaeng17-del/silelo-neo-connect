# SILELO Skill Suite

ชุดทักษะนี้เก็บ workflow ของ SILELO แบบแยกบทบาท เพื่อให้เลือกใช้เฉพาะส่วนที่ต้องการหรือประกอบเป็น workflow เดียวกันได้ โดยแต่ละโฟลเดอร์มี `SKILL.md` ของตนเองและไม่ควรนำแพ็กเกจหนึ่งไปเขียนทับอีกแพ็กเกจ

## Routing guide

| งาน | ทักษะหลัก | ใช้ร่วมเมื่อจำเป็น |
|---|---|---|
| สร้างหรือขยาย SILELO ตั้งแต่ต้นจนส่งมอบ | `silelo-ai-studio-workflow` | เรียก gateway, acceptance และ media ตามขอบเขต |
| API ฝั่งเซิร์ฟเวอร์ secrets provider adapter และ streaming | `silelo-api-gateway` | ใช้ workflow หลักวางภาพรวมก่อน |
| ตรวจห้องแชตก่อนส่งมอบ ลิงก์ การแจ้งเตือน และ calculator safety | `silelo-chat-acceptance` | ใช้หลัง gateway และ UI พร้อมทดสอบ |
| ค้นเว็บ ภาพ ONNX vision และ video manifest | `silelo-media-studio` | ใช้เมื่อโปรเจกต์เปิดใช้เครื่องมือสื่อ |
| ปรับหน้าจอตามภาพอ้างอิง drawer bubbles links และ loading | `silelo-chat-ui-refinement` | ใช้ก่อน acceptance และคง server-backed chat เดิม |

## Recommended sequence

เริ่มจาก `silelo-ai-studio-workflow` เพื่อกำหนดขอบเขตและข้อจำกัด จากนั้นใช้ `silelo-api-gateway` เมื่อมีการเปลี่ยน API หรือ provider ใช้ `silelo-chat-ui-refinement` สำหรับการปรับ UI และใช้ `silelo-media-studio` เฉพาะเมื่อมีเครื่องมือสื่อ สุดท้ายใช้ `silelo-chat-acceptance` ตรวจห้องแชตจริงก่อนส่งมอบ

ห้ามรายงานความสำเร็จจากการมีไฟล์หรือ mock เพียงอย่างเดียว ให้แยกหลักฐานเป็น code review, unit test, browser verification และ live-provider verification ทุกแพ็กเกจควรคง secret ฝั่งเซิร์ฟเวอร์และไม่อ้างความสามารถหรือผลลัพธ์ที่ยังไม่ได้ตรวจจริง

## Package integrity

ทักษะเดิม `silelo-ai-studio-workflow` ถูกคัดลอกไว้เป็นแพ็กเกจแยกพร้อม references ของมัน ส่วนทักษะเสริมอีกสี่แพ็กเกจมีชื่อไดเรกทอรีไม่ซ้ำและไม่มีไฟล์ตัวอย่างที่ไม่ใช้ การอัปเดตแพ็กเกจหนึ่งควรทำผ่านไฟล์ในโฟลเดอร์นั้นและตรวจ validation ของแพ็กเกจที่เปลี่ยนเท่านั้น ก่อน commit ให้ตรวจ secret leakage และ diff ทุกครั้ง
