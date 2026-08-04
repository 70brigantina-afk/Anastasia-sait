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

  // Яндекс.Метрика: подключается только если в config указан номер счётчика
  const metrikaId = String(config.yandexMetrikaId || "").trim();
  if (metrikaId && !document.getElementById("yandex-metrika")) {
    (function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          (m[i].a = m[i].a || []).push(arguments);
        };
      m[i].l = 1 * new Date();
      for (var j = 0; j < document.scripts.length; j++) {
        if (document.scripts[j].src === r) {
          return;
        }
      }
      (k = e.createElement(t)), (a = e.getElementsByTagName(t)[0]);
      k.async = 1;
      k.src = r;
      k.id = "yandex-metrika";
      a.parentNode.insertBefore(k, a);
    })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    window.ym(Number(metrikaId), "init", {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
    });
  }

  // Direct messenger / channel links from config
  const email = String(config.notifyEmail || "nasti.kom@mail.ru").trim();
  const whatsappUrl = String(config.whatsappUrl || "").trim();
  const telegramUrl = String(config.telegramUrl || "").trim();
  const maxUrl = String(config.publicMaxUrl || "").trim();
  const telegramChannelUrl = String(config.telegramChannelUrl || "").trim();
  const maxChannelUrl = String(config.maxChannelUrl || "").trim();
  const phoneHref = `tel:${String(config.phoneHref || "+79120435348").trim()}`;

  const trackGoal = (name) => {
    const id = String(config.yandexMetrikaId || "").trim();
    if (!id || !name) return;
    try {
      if (typeof window.ym === "function") {
        window.ym(Number(id), "reachGoal", name);
      }
    } catch (_) {
      /* ignore */
    }
  };

  const bindExternal = (selector, url, goal) => {
    document.querySelectorAll(selector).forEach((link) => {
      if (!url) {
        link.hidden = true;
        return;
      }
      link.href = url;
      link.hidden = false;
      if (!link.getAttribute("href")?.startsWith("tel:")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      link.removeAttribute("aria-disabled");
      link.classList.remove("is-disabled");
      if (goal) {
        link.addEventListener("click", () => trackGoal(goal));
      }
    });
  };

  bindExternal("[data-whatsapp-link]", whatsappUrl, "click_whatsapp");
  bindExternal("[data-telegram-link]", telegramUrl, "click_telegram");
  bindExternal("[data-max-link]", maxUrl, "click_max");
  bindExternal("[data-telegram-channel]", telegramChannelUrl, "click_telegram_channel");
  bindExternal("[data-max-channel]", maxChannelUrl, "click_max_channel");
  document.querySelectorAll("[data-phone-link]").forEach((link) => {
    link.setAttribute("href", phoneHref);
    link.addEventListener("click", () => trackGoal("click_phone"));
  });
  document.querySelectorAll("[data-practices-link]").forEach((link) => {
    link.addEventListener("click", () => trackGoal("open_practices"));
  });

  const pricing = document.getElementById("pricing");
  if (pricing && "IntersectionObserver" in window) {
    const po = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackGoal("view_pricing");
            po.disconnect();
          }
        });
      },
      { threshold: 0.35 },
    );
    po.observe(pricing);
  }

  const bookingFormEl = document.getElementById("booking-form");
  if (bookingFormEl) {
    let formStarted = false;
    bookingFormEl.addEventListener(
      "focusin",
      () => {
        if (!formStarted) {
          formStarted = true;
          trackGoal("form_start");
        }
      },
      true,
    );
  }

  // Copy buttons (почта — копируем адрес, без выбора Mail.ru/Gmail/Яндекс)
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy") || "";
      const label = button.getAttribute("data-copy-label") || "Скопировано";
      const status =
        button.closest("[data-contact-actions]")?.querySelector("[data-copy-status]") ||
        button.parentElement?.querySelector("[data-copy-status]");
      if (value.includes("@")) {
        trackGoal("click_email");
      }
      try {
        await navigator.clipboard.writeText(value);
        if (status) {
          status.textContent = label;
          status.classList.add("is-visible");
          window.setTimeout(() => {
            status.classList.remove("is-visible");
            status.textContent = "";
          }, 3200);
        } else {
          const original = button.textContent;
          button.textContent = label;
          window.setTimeout(() => {
            button.textContent = original;
          }, 2200);
        }
      } catch (error) {
        if (status) {
          status.textContent = "Не удалось скопировать. Выделите адрес вручную: " + value;
          status.classList.add("is-visible");
        } else {
          window.prompt("Скопируйте адрес почты:", value);
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

  const contactErrorHtml = () => {
    const parts = [];
    if (telegramUrl) {
      parts.push(`<a href="${telegramUrl}" target="_blank" rel="noopener noreferrer">Telegram</a>`);
    }
    if (maxUrl) {
      parts.push(`<a href="${maxUrl}" target="_blank" rel="noopener noreferrer">MAX</a>`);
    }
    if (whatsappUrl) {
      parts.push(`<a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">WhatsApp</a>`);
    }
    parts.push(email);
    return parts.join(", ");
  };

  const setStatus = (html, type) => {
    if (!status) return;
    status.innerHTML = html;
    status.classList.add("is-visible");
    status.classList.toggle("is-success", type === "success");
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-info", type === "info");
  };

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
        form.reset();
        clearFieldErrors();
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
        setStatus(
          "Не удалось отправить заявку. Напишите Анастасии в " +
            contactErrorHtml() +
            ".",
          "error",
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

        const result = await response.json().catch(() => ({}));
        if (!response.ok || result.ok === false) {
          throw new Error("send_failed");
        }

        lastSubmitAt = Date.now();
        form.reset();
        clearFieldErrors();
        trackGoal("form_success");
        setStatus(
          "Спасибо, заявка отправлена. Анастасия свяжется с вами, чтобы согласовать встречу-знакомство.",
          "success",
        );
      } catch (error) {
        setStatus(
          "Не удалось отправить заявку. Напишите Анастасии в " +
            contactErrorHtml() +
            ".",
          "error",
        );
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent =
            submitBtn.dataset.originalText || "Отправить запрос на знакомство";
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
