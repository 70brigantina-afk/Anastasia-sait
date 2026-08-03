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

  const reviewsRoot = document.querySelector("[data-reviews-carousel]");
  if (reviewsRoot) {
    const track = reviewsRoot.querySelector("[data-reviews-track]");
    const slides = Array.from(reviewsRoot.querySelectorAll("[data-review-slide]"));
    const dotsWrap = reviewsRoot.querySelector("[data-reviews-dots]");
    let index = Math.max(
      0,
      slides.findIndex((slide) => slide.classList.contains("is-active"))
    );
    let dragStartX = 0;
    let dragDelta = 0;
    let dragging = false;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "reviews-dot" + (i === index ? " is-active" : "");
        dot.setAttribute("aria-label", `Отзыв ${i + 1} из ${slides.length}`);
        dot.addEventListener("click", () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    };

    const update = () => {
      if (!track || !slides.length) return;
      const cardWidth = slides[0].offsetWidth;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const viewport = reviewsRoot.querySelector(".reviews-viewport");
      const viewportWidth = viewport ? viewport.clientWidth : track.parentElement.clientWidth;
      const offset = viewportWidth / 2 - cardWidth / 2 - index * (cardWidth + gap);
      track.style.transform = `translate3d(${offset + dragDelta}px, 0, 0)`;
      slides.forEach((slide, i) => {
        slide.classList.toggle("is-active", i === index);
      });
      if (dotsWrap) {
        dotsWrap.querySelectorAll(".reviews-dot").forEach((dot, i) => {
          dot.classList.toggle("is-active", i === index);
        });
      }
    };

    const goTo = (next) => {
      if (!slides.length) return;
      index = (next + slides.length) % slides.length;
      dragDelta = 0;
      update();
    };

    renderDots();
    update();
    window.addEventListener("resize", update);

    if (!prefersReducedMotion) {
      track.addEventListener("pointerdown", (event) => {
        dragging = true;
        dragStartX = event.clientX;
        dragDelta = 0;
        track.classList.add("is-dragging");
        track.setPointerCapture(event.pointerId);
      });

      track.addEventListener("pointermove", (event) => {
        if (!dragging) return;
        dragDelta = event.clientX - dragStartX;
        update();
      });

      const endDrag = (event) => {
        if (!dragging) return;
        dragging = false;
        track.classList.remove("is-dragging");
        const threshold = 56;
        if (dragDelta < -threshold) goTo(index + 1);
        else if (dragDelta > threshold) goTo(index - 1);
        else {
          dragDelta = 0;
          update();
        }
        if (event && track.hasPointerCapture?.(event.pointerId)) {
          track.releasePointerCapture(event.pointerId);
        }
      };

      track.addEventListener("pointerup", endDrag);
      track.addEventListener("pointercancel", endDrag);
    }

    reviewsRoot.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      }
    });

    reviewsRoot.setAttribute("tabindex", "0");
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
