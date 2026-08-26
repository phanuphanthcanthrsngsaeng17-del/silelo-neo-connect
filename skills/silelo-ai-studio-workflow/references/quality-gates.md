# SILELO Quality Gates

## Before implementation

ตรวจว่า requirement ถูกแปลงเป็น todo ที่ตรวจสอบได้แล้ว ตรวจไฟล์ต้นฉบับแบบ passive และบันทึก design direction หากมี asset ให้เก็บนอก project และกำหนด URL ที่จะใช้ในเว็บ

## Before external calls

ตรวจว่ามี provider, endpoint, schema และ secret requirement ครบ ใช้ secret manager สำหรับค่าลับฝั่ง server เท่านั้น ตรวจ HTTPS, timeout, input validation, rate/size bounds และ error mapping ก่อนส่งคำขอจริง

## Required automated tests

มี unit tests สำหรับ pure helpers และ boundary behavior อย่างน้อย: schema rejection, gateway forwarding, missing configuration, non-OK upstream, malformed payload, search URL filtering, image batch upper bound, video scene count/timeline, calculator parser และ notification defaults/dismiss behavior ห้ามทดสอบ calculator ด้วย `eval` หรือ `Function` ที่รับ input จากผู้ใช้

## Chat-room acceptance test

ใช้ห้องแชทจริงเป็นจุดตรวจรับก่อนส่งงานตามลำดับนี้: (1) ส่งคำถามสั้นผ่าน API/provider ที่ตั้งค่าไว้, (2) ตรวจ pending/typing และป้องกันการส่งซ้ำ, (3) ตรวจว่าคำตอบจริงไม่ว่างและบันทึกลง history, (4) ส่งข้อความที่มี URL และตรวจ anchor ใหม่ที่มี `noopener noreferrer`, (5) จำลอง upstream error อย่างปลอดภัยและตรวจ error notification, (6) ทดสอบ retry หรือส่งใหม่, และ (7) กด dismiss แล้วตรวจว่า notification หายจาก DOM

ถ้าไม่มี provider หรือ secret ที่ยืนยันได้ ให้ทำเฉพาะ contract/mock test และรายงานว่า live acceptance ยังยืนยันไม่ได้ ห้ามเรียก mock ว่าเป็นคำตอบจากโมเดลจริง

## Browser verification

ตรวจ desktop และ mobile ตรวจเส้นทางหลักทีละ flow: ส่ง chat จริง, search ที่คืน source links, image generation ที่แสดงจำนวนสำเร็จจริง, ONNX vision ที่คืนผลลัพธ์, video planning ที่แสดง manifest, calculator ที่ reject input ไม่ปลอดภัย และ notification success/error พร้อมปุ่ม dismiss

## Final commands

```bash
pnpm check
pnpm test
pnpm build
```

ถือว่า warning เป็นสิ่งที่ต้องอ่านและประเมิน ไม่ใช่ผลผ่านโดยอัตโนมัติ หาก bundle ใหญ่จาก ONNX หรือมี runtime warning ให้บันทึกไว้และตัดสินใจว่าจะ code-split หรือปรับ asset loading หรือไม่

## Delivery

อ่าน todo.md ทั้งไฟล์ก่อน checkpoint ตรวจรายการที่เสร็จเป็น `[x]` สร้าง checkpoint หลังการทดสอบผ่าน ส่งเฉพาะไฟล์ skill ที่จำเป็นสำหรับงาน skill และสรุปข้อจำกัดที่ยังเหลืออย่างโปร่งใส
