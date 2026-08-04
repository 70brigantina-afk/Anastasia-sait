(() => {
  const config = window.SITE_CONFIG || {};
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
      { threshold: 0.14 }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // Domain-aware SEO tags
  const domain = String(config.domain || "").replace(/\/$/, "");
  if (domain) {
    const canonical = document.getElementById("canonical-link");
    if (canonical) {
      const path = location.pathname.split("/").pop() || "index.html";
      const page = path === "index.html" || path === "" ? "" : path;
      canonical.href = `${domain}/${page}`;
    }
    document.querySelectorAll('meta[property="og:image"]').forEach((meta) => {
      const content = meta.getAttribute("content") || "";
      if (content && !content.startsWith("http")) {
        meta.setAttribute("content", `${domain}/${content.replace(/^\//, "")}`);
      }
    });
  }

  // MAX public link
  const maxUrl = String(config.publicMaxUrl || "").trim();
  const maxRow = document.querySelector("[data-max-row]");
  const maxLink = document.querySelector("[data-max-link]");
  if (maxUrl && maxRow && maxLink) {
    maxLink.href = maxUrl;
    maxRow.hidden = false;
  }

  // Copy buttons
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy") || "";
      const label = button.getAttribute("data-copy-label") || "Скопировано";
      const status = button.closest("[data-contact-actions]")?.querySelector("[data-copy-status]");
      try {
        await navigator.clipboard.writeText(value);
        if (status) {
          status.textContent = label;
          status.classList.add("is-visible");
          window.setTimeout(() => {
            status.classList.remove("is-visible");
            status.textContent = "";
          }, 2200);
        }
      } catch (error) {
        if (status) {
          status.textContent = "Не удалось скопировать. Выделите текст вручную.";
          status.classList.add("is-visible");
        }
      }
    });
  });

  // Booking form
  const form = document.getElementById("booking-form");
  const status = document.getElementById("form-status");
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  const RATE_LIMIT_MS = 45000;
  let lastSubmitAt = 0;

  const setStatus = (html, type) => {
    if (!status) return;
    status.innerHTML = html;
    status.classList.add("is-visible");
    status.classList.toggle("is-success", type === "success");
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-info", type === "info");
  };

  const endpointReady = Boolean(String(config.formEndpoint || "").trim());
  if (form && status && !endpointReady) {
    const email = String(config.notifyEmail || "nasti.kom@mail.ru").trim();
    setStatus(
      "Форму можно заполнить, но онлайн-отправка пока не подключена. Напишите на " +
        `<a href="mailto:${email}">${email}</a>` +
        " или позвоните по телефону выше.",
      "info"
    );
  }

  const clearFieldErrors = () => {
    form?.querySelectorAll(".field-error").forEach((el) => {
      el.textContent = "";
    });
    form?.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
    });
  };

  const showFieldError = (name, message) => {
    const error = form?.querySelector(`[data-error-for="${name}"]`);
    const field = form?.elements?.namedItem(name);
    if (error) error.textContent = message;
    if (field && "setAttribute" in field) {
      field.setAttribute("aria-invalid", "true");
    }
  };

  const validateForm = () => {
    clearFieldErrors();
    let ok = true;
    const name = String(form.name.value || "").trim();
    const contact = String(form.contact.value || "").trim();
    const channel = String(form.channel.value || "").trim();
    const time = String(form.time.value || "").trim();
    const topic = String(form.topic.value || "").trim();

    if (!name) {
      showFieldError("name", "Укажите имя");
      ok = false;
    }
    if (!form.age.checked) {
      showFieldError("age", "Нужно подтверждение возраста 18+");
      ok = false;
    }
    if (!contact) {
      showFieldError("contact", "Укажите телефон или почту");
      ok = false;
    } else {
      const looksEmail = contact.includes("@");
      const looksPhone = /\d{10,}/.test(contact.replace(/\D/g, ""));
      if (!looksEmail && !looksPhone) {
        showFieldError("contact", "Проверьте телефон или адрес почты");
        ok = false;
      }
    }
    if (!channel) {
      showFieldError("channel", "Выберите способ связи");
      ok = false;
    }
    if (!time) {
      showFieldError("time", "Укажите удобное время");
      ok = false;
    }
    if (!topic) {
      showFieldError("topic", "Коротко опишите, что хотелось бы обсудить");
      ok = false;
    }
    if (!form.consent.checked) {
      showFieldError("consent", "Нужно согласие на обработку данных");
      ok = false;
    }
    return ok;
  };

  if (form && status) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!validateForm()) {
        setStatus("Проверьте поля формы и подтвердите согласие.", "error");
        return;
      }

      const honey = String(form.botcheck?.value || "");
      if (honey) {
        setStatus(
          "Спасибо. Заявка отправлена. Анастасия свяжется с вами, чтобы согласовать встречу-знакомство.",
          "success"
        );
        return;
      }

      const now = Date.now();
      if (now - lastSubmitAt < RATE_LIMIT_MS) {
        setStatus("Подождите немного перед повторной отправкой.", "error");
        return;
      }

      const endpoint = String(config.formEndpoint || "").trim();
      const payload = {
        name: String(form.name.value || "").trim(),
        contact: String(form.contact.value || "").trim(),
        channel: String(form.channel.value || "").trim(),
        time: String(form.time.value || "").trim(),
        topic: String(form.topic.value || "").trim(),
        age_18: form.age.checked ? "да" : "нет",
        consent: form.consent.checked ? "да" : "нет",
        source: "site-booking-form",
      };

      if (!endpoint) {
        const email = String(config.notifyEmail || "nasti.kom@mail.ru").trim();
        setStatus(
          "Онлайн-отправка формы пока не подключена. Напишите на " +
            `<a href="mailto:${email}">${email}</a>` +
            " или позвоните — так заявка дойдёт быстрее всего.",
          "info"
        );
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent || "";
        submitBtn.textContent = "Отправляю…";
      }
      setStatus("Отправляю заявку…", "");

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error("send_failed");
        }

        lastSubmitAt = Date.now();
        form.reset();
        clearFieldErrors();
        setStatus(
          "Спасибо. Заявка отправлена. Анастасия свяжется с вами, чтобы согласовать встречу-знакомство.",
          "success"
        );
      } catch (error) {
        setStatus(
          "Не удалось отправить заявку. Попробуйте ещё раз или напишите на " +
            `<a href="mailto:${String(config.notifyEmail || "nasti.kom@mail.ru").trim()}">${String(config.notifyEmail || "nasti.kom@mail.ru").trim()}</a>.`,
          "error"
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText || "Отправить запрос на знакомство";
        }
      }
    });
  }

  // Reviews carousel
  const reviewsRoot = document.querySelector("[data-reviews-carousel]");
  if (reviewsRoot && !reviewsRoot.closest("[hidden]")) {
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
    let autoplayTimer = null;
    let paused = false;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const AUTOPLAY_MS = 5000;

    const update = () => {
      if (!track || !slides.length) return;
      const cardWidth = slides[0].offsetWidth;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const viewport = reviewsRoot.querySelector(".reviews-viewport");
      const viewportWidth = viewport ? viewport.clientWidth : track.parentElement.clientWidth;
      const offset = viewportWidth / 2 - cardWidth / 2 - index * (cardWidth + gap);
      track.style.transform = `translate3d(${offset + dragDelta}px, 0, 0)`;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dotsWrap?.querySelectorAll(".reviews-dot").forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
      });
    };

    const goTo = (next) => {
      if (!slides.length) return;
      index = (next + slides.length) % slides.length;
      dragDelta = 0;
      update();
    };

    const stopAutoplay = () => {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (prefersReducedMotion || slides.length < 2 || paused) return;
      autoplayTimer = window.setInterval(() => {
        if (document.hidden || dragging) return;
        goTo(index + 1);
      }, AUTOPLAY_MS);
    };

    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "reviews-dot" + (i === index ? " is-active" : "");
        dot.setAttribute("aria-label", `Отзыв ${i + 1} из ${slides.length}`);
        dot.addEventListener("click", () => {
          goTo(i);
          stopAutoplay();
          startAutoplay();
        });
        dotsWrap.appendChild(dot);
      });
    }

    update();
    window.addEventListener("resize", update);
    startAutoplay();

    reviewsRoot.addEventListener("mouseenter", () => {
      paused = true;
      stopAutoplay();
    });
    reviewsRoot.addEventListener("mouseleave", () => {
      paused = false;
      startAutoplay();
    });

    if (!prefersReducedMotion && track) {
      track.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        dragging = true;
        dragStartX = event.clientX;
        dragDelta = 0;
        track.classList.add("is-dragging");
        track.setPointerCapture(event.pointerId);
        stopAutoplay();
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
        if (dragDelta < -48) goTo(index + 1);
        else if (dragDelta > 48) goTo(index - 1);
        else {
          dragDelta = 0;
          update();
        }
        if (event && track.hasPointerCapture?.(event.pointerId)) {
          track.releasePointerCapture(event.pointerId);
        }
        if (!paused) startAutoplay();
      };
      track.addEventListener("pointerup", endDrag);
      track.addEventListener("pointercancel", endDrag);
    }

    reviewsRoot.setAttribute("tabindex", "0");
    reviewsRoot.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
        stopAutoplay();
        startAutoplay();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
        stopAutoplay();
        startAutoplay();
      }
    });
  }

  // Lightbox for education docs
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const triggers = document.querySelectorAll("[data-lightbox]");

  if (lightbox && lightboxImage && triggers.length) {
    let lastFocus = null;
    const closeLightbox = () => {
      lightbox.hidden = true;
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const src = trigger.getAttribute("data-src");
        const alt = trigger.getAttribute("data-alt") || "";
        if (!src) return;
        lastFocus = trigger;
        lightboxImage.src = src;
        lightboxImage.alt = alt;
        lightbox.hidden = false;
        document.body.style.overflow = "hidden";
        lightbox.querySelector("[data-lightbox-close]")?.focus();
      });
    });

    lightbox.querySelectorAll("[data-lightbox-close]").forEach((el) => {
      el.addEventListener("click", closeLightbox);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
    });
  }
})();
