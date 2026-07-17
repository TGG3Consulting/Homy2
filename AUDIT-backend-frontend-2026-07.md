# Homy — Комплексный аудит: Бэкенд ↔ Фронтенд ↔ Идеи

**Дата:** июль 2026 · **Объём:** 72 API‑роута, 20 моделей Prisma, кастомный `server.ts` (WebSocket `/ws/chat` + socket.io), ~50 файлов фронта с сетевыми вызовами.
**Метод:** трассировка каждого `fetch()`/WebSocket фронта против обработчиков `app/api/**/route.ts` и `server.ts`; сверка Prisma‑схемы с реальными читателями/писателями; анализ бизнес‑ и технической логики на конфликты. Каждая находка — с `файл:строка`. Пункты C1, C2, B1 дополнительно перепроверены вручную.

---

## 0. Приоритетная матрица (сначала это)

| # | Severity | Проблема | Тип |
|---|----------|----------|-----|
| C1 | 🔴 CRITICAL (security) | Любой пользователь может сам выставить себе `user_type=consultant`/`admin` → доступ к чужой поддержке и к админ‑UI | Конфликт логики / доступ |
| C2 | 🔴 CRITICAL (security/cost) | WebSocket `/ws/chat` не аутентифицирован → бесплатный доступ к платному Anthropic API для кого угодно | Тех. конфликт |
| B3+C3 | 🟠 HIGH | `match_score` считается тремя разными способами → один объект показывает разный % на разных экранах; сортировка по match — no‑op | Бизнес‑логика |
| B1/B2 | 🟠 HIGH | Роутинг дашборда проверяет `user_type` раньше `role` → админ с дефолтным `user_type` попадает в кабинет покупателя; нет единой оси авторизации | Бизнес‑логика |
| INT‑1 | 🟠 HIGH (trust) | Property Intelligence + «Мнение Homy» строятся на `Math.random()` (юр.чистота, риск двойной продажи, ROI, названия школ/банков) | Мок выдаётся за факты |
| H1 | 🟠 HIGH | Карточка объекта: блок агента/владельца никогда не заполняется (нет `include: owner`) | FE↔BE контракт |
| B4 | 🟡 MED | Статус просмотра `completed` недостижим → «завершённые» метрики всегда 0 | Бизнес‑логика |
| M1/M2 | 🟡 MED | Имена авторов отзывов не приходят; слоты просмотра с сервера молча отбрасываются | FE↔BE контракт |
| DUP‑* | 🟡 MED | Дублирующие эндпоинты/модели: favorites ×2, property vs propertyListing, viewing/schedule vs viewings | Тех. долг |
| DEAD‑* | 🟢 LOW | Мёртвые модели/роуты: `OauthAccount`, `PlatformMetric`, `ViewingSlot.bookSlot`, `auth/me`, `viewings/[id]/reject` | Идеи без реализации |

---

## 1. FE ↔ BE: контрактные расхождения

### 1.1 🔴 Хорошая новость: сломанных путей нет
Каждый эндпоинт, который вызывает работающий UI, имеет обработчик и метод. Проверены и **консистентны**: WebSocket `/ws/chat` (конверт `ready/properties_update/message/done/error`), favorites (`{propertyId}` → `{favorites:[{id}]}`), saved‑searches CRUD, весь жизненный цикл просмотров (approve/cancel/propose — роуты экспортируют и POST, и PATCH), agent leads/deals/dashboard, compare, notifications, `nearby` POI.

### 1.2 🟠 HIGH — H1: блок агента/владельца в карточке никогда не заполняется
- **FE** `components/homy/PropertyDetailView.tsx:289‑290, 513‑514` читает `property.owner?.first_name/last_name/user_type`.
- **BE** `app/api/properties/[id]/route.ts:18‑20` — `findUnique` **без** `include:{ owner:true }`; адаптер `lib/adapters/propertyAdapter.ts:108` ставит `owner: undefined`.
- **Итог:** имя и роль владельца всегда падают в литералы «Собственник»/«Агент», бейдж «Проверен» не показывается. Те же запросы у `/api/favorites`, `/api/users/me/favorites`, `/api/users/me/recommendations` — тот же адаптер.
- **Фикс:** добавить `include:{ owner:{ select:{ id, first_name, last_name, user_type } } }`.

### 1.3 🟡 MED — M1: имена авторов отзывов
- **FE** `PropertyDetailView.tsx:555` ищет `rv.user?.name || rv.user?.first_name/last_name || rv.author_name`.
- **BE** `app/api/properties/[id]/reviews/route.ts:33‑38` селектит только `user:{ id, email }`.
- **Итог:** ни одно из полей не приходит → каждый отзыв подписан «Пользователь».
- **Фикс:** селектить `first_name, last_name` в запросе отзывов.

### 1.4 🟡 MED — M2: слоты просмотра с сервера молча отбрасываются
- **BE** `app/api/properties/[id]/viewing-slots/route.ts:21‑26` отдаёт `{ id, date:'YYYY-MM-DD', time:'HH:MM', available }`.
- **FE** `app/schedule/page.tsx:58‑62` читает `s.scheduled_at || s.scheduledAt` и отбрасывает всё, где дата невалидна.
- **Итог:** сервер НЕ отдаёт `scheduled_at`, поэтому **все** серверные слоты отфильтровываются, страница молча рисует свой хардкод‑грид (`:64‑76`). Реальная доступность (`available`) не используется.
- **Фикс:** отдавать `scheduled_at` (ISO из date+time) либо на FE собирать `new Date(`${s.date}T${s.time}`)` и учитывать `s.available`.

### 1.5 🟢 LOW — контрактная неопределённость и мёртвый клиент
- **Fallback‑цепочки, маскирующие дрейф формы** (сейчас работают через вторую ветку): `rd.properties || rd.recommendations` (`BuyerDashboard.tsx:64` — BE шлёт только `recommendations`), `d.searches || d.savedSearches` (`SavedSearchesTab.tsx:80` — BE шлёт `searches`), `d.messages || d.data?.messages`, `d.listings || d.data?.listings`.
- **`lib/api/client.ts`** — целые namespaces бьют в несуществующие роуты: `/api/properties/featured`, `/recent`, `/api/favorites/check/[id]`, `/api/platform/stats`, `/api/neighborhoods`. Импортируется только `api.auth.*`. Это «фронт под бэкенд, который не построили».
- **B‑INT баг:** `app/api/admin/dashboard/route.ts:101‑102` считает просмотры со `status:'pending'`, но такого статуса нет (см. B4) → всегда 0 (в 4 плитки не выводится, но неверно).

---

## 2. Бэкенд построен, но не используется фронтом (идеи без выхода в UI)

### 2.1 Осиротевшие роуты (есть обработчик, нет ни одного вызова из FE)
| Эндпоинт | Метод | Идея | Примечание |
|---|---|---|---|
| `/api/agent/contact` | POST | «Связаться с агентом» | Полу‑мок: только `console.log`, комментарий `// In a real app… notification`. Никого не уведомляет. `route.ts:29‑40` |
| `/api/consultant/assigned` | GET | «Ваш персональный консультант» | Полный мок (см. 3) |
| `/api/auth/me` | GET | Текущий пользователь | Дубль `/api/users/me` — мёртвый близнец |
| `/api/users/me/preferences` | PUT | Смена языка/типа/телефона | Пересекается с `PATCH /api/users/me`; **дыра безопасности C1** |
| `/api/users/me/viewings` | GET | «Мои просмотры» (типизирован) | Заменён `/api/viewings` |
| `/api/viewings/[id]/reject` | POST | Агент отклоняет просмотр | Логика идентична `cancel` (ставит `cancelled`) — дубль |
| `/api/platform/metrics` | GET | Счётчики на главной | Реальный запрос, но UI показывает хардкод‑фолбэки |

### 2.2 Мёртвые клиентские заглушки (FE‑код под несуществующий бэкенд)
`lib/api/client.ts`: `/api/platform/stats`, `/api/neighborhoods`, `/api/favorites/check/*`, `/api/properties/featured`, `/api/properties/recent` — роутов нет.

---

## 3. 🟠 Мок/заглушка выдаётся за реальные данные (идеи «застабканы»)

| Файл | Что сфабриковано |
|---|---|
| **`lib/services/propertyIntelligence.ts`** (→ `/api/properties/[id]/intelligence`, UI «Property Intelligence») | Вся юр./локация/инфра/инвест‑аналитика **генерируется `Math.random()`**: `developer_verified = random()>0.3`, `double_sale_risk = random()>0.95`, `claims_count`, `ownership_status`, `title_status` — случайны (`:198‑236`). Инфраструктура — **хардкод‑массивы имён** («SAS», «Ameriabank», «School #<random>») со случайными расстояниями (`:275‑314`). `roi_estimate`, `appreciation_forecast`, `score` — случайны (`:362‑370`). Реально считается только `price_vs_market`. |
| **`app/api/properties/[id]/opinion/route.ts:29‑43`** | «Мнение Homy» кормится этой фейковой аналитикой и подаёт её в LLM как проверенные факты. |
| **`app/api/consultant/assigned/route.ts:4‑27`** | Всем возвращается **захардкоженный человек** «Anna Hakobyan» + статичный аватар; реальный запрос закомментирован. |
| `lib/services/dashboard.ts:99,147,201` | `search_history_count`, `total_views`, `deals_closed` = `0` («placeholder»). |
| `app/api/platform/metrics/route.ts:31‑33,47‑49` | На пустой БД/ошибке — выдуманные `1500 / 15 / 350`. |

> ⚠️ Самый чувствительный пункт: пользователю показывают **юр. чистоту, статус собственности, риск двойной продажи, ROI и названия школ/банков рядом** как факты — при этом всё это `Math.random()`. Юридически и репутационно опасно.

**Проверено как настоящее** (несмотря на подозрения): `nearby` (реальный Overpass/Nominatim с кэшем), `virtual-tour`, `reviews`, `waitlist`, CRM, матчер сохранённых поисков.

---

## 4. Дубли / расщепление данных (тех. долг)

| Пересечение | Эндпоинты / модели | Реальность |
|---|---|---|
| Избранное ×2 | `/api/favorites` **и** `/api/users/me/favorites` | Оба читают `prisma.favorite`, **оба вызываются FE** — два источника истины |
| Текущий юзер | `/api/auth/me` **и** `/api/users/me` | Первый мёртв |
| Мои просмотры | `/api/users/me/viewings` **и** `/api/viewings` | Первый осиротел |
| Reject vs cancel | `/api/viewings/[id]/reject` **и** `/cancel` | Оба ставят `cancelled` |
| Листинги vs объекты | `/api/users/me/listings` (`propertyListing`) **и** `/api/users/me/properties` (`property`) | **Две разные модели** для «того, что я разместил» — split‑brain |
| Создание листинга | `/api/properties/list` (`propertyListing`) **и** `/api/users/me/properties` (`property`) **и** `/api/properties/listings/[id]` | Три пути по двум моделям |
| Запись на просмотр | `/api/viewing/schedule` (singular) **и** `POST /api/viewings` (plural) | Разное поведение (см. B5) |

---

## 5. Идеи, заложенные в схему/типы, но не реализованные

- **A1 `OauthAccount`** (`schema:133‑147`, relation `:55`) — ни одного `prisma.oauthAccount.*`. Авторизация только пароль+OTP. «Вход через провайдера» спроектирован, не построен.
- **A2 `PlatformMetric`** (`schema:292‑300`) — не читается и не пишется; метрики считаются на лету. Таблица мертва.
- **A3 `ViewingSlot`** (`schema:305‑318`, `lib/services/viewingSlot.ts`) — используется только `getAvailableSlots` (read‑only). `bookSlot` (`:87`) и создание слотов (`:200`) без вызовов. Реальная запись (`viewings`/`viewing/schedule`) создаёт `Viewing` на произвольное время, **не сверяясь со слотами**, не флипает `available`, не ставит `booked_by`. Две несвязанные концепции доступности.
- **A4 `VirtualTourRoom` + `virtual_tour_enabled`** — есть читатель и UI, **нет пути записи**; флаг ставится только в сиде. Вне демо‑данных тур всегда выключен.
- **A5 `deposit_months`, `utilities_estimate`, `minimum_lease_months`** — заполняются только в сиде (`seed.ts:1256‑1258`). Путь модерации `admin/listings/[id]/approve` их не переносит, форма не собирает. Реальные объявления показывают пусто.
- **A6 `Notification.type`** — комментарий‑enum (`schema:404`) разошёлся с реально эмитируемыми типами (`viewing_confirmed/rejected/cancelled/proposed`, `chat_*`, `consultant`); документированные `viewing_approved/message/system` не эмитятся. FE‑маппинг иконок по документированному набору ошибётся.
- **A7 частично мёртвые колонки:** `Property.isTopChoice` и `Property.warning` в БД есть, но всегда пересчитываются на лету и не читаются как авторитетные.

---

## 6. 🔴🟠 Конфликты бизнес‑логики

### B1 — Роутинг дашборда: `user_type` затеняет `role` → админ проваливается в кабинет покупателя
`app/dashboard/page.tsx:600‑611`: сначала (600) `buyer/renter/!user_type → BuyerDashboard`, потом (605) `admin/moderator → AdminPanel`. Админ с дефолтным `user_type='buyer'` (`schema:28`) матчится на 600 и **не доходит** до 605. «Кто побеждает» = `user_type` из‑за порядка. **Фикс:** проверять `role` (admin/moderator) ДО `user_type`.

### B2 — Две независимые оси идентичности без правила согласования
`role` (`user|moderator|admin`) рулит модерацией/админкой; `user_type` (`buyer|renter|owner|agent|consultant`) — продуктовыми фичами. Но `user_type` местами тоже принимает `'admin'` (`page.tsx:605`, `AdminPanel.tsx:83` `canRole = role==='admin' || user_type==='admin'`). Нет единого «is admin». **Фикс:** авторизация только по `role`; `user_type` — только персона; запретить `user_type='admin'`.

### B3 — `match_score` из трёх несовместимых источников (тот же объект = разный %)
1. **Статик из БД:** `Property.matchScore` (сид‑константы 98/95/88…), не относителен к пользователю.
2. **Рекомендации** читают это как «ваш матч» (`recommendations/route.ts:55,101,156‑168`; `dashboard.ts:106`).
3. **List/search пересчитывает и игнорирует БД:** `properties/route.ts:168‑169 → enrichArrayWithAI → calculateMatchScore`. Без критериев набирается только безусловный блок удобств → балкон = **30**, ничего = **0** (тот самый «30»).
4. **AI‑results:** `toolHandlers.ts:338` берёт число от LLM (98) `?? calc ?? 0`; FE ещё добавляет фолбэки (`ChatContainer.tsx:108 || 85`).
**Итог:** один объект = 98 в рекомендациях, 30/0 в каталоге, LLM‑число на /results. Рекомендации не персонализированы. **Фикс:** один авторитет скоринга (пер‑юзер против сохранённых предпочтений), все экраны читают его.

### B4 — Статус просмотра `completed` недостижим
Писатели ставят `pending_client/pending_agent → confirmed → cancelled`; **никто не пишет `completed`**. При этом `admin/dashboard:103` и `platform/metrics:26` считают `completed` (всегда 0 → метрики падают в константы), FE бакетит «завершённые» по `status==='completed'` (`ViewingsTab.tsx:150,204`). **Фикс:** добавить переход в `completed` (крон после `scheduledAt` или действие агента).

### B5 — Два пути создания просмотра с разным поведением
`viewings/route.ts` POST выводит статус из того, кто создаёт, и **не** пишет лид; `viewing/schedule/route.ts` POST всегда `pending_agent` и **captureLead** CRM (`:111`). Поведение (стартовый статус, создание лида) зависит от того, какой эндпоинт дёрнул FE. **Фикс:** один путь создания.

### B6 — Lead `stage`: ручная правка не «прилипает» для устаревших лидов
GET возвращает вычисленный `effectiveStage` (`crmService.ts:35‑39` понижает `new/warm→cold` при устаревании `last_contact_at`), PATCH пишет `stage`, но **не бампает** `last_contact_at` → следующий GET снова пересчитает в `cold`. Агент видит «не сохранилось» (`BrokerCabinet.tsx:388‑393`). **Фикс:** бампать `last_contact_at` при ручной смене стадии.

### B7 — Модерация approve пишет i18n‑поля непоследовательно
`admin/listings/[id]/approve/route.ts:40‑47`: `title`/`neighborhood` оборачиваются в JSON `{ru,en,hy}`, а `district` пишется **сырым** (`:44`). Но `matchScoreService.ts:49‑52` сравнивает `neighborhood` как обычную строку с `criteria.districts` → JSON‑строка никогда не совпадёт → district‑компонент скора у одобренных объявлений молча = 0. Плюс валютный дрейф: `PropertyListing.currency` дефолт `'USD'`, `Property` — `'AMD'`; approve делает `listing.currency || 'AMD'`. **Фикс:** нормализовать все локализованные поля одинаково; не хранить JSON в колонке, которую скорер/фильтр читает как скаляр.

---

## 7. 🔴🟠 Конфликты технической логики (auth / realtime / i18n / security)

### C1 — 🔴 Самоназначение привилегий через `user_type` → доступ к поддержке/админ‑UI  *(проверено вручную)*
- `PUT /api/users/me/preferences` (`route.ts:12‑17`): `if (user_type) updateData.user_type = user_type` — **без валидации**.
- `PATCH /api/users/me` (`route.ts:116‑118`): `validateUserType` **разрешает `'admin'` и `'consultant'`** (при том, что текст ошибки их не упоминает).
- Все support‑эндпоинты авторизуют по `user_type==='consultant'` (`support/inbox:23`, `support/status:27,84`, `support/assign/[id]:42,158`).
**Эксплойт:** обычный залогиненный юзер шлёт `PUT /api/users/me/preferences {"user_type":"consultant"}` → читает **весь инбокс поддержки** и назначает себя на чужие диалоги. `user_type:"admin"` дополнительно открывает клиентский админ‑UI‑гейтинг.
> Серверные админ‑мутации всё ещё защищены (`admin/users/route.ts:219‑220` использует `withAdmin` по `role`), но данные поддержки и админ‑UI — нет.
**Фикс:** валидировать `user_type` только против реальных персон (без `admin`/`consultant`) в **обоих** роутах; `consultant` включать только админом.

### C2 — 🔴 `/ws/chat` без аутентификации → бесплатный доступ к Anthropic  *(проверено вручную)*
- socket.io (support) требует JWT: `io.use` (`server.ts:58‑72`), иначе `"Unauthorized: No token provided"`. Клиент токен не передаёт (`socketClient.ts:53,67‑69`) → живёт на cookie‑фолбэке, спамит ошибку в разлогине (5 ретраев).
- raw WebSocket `/ws/chat` (AI‑поиск) — **без auth вообще**: `server.ts:331‑335` апгрейдит и стартует Anthropic‑сессию для **любого** соединения; `results/page.tsx:366` открывает без токена.
**Итог:** `ws(s)://host/ws/chat` — открытый неучтённый шлюз к платному LLM (стоимость/абьюз, нет пер‑юзер лимита). **Фикс:** аутентифицировать upgrade так же, как socket.io (проверять `homy_access_token` в `server.on('upgrade')`), привязывать `userId`, лимитировать.

### C3 — Сортировка по `match_score` в `/api/properties` — no‑op, пагинация до скоринга
`properties/route.ts:138‑169`: `orderBy:{matchScore}` + `skip/take` по **статик**‑скору, затем `enrichArrayWithAI` **пересчитывает** и **пересортировывает страницу** (`propertyAdapter.ts:174‑178`). (а) DB‑сортировка бессмысленна; (б) «лучшие» отсортированы только **внутри** страницы — на 2‑й может быть выше, чем на 1‑й. **Фикс:** скорить до пагинации (или персистить пер‑юзер скор и сортировать в БД).

### C4 — Утечка сырого i18n‑JSON и ~8 копий `loc()`
Локализованные поля хранятся как `{"en","ru","hy"}`‑строки; хелпер `loc()` переписан в каждом файле (`results:76`, `allresults:21`, `compare:16`, `schedule:16`, объектные варианты в `components/homy/*`) + канонический `getLocalized` в `lib/i18n`. Проблемы: (1) части рендера печатают сырые поля (тела уведомлений в approve — не локализованы); (2) guard `s.startsWith('{')` — строка с ведущим пробелом/legacy рендерится сырой; (3) **бэкенд ломается на JSON‑колонках**: `orderBy`/поиск по `title` сортирует по тексту `{"en":...`, скоринг по `neighborhood` не совпадает (см. B7). **Фикс:** единый `getLocalized`; хранить локализацию в структурном JSONB или отдельных скалярах для фильтруемых/сортируемых полей.

### C5 — Рассинхрон «чей ход» между двумя путями создания просмотра
`viewing/schedule` жёстко ставит `createdById/lastProposedById = caller` и `pending_agent` (`:101‑105`), тогда как `isMyTurnToRespond` (`viewings/types.ts:176‑181`) считает ход из статуса+идентичности. При создании владельцем через `viewing/schedule` атрибуция хода/авторизации (propose/approve) может сбиться. Завязано на B5. **Фикс:** консолидировать создание, выводить статус/ход из роли единообразно.

---

## 8. Рекомендованный порядок работ

1. **Безопасность (сейчас):** C1 (валидация `user_type`, запрет self‑`admin`/`consultant`), C2 (auth на `/ws/chat` + rate‑limit).
2. **Доверие/корректность:** INT‑1 (не выдавать `Math.random()` за юр./ROI‑факты — либо реальные данные, либо явная пометка «демо»), B3+C3 (единый источник `match_score`).
3. **Авторизация:** B1/B2 (проверять `role` до `user_type`; одна ось для «админа»).
4. **Данные/контракт:** H1 (owner include), M1/M2 (отзывы/слоты), B7/C4 (единая нормализация i18n).
5. **Жизненный цикл:** B4 (`completed`‑переход), B5/C5 (один путь создания просмотра), B6 (bump `last_contact_at`).
6. **Чистка:** дубли (favorites, property/propertyListing, viewing/schedule), мёртвые модели/роуты (`OauthAccount`, `PlatformMetric`, `ViewingSlot.bookSlot`, `auth/me`, `viewings/[id]/reject`, dead `lib/api/client.ts`).

*Ключевые файлы:* `app/dashboard/page.tsx:600‑611`, `app/api/users/me/preferences/route.ts:12‑17`, `app/api/users/me/route.ts:116‑118`, `server.ts:58‑72 & 331‑335`, `app/api/properties/route.ts:138‑169`, `lib/adapters/propertyAdapter.ts:162‑178`, `lib/services/matchScoreService.ts:85‑94`, `lib/services/propertyIntelligence.ts`, `lib/toolHandlers.ts:338‑378`, `app/api/properties/[id]/route.ts:18‑20`, `app/api/properties/[id]/reviews/route.ts:33‑38`, `app/schedule/page.tsx:58‑76`, `app/api/admin/listings/[id]/approve/route.ts:40‑47`, `lib/services/crmService.ts:35‑39`.
