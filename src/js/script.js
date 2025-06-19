// import Swiper from 'swiper';
// import { Navigation, Pagination } from 'swiper/modules';

// import 'swiper/css';
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';

import "/src/sass/style.scss";

function initCopyButtons() {
  // Додаємо обробники кліку на всі кнопки копіювання
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Беремо текст попереднього сусіднього елемента (код)
      const code = btn.previousElementSibling.textContent;
      // Копіюємо текст у буфер обміну
      navigator.clipboard.writeText(code).then(() => {
        // Показуємо іконку "галочка" після копіювання
        btn.innerHTML = '<i class="fas fa-check"></i>';
        // Через 1 секунду повертаємо іконку копіювання назад
        setTimeout(() => {
          btn.innerHTML = '<i class="fas fa-copy"></i>';
        }, 1000);
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Основні елементи сторінки для роботи
  const main = document.querySelector(".main");
  const palette = document.getElementById("commandPalette");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  // Встановлюємо поточну дату оновлення, якщо є відповідний елемент
  const lastUpdated = document.getElementById("lastUpdated");
  if (lastUpdated) {
    lastUpdated.textContent = new Date().toLocaleDateString();
  }

  initCopyButtons(); // Ініціалізуємо кнопки копіювання на початку

  // Обробник клавіш для відкриття/закриття панелі команд по Ctrl + `
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && (e.key === "`" || e.code === "Backquote")) {
      e.preventDefault();

      if (palette.hidden) {
        // Якщо панель прихована — показуємо її і ставимо фокус в поле пошуку
        palette.hidden = false;
        searchInput.focus();
        searchInput.value = ""; // Очищаємо поле пошуку
        searchResults.innerHTML = ""; // Очищаємо результати пошуку
      } else {
        // Якщо панель відкрита — ховаємо і прибираємо фокус
        palette.hidden = true;
        if (document.activeElement) document.activeElement.blur();
      }
    }
  });

  // Обробник кліку по елементах бічного меню для завантаження контенту
  document.querySelectorAll(".sidebar__details-item").forEach((item) => {
    item.addEventListener("click", async () => {
      const file = item.dataset.file;
      const topicId = item.dataset.topic;

      // Відмічаємо активний пункт меню, прибираємо активність з інших
      document.querySelectorAll(".sidebar__details-item").forEach((el) => {
        el.classList.remove("active-topic");
      });
      item.classList.add("active-topic");

      try {
        // Завантажуємо HTML файл з темами
        const response = await fetch(`/src/cheatsheets/${file}.html`);
        if (!response.ok) throw new Error(`Файл ${file}.html не знайдено`);

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // Шукаємо потрібну тему за ID
        const topicElement = doc.getElementById(topicId);
        if (!topicElement)
          throw new Error(`Тема '${topicId}' не знайдена у ${file}.html`);

        // Очищаємо головний блок і вставляємо тему
        main.innerHTML = "";
        main.appendChild(topicElement.cloneNode(true));

        initCopyButtons(); // Перезапускаємо обробники копіювання для нового контенту
      } catch (err) {
        // Якщо сталася помилка — виводимо повідомлення
        main.innerHTML = `<p class="error">⚠️ ${err.message}</p>`;
      }
    });
  });

  // Пошук по всіх темах із підтримкою непослідовного введення
  if (searchInput && searchResults) {
    searchInput.addEventListener("input", async (e) => {
      const query = e.target.value.trim().toLowerCase();
      searchResults.innerHTML = ""; // Очищаємо попередні результати

      if (!query) return; // Якщо нічого не введено — виходимо

      const words = query.split(/\s+/); // Розбиваємо запит на слова
      const files = ["html", "css", "js", "git"]; // Список файлів для пошуку
      const matchedTopics = [];

      // Проходимо по кожному файлу і шукаємо відповідні теми
      for (const file of files) {
        try {
          const response = await fetch(`/src/cheatsheets/${file}.html`);
          if (!response.ok) continue;

          const htmlText = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, "text/html");

          const topics = doc.querySelectorAll(".topic");
          topics.forEach((topic) => {
            const text = topic.textContent.toLowerCase();
            // Перевіряємо чи містить текст усі слова пошуку
            const isMatch = words.every((word) => text.includes(word));
            if (isMatch) {
              matchedTopics.push({ file, topic });
            }
          });
        } catch (err) {
          console.warn(`Не вдалося завантажити ${file}.html:`, err);
        }
      }

      if (matchedTopics.length === 0) {
        // Якщо нічого не знайдено — показуємо відповідне повідомлення
        const li = document.createElement("li");
        li.textContent = "Нічого не знайдено.";
        searchResults.appendChild(li);
        return;
      }

      // Додаємо знайдені теми у список результатів
      matchedTopics.forEach(({ file, topic }) => {
        const li = document.createElement("li");
        li.tabIndex = 0; // Робимо елемент фокусованим для навігації клавіатурою
        li.textContent =
          topic.querySelector("h2")?.textContent || `Без назви (${file})`;
        li.addEventListener("click", () => {
          // При кліку завантажуємо вибрану тему і ховаємо панель пошуку
          main.innerHTML = "";
          main.appendChild(topic.cloneNode(true));
          palette.hidden = true;
          initCopyButtons(); // Ініціалізуємо копіювання для нового контенту
        });
        searchResults.appendChild(li);
      });
    });

    // --- Додано: навігація по результатах пошуку клавішами ---
    // Обробник для поля вводу: при натисканні стрілки вниз переходимо до першого результату
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (searchResults.firstChild) {
          searchResults.firstChild.focus();
        }
      }
    });

    // Обробник для списку результатів пошуку
    searchResults.addEventListener("keydown", (e) => {
      const focused = document.activeElement;
      // Перевіряємо, чи фокус на елементі в межах списку результатів
      if (focused.parentNode !== searchResults) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        // Переходимо до наступного елемента списку або залишаємося, якщо наступного немає
        if (focused.nextSibling) {
          focused.nextSibling.focus();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        // Переходимо до попереднього елемента або назад в поле пошуку, якщо це перший
        if (focused.previousSibling) {
          focused.previousSibling.focus();
        } else {
          searchInput.focus();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        // Вибираємо (клікаємо) поточний фокусований елемент
        focused.click();
      }
    });
  }
});
