/* СТРОЙГРАД — клиентские сценарии: меню, cookie, формы, лайтбокс, фильтр портфолио, цели Метрики. */
(function () {
  'use strict';
  var cfg = window.SITE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---- Яндекс.Метрика (подключается, только если указан номер счётчика) ----
  var ymId = /^\d+$/.test(cfg.METRIKA_ID || '') ? Number(cfg.METRIKA_ID) : null;
  if (ymId) {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(ymId, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
  }
  function goal(name) { try { if (ymId && window.ym) window.ym(ymId, 'reachGoal', name); } catch (e) { /* noop */ } }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-goal]');
    if (a) goal(a.getAttribute('data-goal'));
  });

  // ---- мобильное меню ----
  var burger = $('[data-burger]'), menu = $('#mmenu');
  if (burger && menu) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      menu.hidden = !open;
    };
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  // ---- выпадающее меню «Услуги»: Esc закрывает, повторное наведение открывает снова ----
  $$('[data-mega]').forEach(function (item) {
    var undo = function () { item.classList.remove('is-dismissed'); };
    item.addEventListener('mouseleave', undo);
    item.addEventListener('mouseenter', undo);
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) undo(); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !item.matches(':hover, :has(:focus-visible)')) return;
      item.classList.add('is-dismissed');
      var link = item.firstElementChild;
      if (link && item.contains(document.activeElement)) link.focus();
    });
  });

  // ---- cookie-уведомление ----
  var cookie = $('[data-cookie]');
  if (cookie) {
    var seen = false;
    try { seen = localStorage.getItem('sg_cookie_ok') === '1'; } catch (e) { /* приватный режим */ }
    if (!seen) cookie.hidden = false;
    $('[data-cookie-ok]', cookie).addEventListener('click', function () {
      cookie.hidden = true;
      try { localStorage.setItem('sg_cookie_ok', '1'); } catch (e) { /* noop */ }
    });
  }

  // ---- формы заявок ----
  function contactsHtml() {
    var P = window.SG_PHONES || [];
    return P.map(function (p) { return '<a href="tel:' + p.tel + '">' + p.display + '</a>'; }).join(' · ') +
      '<br><a href="' + window.SG_TG + '" target="_blank" rel="noopener">Telegram</a> · <a href="' + window.SG_MAX +
      '" target="_blank" rel="noopener">MAX</a> · <a href="mailto:' + window.SG_EMAIL + '">' + window.SG_EMAIL + '</a>';
  }
  function setStatus(box, kind, html) { box.hidden = false; box.className = 'form__status ' + kind; box.innerHTML = html; }
  // Успех: поля прячутся, на их месте — крупное «Заявка отправлена», чтобы его нельзя было не заметить
  function showSent(form, status) {
    setStatus(status, 'is-ok is-sent',
      '<span class="form__ok-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
      '<p class="form__ok-h">Заявка отправлена!</p>' +
      '<p>Спасибо! Мы перезвоним вам в рабочее время.</p>' +
      '<p class="form__ok-alt">Если вопрос срочный — позвоните:<br>' + contactsHtml() + '</p>' +
      '<button class="btn btn--ghost btn--sm" type="button" data-form-again>Отправить ещё одну заявку</button>');
    form.classList.add('is-sent');
    var modal = form.closest('dialog');
    if (modal) modal.scrollTop = 0;
    else status.scrollIntoView({ block: 'center', behavior: 'smooth' });
    $('[data-form-again]', status).addEventListener('click', function () { resetSent(form); });
  }
  function resetSent(form) {
    form.classList.remove('is-sent');
    var st = $('[data-status]', form);
    st.hidden = true; st.innerHTML = '';
  }
  function fieldErr(form, name, msg) {
    var p = $('[data-err="' + name + '"]', form);
    if (!p) return;
    var field = p.closest('.field');
    if (msg) { p.textContent = msg; p.hidden = false; if (field) field.classList.add('has-err'); }
    else { p.hidden = true; if (field) field.classList.remove('has-err'); }
  }
  $$('[data-form]').forEach(function (form) {
    $('[name=page]', form).value = location.pathname;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var status = $('[data-status]', form);
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var digits = phone.replace(/\D/g, '');
      var ok = true;
      fieldErr(form, 'name', name.length < 2 ? 'Укажите имя' : '');
      if (name.length < 2) ok = false;
      var badPhone = digits.length < 10 || digits.length > 12;
      fieldErr(form, 'phone', badPhone ? 'Укажите телефон полностью, например +7 900 000-00-00' : '');
      if (badPhone) ok = false;
      var consent = form.elements.consent.checked;
      fieldErr(form, 'consent', consent ? '' : 'Для отправки заявки нужно согласие на обработку персональных данных');
      if (!consent) ok = false;
      if (!ok) { var bad = $('.has-err input', form) || (!consent && form.elements.consent); if (bad) bad.focus(); return; }
      // honeypot: боты заполняют скрытое поле — имитируем успех и ничего не отправляем
      if (form.elements.website && form.elements.website.value) { showSent(form, status); return; }

      var btn = $('button[type=submit]', form);
      if (!cfg.FORM_ENDPOINT) {
        // Эндпоинт не подключён: честно сообщаем и даём все способы связи + готовое письмо
        var body = 'Имя: ' + name + '\nТелефон: ' + phone + '\nНаправление: ' + (form.elements.service.value || '—') + '\nКомментарий: ' + (form.elements.message.value || '—') + '\nСтраница: ' + location.href;
        var mail = 'mailto:' + window.SG_EMAIL + '?subject=' + encodeURIComponent('Заявка с сайта СТРОЙГРАД') + '&body=' + encodeURIComponent(body);
        setStatus(status, 'is-err', '<strong>Онлайн-приём заявок пока не подключён.</strong> Свяжитесь с нами напрямую — мы ответим в рабочее время:<br>' + contactsHtml() + '<br><a class="btn btn--dark btn--sm" href="' + mail + '">Отправить письмом</a>');
        return;
      }
      btn.disabled = true; btn.textContent = 'Отправляем…';
      var fd = new FormData(form);
      fd.append('source_url', location.href);
      fetch(cfg.FORM_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r; })
        .then(function () {
          goal('form_submit');
          form.reset(); form.elements.consent.checked = true;
          showSent(form, status);
        })
        .catch(function () {
          setStatus(status, 'is-err', '<strong>Не удалось отправить заявку.</strong> Пожалуйста, свяжитесь с нами напрямую:<br>' + contactsHtml());
        })
        .then(function () { btn.disabled = false; btn.textContent = 'Отправить заявку'; });
    });
    ['name', 'phone'].forEach(function (n) { form.elements[n].addEventListener('input', function () { fieldErr(form, n, ''); }); });
    form.elements.consent.addEventListener('change', function () { fieldErr(form, 'consent', ''); });
  });

  // ---- всплывающая форма заявки: кнопки «Рассчитать стоимость» и т.п. открывают попап вместо перехода в конец страницы ----
  var leadModal = $('#lead-modal');
  if (leadModal && typeof HTMLDialogElement === 'function') {
    var leadSubject = $('[data-modal-subject]', leadModal);
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href$="#zayavka"]');
      if (!a) return;
      e.preventDefault();
      if (leadSubject) leadSubject.value = (a.textContent || 'Заявка с сайта').trim().replace(/\s+/g, ' ');
      leadModal.showModal();
    });
    $('[data-modal-close]', leadModal).addEventListener('click', function () { leadModal.close(); });
    // после закрытия попап снова показывает пустую форму, а не «Заявка отправлена»
    leadModal.addEventListener('close', function () { resetSent($('[data-form]', leadModal)); });
    leadModal.addEventListener('click', function (e) {
      var r = leadModal.getBoundingClientRect();
      var out = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (out) leadModal.close();
    });
  }

  // ---- фильтр портфолио (первые фото сразу, остальные по кнопке) ----
  var filters = $$('[data-filter]');
  if (filters.length) {
    var items = $$('[data-filterable] > li');
    var showAll = $('[data-showall]'), showWrap = $('[data-showall-wrap]');
    var cur = 'all', expanded = false;
    var apply = function () {
      items.forEach(function (li) {
        var match = cur === 'all' || li.getAttribute('data-cat') === cur;
        li.hidden = !(match && (cur !== 'all' || expanded || !li.hasAttribute('data-more')));
      });
      if (showWrap) showWrap.hidden = !(cur === 'all' && !expanded);
    };
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        cur = b.getAttribute('data-filter');
        filters.forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        apply();
      });
    });
    if (showAll) showAll.addEventListener('click', function () { expanded = true; apply(); });
  }

  // ---- лайтбокс ----
  var galleries = $$('[data-lightbox]');
  if (galleries.length && typeof HTMLDialogElement === 'function') {
    var dlg = document.createElement('dialog');
    dlg.className = 'lb'; dlg.setAttribute('aria-label', 'Просмотр фотографии');
    var icon = function (n) { return '<svg class="ic" aria-hidden="true" focusable="false"><use href="#i-' + n + '"/></svg>'; };
    dlg.innerHTML = '<div class="lb__in"></div><p class="lb__cap"></p>' +
      '<button class="lb__btn lb__btn--x" type="button" aria-label="Закрыть">' + icon('close') + '</button>' +
      '<button class="lb__btn lb__btn--prev" type="button" aria-label="Предыдущее фото">' + icon('arrow') + '</button>' +
      '<button class="lb__btn lb__btn--next" type="button" aria-label="Следующее фото">' + icon('arrow') + '</button>';
    document.body.appendChild(dlg);
    var lbIn = $('.lb__in', dlg), lbCap = $('.lb__cap', dlg), list = [], idx = 0;
    var show = function (i) {
      idx = (i + list.length) % list.length;
      var a = list[idx], im = $('img', a);
      var big = new Image();
      big.className = 'lb__img'; big.alt = im ? im.alt : ''; big.src = a.href;
      lbIn.textContent = ''; lbIn.appendChild(big);
      lbCap.textContent = im ? im.alt : '';
    };
    galleries.forEach(function (g) {
      g.addEventListener('click', function (e) {
        var a = e.target.closest('a.gallery__item');
        if (!a) return;
        e.preventDefault();
        list = $$('a.gallery__item', g).filter(function (x) { return !x.closest('li').hidden; });
        show(list.indexOf(a));
        dlg.showModal();
      });
    });
    $('.lb__btn--x', dlg).addEventListener('click', function () { dlg.close(); });
    $('.lb__btn--prev', dlg).addEventListener('click', function () { show(idx - 1); });
    $('.lb__btn--next', dlg).addEventListener('click', function () { show(idx + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('lb__in')) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // ---- кнопка «Редактировать» для того, кто вошёл в админку (метка sg_adm ставится при входе, сама доступа не даёт) ----
  var editTo = document.body.getAttribute('data-edit');
  if (editTo && /(^|;\s*)sg_adm=1/.test(document.cookie)) {
    var eb = document.createElement('a');
    eb.href = (window.SG_BASE || '') + '/admin/#/' + editTo;
    eb.textContent = '✎ Редактировать страницу';
    eb.setAttribute('style', 'position:fixed;left:16px;bottom:16px;z-index:90;padding:10px 16px;border-radius:10px;background:#15191e;color:#fff;font:600 14px/1.2 system-ui,sans-serif;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.3);border:1px solid #c9a227');
    document.body.appendChild(eb);
    var mb = document.querySelector('.mbar');
    if (mb && getComputedStyle(mb).display !== 'none') eb.style.bottom = (mb.offsetHeight + 12) + 'px'; // над мобильной панелью «Позвонить»
  }
})();
