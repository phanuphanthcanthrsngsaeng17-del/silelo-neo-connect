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

## Pull Request validation

เมื่อเปิดหรืออัปเดต Pull Request workflow `.github/workflows/validate-silelo-skills.yml` จะเรียก `python scripts/validate_skills.py` โดยอัตโนมัติ งานตรวจใช้สิทธิ์ `contents: read` เท่านั้นและยกเลิกรันเก่าของ PR เดียวกันเมื่อมีการ push commit ใหม่ หากต้องการตรวจในเครื่อง ให้รันคำสั่งเดียวกันจาก root ของ repository

## Chat code-block execution

`/api/chat` รองรับการตรวจพบ fenced code block แต่จะรันก็ต่อเมื่อ client ส่ง `runCode: true` และเซิร์ฟเวอร์ตั้ง `CHAT_CODE_EXECUTION_ENABLED=on` เท่านั้น การมี markdown fence หรือ `super: true` เพียงอย่างเดียวจะไม่เปิด execution path ใหม่นี้ เพื่อไม่ให้ข้อความทั่วไปสั่งรันโค้ดโดยไม่ตั้งใจ

ระบบจำกัดไม่เกิน 2 บล็อก และ 12,000 ตัวอักษรต่อบล็อก แล้วส่งผล `stdout`, `stderr`, exit code และเวลาใช้กลับเป็นข้อความในห้องเดิม หากปิด flag ระบบจะแจ้งตรง ๆ ว่ายังไม่รันและแนะนำให้ใช้ LAB Console การตั้งค่า `CHAT_CODE_EXECUTION_ENABLED=on` ควรใช้เฉพาะ deployment ที่มี sandbox/container isolation จริงเท่านั้น เพราะ child process ที่มี timeout และ output limit ไม่ใช่ security boundary สมบูรณ์

## Owner armor และ LINE bot

โหมดเกราะเจ้าของเปิดโดยค่าเริ่มต้น (`OWNER_ARMOR_ENABLED` ไม่ใช่ `off`) และสงวน endpoint ที่รันโค้ด เขียน sandbox ติดตั้งแพ็กเกจ ใช้ DB หรือสั่ง code tool ให้บัญชีเจ้าของเท่านั้น การรัน code block จากแชตก็ต้องเป็นเจ้าของและต้องกดปุ่ม `▶` อย่างชัดเจนด้วย LINE Login และการตรวจ `OWNER_LINE_IDS` ยังคงใช้เหมือนเดิม; การเพิ่มเกราะนี้ไม่ปิด webhook, OAuth callback หรือ credentials ของ LINE และไม่บันทึกค่าลับลง repository.

| ระดับ | ความสามารถ |
|---|---|
| ผู้ใช้ที่ยืนยันตัวตน | แชตปกติ, ค้นเว็บ, วาดภาพ, vision, classify และ summarize ตาม provider ที่ตั้งไว้ |
| เจ้าของระบบ | ทุกความสามารถข้างต้น รวมถึง `/api/code`, `/api/run`, `/api/db`, `/api/codetool`, sandbox write/install และ code block ที่เลือกกด `▶` |
| คำสั่งที่ไม่อนุญาตอัตโนมัติ | การรัน code block จาก markdown อย่างเดียว หรือการเปิด execution โดยไม่มี `runCode: true` |

การตรวจเจ้าของใช้บัญชี password ที่ตั้งไว้, email ใน `OWNER_EMAILS` หรือ LINE user ID ใน `OWNER_LINE_IDS`; `AUTH_WHITELIST` เป็นเพียงรายชื่อผู้มีสิทธิ์เข้าใช้ ไม่ได้ยกระดับเป็นเจ้าของโดยอัตโนมัติ.
