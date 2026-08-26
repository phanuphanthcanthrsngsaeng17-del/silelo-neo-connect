# SILELO Integration Patterns

## Server-side LLM gateway

รับข้อความจาก client ผ่าน contract ที่ตรวจ schema แล้ว ตัด history ให้มีขนาดจำกัด และส่งไปยัง provider ผ่าน server-only environment variables ใช้ timeout และคืน response schema ขนาดเล็ก เช่น `{ reply, provider, model }` อย่าส่ง upstream error body กลับไปตรง ๆ

## Web search

ใช้ provider หรือ data API ที่อนุญาตสำหรับ server request กรอง URL เป็น `http:` หรือ `https:` เท่านั้น และคืน title, URL และ snippet ที่ทำความสะอาด HTML แล้ว แสดง source links ให้ผู้ใช้เปิดเอง ห้ามใช้ผลลัพธ์จำลอง

## Image batch

รับ prompt และจำนวนที่ validated แล้วใช้ loop หรือ job queue ที่มี upper bound ต่อรอบ เก็บผลลัพธ์สำเร็จแยกจาก failure และรายงาน `requested`, `completed` และสถานะจริง หากต้องการจำนวนมาก ให้เพิ่ม durable queue, retry policy, cancellation และ progress storage แทนการยิงพร้อมกัน

## Browser-side ONNX

ยืนยัน input tensor shape และ normalization จากโมเดลจริงก่อนเชื่อม UI ตั้งค่า `ort.env.wasm.wasmPaths` หรือวิธีที่เวอร์ชันแพ็กเกจรองรับให้ชี้ไปยัง `.wasm` และโมดูลคู่ที่เผยแพร่ได้ ทดสอบด้วยภาพที่ผู้ใช้มีสิทธิ์ใช้และไม่อัปโหลดภาพโดยไม่แจ้งให้ทราบ

## Video manifest

แทนการหลอกว่าสร้างวิดีโอสำเร็จ ให้สร้าง manifest ที่ประกอบด้วยชื่อโครงการ ความยาว ฉาก เวลาเริ่ม ระยะเวลา prompt และ narration ตั้ง max duration ที่ชัดเจน แยกขั้น `plan`, `render`, `review`, `merge` และเชื่อม provider จริงก่อนเพิ่มปุ่ม render หรือ merge

## Custom notifications

สร้าง notification factory และ provider เดียว ใช้ tone, title, message, duration และ dismiss event ร่วมกันทุกหน้า ให้ error ที่มาจาก backend ผ่านการทำให้ปลอดภัยก่อนแสดง หลีกเลี่ยงการสร้าง timer กระจายหลาย component

## Links in chat and external sources

ใช้ parser แยก URL จากข้อความโดยรักษาข้อความธรรมดาเป็น text node ห้ามใช้ `dangerouslySetInnerHTML` กับข้อความจากโมเดล ตรวจ protocol ให้เหลือ `http:` และ `https:`, ตัด punctuation ที่ติดท้าย URL และจำกัดความยาวหรือจำนวน URL ต่อข้อความ

เว็บควรใช้ `<a href="..." target="_blank" rel="noopener noreferrer">` เป็นค่าเริ่มต้น หากใช้ปุ่มเปิดลิงก์ ให้ validate ก่อนเรียก `window.open` และมี fallback ให้คัดลอก URL เมื่อ popup ถูกบล็อก สำหรับ React Native ให้ใช้ `Linking.canOpenURL` ก่อน `Linking.openURL` และแสดงข้อความที่ผู้ใช้เข้าใจได้เมื่อเปิดไม่ได้

เมื่อแสดง source link จากการค้นเว็บ ต้องแสดง title, domain และ URL ต้นทางอย่างโปร่งใส ห้ามเปลี่ยน URL ไปยัง redirect ที่ไม่แจ้งผู้ใช้ และห้ามตีความลิงก์ว่าเป็นแหล่งข้อมูลที่เชื่อถือได้โดยอัตโนมัติ
