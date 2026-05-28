# ✦ Молитовник

Православний молитовник на Jekyll 3.x — готовий до публікації на **GitHub Pages**.

---

## Що всередині

```
jekyll-site/
├── _config.yml              ← головна конфігурація сайту
├── Gemfile                  ← залежності (github-pages gem)
├── index.html               ← головна сторінка з геро-фото Лаври
├── molytvoslov.html         ← розділ І — Молитвослов
├── akafisty.html            ← розділ ІІ — Акафісти
├── _layouts/
│   ├── default.html         ← базовий шаблон
│   ├── section.html         ← список молитов у розділі
│   └── prayer.html          ← сторінка читання
├── _includes/
│   ├── header.html
│   ├── footer.html
│   └── reader-tools.html    ← кнопки шрифту і теми
├── _molytvoslov/            ← КОЛЕКЦІЯ молитов (markdown)
│   ├── otche-nash.md
│   ├── molytva-mytaria.md
│   └── …
├── _akafisty/               ← КОЛЕКЦІЯ акафістів (markdown)
│   ├── akafist-isusu.md
│   └── …
└── assets/
    ├── css/main.css         ← стилі (з denj/nich темою)
    ├── js/reader.js         ← тема, розмір, пошук, навігація
    ├── fonts/               ← сюди покладете церковний шрифт
    └── lavra-hero.jpeg      ← фон головної
```

---

## 🚀 Деплой на GitHub Pages (за 5 хвилин)

1. Створіть новий репозиторій на GitHub, наприклад `molytovnyk`.
2. Скопіюйте вміст теки `jekyll-site/` у корінь репозиторію.
3. У `_config.yml` розкоментуйте та налаштуйте `baseurl`, якщо публікуєте за адресою `https://USER.github.io/molytovnyk/`:
   ```yaml
   baseurl: "/molytovnyk"
   url: "https://USER.github.io"
   ```
4. Закоммітьте та запуште:
   ```bash
   git add . && git commit -m "Молитовник: перший коміт"
   git push origin main
   ```
5. У налаштуваннях репо: **Settings → Pages → Branch: main / root**.
6. За 1–2 хвилини сайт буде доступний на `https://USER.github.io/molytovnyk/`.

---

## ✚ Як додати нову молитву

Створіть `.md` файл у відповідній теці:

**`_molytvoslov/назва-молитви.md`** (або `_akafisty/…`)

```markdown
---
title: "Молитва за подорожуючих"
subtitle: "Господи Боже"
category: "Молитви різні"
order: 7
---

## Моли́тва за подорожу́ючих

Го́споди Бо́же наш, що є́си ра́дість смутни́х…
```

**Front-matter поля:**
| Поле | Призначення |
|---|---|
| `title` | Назва молитви — як відображається у списку та у заголовку |
| `subtitle` | Коротка підказка під назвою (інципіт або тема) |
| `category` | Підрозділ, наприклад «Молитви ранкові», «Акафісти Богородиці» |
| `order` | Порядок у підрозділі (число) |

Після `git push` молитва автоматично з'явиться у списку.

---

## ✚ Наголоси у тексті молитов

Сайт використовує **комбінований акут Unicode (U+0301)** — він кладеться **після наголошеного голосного** і працює у будь-якому редакторі:

```
О́тче, при́йде, Твоє́, Госпо́дь
```

У VS Code чи Sublime можна вставити через `Ctrl+Shift+U` → `0301` → Enter.

Шрифти **Old Standard TT**, **Cormorant Garamond** і **Lora** (Google Fonts) **коректно рендерять цей акут на кириличних голосних**.

---

## ✚ Як додати «справжній» церковний шрифт

Якщо хочете рендерити повноцінний церковнослов'янський з вязами і виносами:

1. Завантажте безкоштовні шрифти **Ponomar Unicode** або **Triodion Unicode** з [<irmologion.ru/fonts>](https://irmologion.ru/fonts/) або репо <https://github.com/typiconman/Ponomar>.
2. Покладіть `.woff2` або `.ttf` у `assets/fonts/`.
3. На початку `assets/css/main.css` додайте:
   ```css
   @font-face {
     font-family: 'Ponomar';
     src: url('../fonts/Ponomar-Regular.woff2') format('woff2');
     font-display: swap;
   }
   ```
4. У файлі `assets/js/reader.js` додайте `Ponomar` як ще один варіант шрифту в `setFont` (або змініть значення у списку `[data-font]` в `_includes/reader-tools.html`).
5. У `main.css` додайте правило:
   ```css
   [data-font="ponomar"] .prayer-body { font-family: 'Ponomar', 'Old Standard TT', serif; }
   ```

Готово — у читалці з'явиться 4-та кнопка шрифту.

---

## 🌙 Особливості

- **Денний/нічний режим** — кнопка ☀/☾ у шапці і панелі читання. Стан зберігається у `localStorage`.
- **Розмір шрифту** — `А−` / `А+` від 14 до 36 px.
- **Вибір гарнітури** — три варіанти (Old Standard TT, Cormorant Garamond, Lora).
- **Пошук** по списку молитов розділу.
- **Клавіатурна навігація** — `←` / `→` між сусідніми молитвами.
- **PWA-готовність** — додайте `manifest.json`, якщо хочете встановлення на телефон.

---

## Локальний запуск

```bash
cd jekyll-site
bundle install
bundle exec jekyll serve
```

Відкрийте <http://localhost:4000>.

---

✦ *Господи, Ісусе Христе, Сину Божий, помилуй нас грішних.*
