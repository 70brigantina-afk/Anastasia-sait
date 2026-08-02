(() => {
  const nav = document.getElementById("site-nav");
  const toggle = document.querySelector(".menu-toggle");

  if (nav && toggle) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const form = document.getElementById("booking-form");
  const status = document.getElementById("form-status");

  if (form && status) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        status.textContent = "Пожалуйста, заполните обязательные поля и подтвердите согласие.";
        status.classList.add("is-visible");
        return;
      }

      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const contact = String(data.get("contact") || "").trim();
      const channel = String(data.get("channel") || "").trim();
      const time = String(data.get("time") || "").trim();
      const topic = String(data.get("topic") || "").trim();

      const body = [
        "Здравствуйте, Анастасия!",
        "",
        "Заявка с сайта на встречу-знакомство.",
        `Имя: ${name}`,
        `Контакт: ${contact}`,
        `Удобный способ связи: ${channel}`,
        `Удобное время: ${time}`,
        "",
        "Что хотелось бы обсудить:",
        topic,
        "",
        "Подтверждаю возраст 18+ и согласие на обработку персональных данных.",
      ].join("\n");

      const mailto = `mailto:nasti.kom@mail.ru?subject=${encodeURIComponent(
        "Заявка на встречу-знакомство"
      )}&body=${encodeURIComponent(body)}`;

      status.innerHTML =
        "Автоматическая отправка на сервер ещё не подключена. Сейчас можно отправить заявку через почту " +
        'или написать напрямую: <a href="mailto:nasti.kom@mail.ru">nasti.kom@mail.ru</a>, ' +
        '<a href="tel:+79120435348">+7 912 043-53-48</a>.';
      status.classList.add("is-visible");

      window.location.href = mailto;
    });
  }

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const triggers = document.querySelectorAll("[data-lightbox]");

  if (!lightbox || !lightboxImage || !triggers.length) return;

  let lastFocus = null;

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    lightboxImage.removeAttribute("src");
    lightboxImage.alt = "";
    if (lastFocus) lastFocus.focus();
  };

  const openLightbox = (trigger) => {
    lastFocus = trigger;
    const src = trigger.getAttribute("data-src");
    const alt = trigger.getAttribute("data-alt") || "Документ";
    if (!src) return;

    lightboxImage.src = src;
    lightboxImage.alt = alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightbox.querySelector(".lightbox-close")?.focus();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
  });

  lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => {
    el.addEventListener("click", closeLightbox);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
      closeLightbox();
    }
  });

  document.addEventListener("dragstart", (event) => {
    if (event.target instanceof HTMLImageElement && event.target.closest(".doc-trigger, .lightbox")) {
      event.preventDefault();
    }
  });
})();
