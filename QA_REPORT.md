# QA_REPORT — итоговая доводка по promt3.md

Дата отчёта: 4 августа 2026.

## Что исправлено

- Резервная копия изменяемых файлов: `_backup_before_final/`
- Тексты about / consultation / trust на главной
- На первом экране уточнено: полноценная встреча 60 минут
- Правила переноса/отмены на `index.html` и `rules.html` (без «оплата не возвращается»)
- `practices.html`: обязательный disclaimer, МАК / Таро / Матрица / ведическая нумерология, отдельные кнопки связи
- `education.html`: полное описание удостоверения Солоном; полное название «Полевые расстановки…»
- Форма: обязательны только имя, контакт, 18+, согласие; у темы предупреждение; при `file://` — честное сообщение
- `api/booking.php`: SMTP через PHPMailer при наличии `.env` + `vendor`, honeypot, rate limit, min-time
- `composer.json`, `.env.example`, `.gitignore`
- CSS: `scroll-padding-top` / `scroll-margin-top` под sticky-шапку
- Отзывы скрыты; данные в `content/reviews-pending.json`
- Шаблоны согласий: `docs/REVIEW_PERMISSION_TEMPLATE.txt`, `docs/PHOTO_PERMISSION_TEMPLATE.txt`
- `README_LAUNCH.md`, `LEGAL_LAUNCH_CHECKLIST.md`, `ANALYTICS_LATER.md`
- `robots.txt`: закрыты content/consents/reviews/originals дипломов

## Что проверено

- Нет ChatGPT-изображений дипломов в публичных путях
- Нет AggregateRating и отзывов в Schema.org
- Метрика не активна (`yandexMetrikaId` пустой)
- Контакты TG / MAX / каналы совпадают с подтверждёнными
- Запрещённые рекламные клише на главной не найдены

## Осознанные отклонения от promt3 §13 (контакты)

| promt3 | На сайте | Почему |
| --- | --- | --- |
| `mailto:nasti.kom@mail.ru` | Mail.ru compose | `mailto:` на рабочем ПК открывал пустую вкладку Яндекса; зафиксировано правилом проекта |
| `wa.me/qr/...` | `wa.me/79120435348?text=...` | QR открывал заглушку «установите WhatsApp» |

## Что нельзя завершить без домена и хостинга

- Абсолютные canonical / Open Graph URL
- Реальная проверка SMTP и доставки писем
- Указание хостинг-провайдера в политике
- Уведомление Роскомнадзора (если требуется)
- Индексация в Вебмастере / Search Console
- Проверка формы на боевом HTTPS

## Отзывы (скрыты до разрешений)

| Автор | Статус |
| --- | --- |
| Светлана В. | Скрыт; нет «Разрешаю»/«Согласна» |
| Елена В. | Скрыт; нет «Разрешаю»/«Согласна» |
| Яна А., Ирина, Ольга | Скрыты; нет согласия и/или неясно направление |

Оригиналы в `public/images/reviews/` (Disallow в robots) + `content/reviews-pending.json`.

## Документы об образовании (опубликованы)

1. Диплом ПП «Психологическое консультирование», Talentsy, 27.01.2025–16.01.2026, выдача 16.01.2026  
2. Самоактуализация, 22.03.2025  
3. Полевые расстановки…, 23.03.2025  
4. Аутосимпатия, 22.03.2025  
5. Негативное самоотношение / ролевая игра, 22.03.2025  
6. Самообвинение, 22.03.2025  
7. Удостоверение Солоном / ведическая нумерология, 46 ч., 06.12.2025–13.01.2026, выдача 13.03.2026  

Изображения документов из публичной части с `ChatGPT Image` не удалялись — таких файлов не найдено.  
Сверка мелких формулировок свидетельств с пикселями оригиналов при расхождении — уточнять вручную по фото в `public/images/education/originals/`.

## Ссылки (проверены по коду)

- Telegram: https://t.me/Anasteisha96Ekb  
- MAX: https://max.ru/u/f9LHodD0cOIK_Mrxq2Km8txOKgPre8ITEOa5p39yxLlmFcqEyzKDrTWPimM  
- WhatsApp: https://wa.me/79120435348?text=...  
- Канал TG: https://t.me/safa_nastja  
- Канал MAX: https://max.ru/join/8aerobWrlV1FzaLt8UMUDZDp5eYBF7zy433XyrgzGqk  
- Тел.: tel:+79120435348  
- Почта: compose Mail.ru на nasti.kom@mail.ru  

## Форма

- Локально `file://`: отправка не имитируется  
- На PHP-хостинге с `.env` + `composer install`: SMTP через PHPMailer  
- Без SMTP: fallback на `mail()` хостинга  
- Успех только при `ok: true` от сервера  

## Адаптивность (код-проверка)

| Ширина | Ожидание по CSS |
| --- | --- |
| 360–390 | меню-бургер, одна колонка topics/form |
| 768 | сетки схлопываются в 1 колонку до 900px |
| 1024–1920 | полноценная сетка |

Полный визуальный прогон в браузере на всех ширинах — после открытия локального сервера. Горизонтальная прокрутка от декора: у мотивов `pointer-events: none`, overflow контролировать при ручной проверке.

## Консоль

Отдельный прогон в DevTools не выполнялся в этой сессии (нет запущенного сервера). После `npx serve` или PHP-сервера проверить отсутствие 404 по скриптам/картинкам.

## Изменённые / созданные файлы

- `index.html`, `rules.html`, `practices.html`, `education.html`, `privacy.html`
- `css/styles.css`, `js/main.js`, `api/booking.php`
- `composer.json`, `.env.example`, `.gitignore`, `robots.txt`
- `content/reviews-pending.json`
- `docs/REVIEW_PERMISSION_TEMPLATE.txt`, `docs/PHOTO_PERMISSION_TEMPLATE.txt`
- `README_LAUNCH.md`, `LEGAL_LAUNCH_CHECKLIST.md`, `ANALYTICS_LATER.md`, `QA_REPORT.md`
- `_backup_before_final/` (локальный бэкап; в gitignore)

## Осталось перед публикацией

1. Купить домен и хостинг  
2. `composer install`, заполнить `.env`, проверить письмо  
3. Согласия на фото и отзывы  
4. Подставить домен в config / sitemap / юр. тексты  
5. Ручная проверка 360–1920 и консоли  
6. Юридическая проверка документов  
