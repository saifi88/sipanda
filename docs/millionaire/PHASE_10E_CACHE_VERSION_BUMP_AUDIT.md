# PHASE 10E — AUDIT: FRONTEND CACHE VERSION BUMP (v17 → v18)

**Tanggal:** 2026-09-16
**Tujuan:** memastikan GitHub Pages mengambil `MillionaireGame.js` Phase 10C.
**Hasil:** PASS — siap checkpoint, tanpa deployment Apps Script.

---

## 1. Exact change (`index.html`, +2/−2)

| Baris | Sebelum | Sesudah |
|---|---|---|
| 78 | `millionaire/MillionaireGame.js?v=17` | `millionaire/MillionaireGame.js?v=18` |
| 179 | `APP_VERSION "11.09.2026-v17"` | `APP_VERSION "11.09.2026-v18"` |

Mekanisme: query `?v=18` memaksa fetch file baru (cache-bust per file);
`APP_VERSION` v18 memicu sekali hard-reload via `localStorage sipanda_version`
bagi klien yang masih menyimpan shell lama — pola yang sama seperti bump v16→v17.

## 2. Validasi

- `git diff`: tepat 2 baris di `index.html`; tidak ada perubahan logic, URL
  endpoint (`WEB_APP_URL` tidak tersentuh), atau kode lain.
- Sisa `MillionaireGame.js?v=17` di `index.html`: **0**. Sisa `11.09.2026-v17`
  di `index.html`: **0**.
- `MillionaireGame.js`: tidak diubah (tidak tercantum di diff).
- `games/*` (17 game), CSS, `code.gs`, `code_v2.gs`: tidak tercantum di diff.
- Struktur di sekitar edit utuh: tag `<script>` baris 78 well-formed;
  blok reload `savedVersion !== APP_VERSION → setItem + reload` baris 180–184
  tidak tersentuh. Static check: PASS.

## 3. Catatan cache (sengaja minimal)

Hanya `MillionaireGame.js` yang di-bump (file yang berubah di 10C).
`MillionaireQuestions.js`/`MillionaireData.js`/`millionaire.css` tetap `?v=17`
(kontennya tidak berubah), tetapi ikut di-refresh via hard-reload APP_VERSION.
File `games/*.js?v=16` tidak tersentuh — tidak berubah sejak lama.

## 4. Status: PASS

Setelah push + Pages rebuild, klien menerima shell v18 → reload → fetch
`MillionaireGame.js?v=18` (kode 10C, satu gate). JANGAN deploy Apps Script
pada phase ini; tidak ada perubahan backend.
