# CucQuyBakery — Quy ước cho Claude

Stack: React 19 + TypeScript + Vite, Firebase Firestore, React Router (Hash),
TailwindCSS, i18n (vi/en), PWA, deploy Vercel. Path alias `@/` → gốc repo.

## Rules
<!-- Rule FE nằm ở product root (.claude/rules/fe/), không còn bản local trong frontend/.claude.
     Lưu ý: import @../ chỉ resolve khi làm trong monorepo cha; clone CucQuyFE standalone sẽ không nạp. -->
@../.claude/rules/fe/ui-convention.md
@../.claude/rules/fe/service-convention.md
@../.claude/rules/fe/types-convention.md
@../.claude/rules/fe/page-structure.md
@../.claude/rules/fe/import-alias.md
@../.claude/rules/fe/i18n.md
@../.claude/rules/fe/firestore-safety.md
