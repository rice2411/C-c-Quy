# Quy ước Import

- Luôn dùng alias `@/` (trỏ về gốc repo) cho import xuyên thư mục:
  `import { db } from '@/config/firebase';`
  `import { Order } from '@/types';`
  `import { useAuth } from '@/contexts/AuthContext';`
- Chỉ dùng relative import (`./`, `../`) cho file TRONG cùng feature/folder
  (vd page import sub-component `./components/OrderList`).
- KHÔNG relative import xuyên feature (`../../pages/...`, `../../services/...`) — dùng `@/`.
- Thứ tự import: thư viện ngoài → import `@/` → import relative.
