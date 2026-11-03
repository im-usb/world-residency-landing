(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-motion');

  // Scroll progress and compact sticky header.
  const progress = document.querySelector('.scroll-progress');
  const header = document.querySelector('.site-header');
  let scrollTicking = false;
  const onScroll = () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.transform = `scaleX(${maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0})`;
        header?.classList.toggle('is-scrolled', window.scrollY > 28);
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile navigation.
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  const closeMenu = () => {
    nav?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Open navigation');
  };
  menuToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open') ?? false;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  // Reveal each major section as it enters the viewport.
  const revealSelectors = [
    '.intro-section', '.serenity-section', '.interiors-section', '.screening-section',
    '.amenities-section', '.siteplan-section', '.floorplans-section',
    '.location-section', '.enquiry-section', '.site-footer'
  ];
  if (!reduceMotion && 'IntersectionObserver' in window) {
    revealSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(element => element.classList.add('reveal'));
    });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
  }

  // Highlight the active navigation destination.
  const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
  const observedSections = [...document.querySelectorAll('main section[id]')];
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    observedSections.forEach(section => sectionObserver.observe(section));
  }

  // Accessible floor-plan tabs.
  const planTabs = [...document.querySelectorAll('.floorplan-tab')];
  const planPanels = [...document.querySelectorAll('.floorplan-panel')];
  function selectPlan(index, moveFocus = false) {
    planTabs.forEach((tab, i) => {
      const selected = i === index;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) tab.focus();
    });
    planPanels.forEach((panel, i) => {
      const selected = i === index;
      panel.hidden = !selected;
      panel.classList.toggle('active', selected);
    });
  }
  planTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectPlan(index));
    tab.addEventListener('keydown', event => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % planTabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + planTabs.length) % planTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = planTabs.length - 1;
      else return;
      event.preventDefault();
      selectPlan(next, true);
    });
  });
  if (planTabs.length) selectPlan(0);

  // Lightbox for the site plan and individual apartment layouts.
  const imageModal = document.querySelector('.image-modal');
  const modalImage = imageModal?.querySelector('img');
  const closeModal = () => imageModal?.close();
  document.querySelectorAll('.image-open').forEach(button => {
    button.addEventListener('click', () => {
      const fullSrc = button.dataset.full;
      const image = button.querySelector('img');
      if (!imageModal || !modalImage || !fullSrc) return;
      modalImage.src = fullSrc;
      modalImage.alt = image?.alt || 'Expanded World Residency brochure image';
      imageModal.showModal();
    });
  });
  imageModal?.querySelector('.modal-close')?.addEventListener('click', closeModal);
  imageModal?.addEventListener('click', event => {
    if (event.target === imageModal) closeModal();
  });

  // This front-end form opens a pre-addressed email; connect to a CRM/backend for direct lead capture.
  const enquiryForm = document.querySelector('.enquiry-form');
  enquiryForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!enquiryForm.reportValidity()) return;
    const data = new FormData(enquiryForm);
    const subject = encodeURIComponent('World Residency - Site Visit Enquiry');
    const body = encodeURIComponent(
      `Name: ${data.get('name')}\nPhone: ${data.get('phone')}\nInterested in: ${data.get('residence')}\n\nPlease contact me regarding a site visit.`
    );
    const note = enquiryForm.querySelector('.form-note');
    if (note) note.textContent = 'Opening your email app with the enquiry details. Please send the email to complete your request.';
    window.location.href = `mailto:care@realanchor.com?subject=${subject}&body=${body}`;
  });
})();
