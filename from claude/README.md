# Tazalyk audit-cleanup — инструкция применения

Три артефакта в этой папке:

| Файл | Куда применять |
|------|----------------|
| `admin-audit-cleanup.patch` | репо `admin-dashboard-karasuu-tazalyk` |
| `api-audit-cleanup.patch`   | репо `tazalyk-api` |
| `migration.sql`             | Supabase SQL Editor (БД `dihblsiuhrjrkcvhtzzc`) |

## Порядок применения

**Важно:** сначала миграция БД, потом API, потом фронт. Иначе фронт будет звать эндпоинты, под которые ещё нет полей в БД.

### 1. Миграция БД (1 минута)

Supabase Dashboard → SQL Editor → New query → вставить содержимое `migration.sql` → Run.

После выполнения прогнать verification-запросы из конца файла, чтобы убедиться что поля появились.

Если шаг с `storage.buckets` упадёт по правам — создать bucket `refusal-signatures` (public) вручную через Storage UI.

### 2. API репозиторий

```bash
cd /путь/к/tazalyk-api
git checkout main
git pull
git checkout -b audit-cleanup
git apply /путь/к/api-audit-cleanup.patch
git commit -am "audit-cleanup: refusal workflow, dead code removal"
git push -u origin audit-cleanup
```

Vercel поднимет preview-деплой автоматически. Открой preview-URL, проверь что в логах нет ошибок, главная страница `/` отдаёт JSON со `status: running`.

**Доп.** В Vercel → Settings → Environment Variables добавить (опционально):
- `EXTRA_CORS_ORIGINS` — через запятую дополнительные домены (например, URL n8n)

Если всё ок — мердж в main.

### 3. Admin репозиторий

```bash
cd /путь/к/admin-dashboard-karasuu-tazalyk
git checkout main
git pull
git checkout -b audit-cleanup
git apply /путь/к/admin-audit-cleanup.patch
git commit -am "audit-cleanup: roles, refusal workflow, cleanup"
git push -u origin audit-cleanup
```

Vercel поднимет preview по адресу типа `kara-suu-tazalyk-git-audit-cleanup-...vercel.app`.

## Чек-лист тестирования на preview

**Базовое:**
- [ ] Логин работает, заходишь как super_admin
- [ ] В сайдбаре появился пункт «Настройки», «Операторы» переименованы в «Сотрудники»
- [ ] `/profile` редиректит на `/settings`
- [ ] В Settings только Профиль и Уведомления, без заглушек
- [ ] NotFound (любой кривой URL вроде `/foobar`) показывает 404 без ошибок в консоли

**Роли:**
- [ ] Зайти как super_admin → создать оператора через форму → автоматически approved, нужная роль
- [ ] Зайти как admin (создай через super_admin) → видишь страницу «Сотрудники», но pending-юзеры с надписью «Ожидает одобрения Супер Админа», кнопки approve/reject не отображаются
- [ ] Зайти как admin → в Transport нет кнопки «Добавить», в карточке VehicleModal нет «Изменить»
- [ ] Зайти как operator → пункта «Сотрудники» в сайдбаре нет

**Workflow отказа:**
- [ ] Operator открывает заявку в `new` или `in_progress` → жмёт «Клиент отказался» → модалка с текстареа → вводит причину → submit
- [ ] Статус становится `pending_admin_approval` (оранжевая пилюля), транспорт (если был) освобождён в `available`
- [ ] В Applications появилась пилюля «На одобрении» с правильным счётчиком
- [ ] Admin открывает эту заявку → видит оранжевый блок «Запрос на отказ» с причиной → пишет комментарий → «Подтвердить отказ» → статус `cancelled`
- [ ] Другой кейс: admin жмёт «Вернуть оператору» → статус откатывается на `in_progress`

**Schedule:**
- [ ] Открыть «График» → вкладка «Завтра» → нажать «Готово» на карточке
- [ ] Toast «Выполнено», `last_completed` записался, `next_pickup` сдвинулся (если у графика есть `interval_type`)

**Регрессия:**
- [ ] Дашборд грузит данные
- [ ] Список заявок, фильтры, удаление, чат с клиентом
- [ ] Назначение транспорта на заявку (этот сценарий не трогал, но проверить нелишне)
- [ ] Экспорт Excel из Reports

## Откат

Если на preview что-то не так:
```bash
git checkout main  # переключиться обратно
```
Бранч `audit-cleanup` остаётся, можно править и пушить заново.

Миграция БД обратима ALTER TABLE DROP COLUMN-ами (см. ниже), но если уже накопились данные с новыми статусами — лучше форвард-фикс.

## Откат миграции (если нужно)

```sql
BEGIN;
ALTER TABLE applications
    DROP COLUMN IF EXISTS refusal_notes,
    DROP COLUMN IF EXISTS refused_at,
    DROP COLUMN IF EXISTS refusal_signature_url,
    DROP COLUMN IF EXISTS refused_lat,
    DROP COLUMN IF EXISTS refused_lng,
    DROP COLUMN IF EXISTS refused_by_operator_id,
    DROP COLUMN IF EXISTS refusal_approved_by,
    DROP COLUMN IF EXISTS refusal_approved_at;
ALTER TABLE schedules DROP COLUMN IF EXISTS last_completed;
ALTER TABLE transport DROP COLUMN IF EXISTS telegram_chat_id;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
COMMIT;
```

## Что НЕ сделано в этой итерации (специально)

- **Telegram Mini App для водителей** — отдельный проект, после того как этот деплой стабилизируется.
- **Подгрузка подписи водителем** — эндпоинт `POST /applications/{id}/signature` на бэке готов, но клиент (mini-app) ещё не написан. Поле в БД готово, в админке кнопка просмотра подписи работает если ссылка появилась.
- **Привязка водителя к telegram_chat_id** — поле в БД создано, UI для ввода chat_id в карточке транспорта не сделан. Сделаем когда будем подключать бота.
- **n8n workflow назначения водителя** — следующая итерация.

## Структура изменений

**Backend:** 1 файл, ~190 правок (новые эндпоинты, чистка)
**Frontend:** 14 файлов, ~860 правок (включая удаление Profile)
**БД:** 4 таблицы (applications, schedules, transport, users) + 1 storage bucket
