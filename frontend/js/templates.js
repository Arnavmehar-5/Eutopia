/* templates.js — switches the palette and layout for the full Memories section. */

(function () {
  'use strict';

  var TEMPLATES = ['tpl-calm', 'tpl-nostalgia', 'tpl-celebration'];
  var TEMPLATE_TAGLINES = {
    'tpl-calm': 'Wallpaper · the example image and caption',
    'tpl-nostalgia': 'Nature · an echidna and endangered whales',
    'tpl-celebration': 'College Memories · friends on campus',
  };

  // why: the section owns the theme so its heading, picker, empty state, and cards stay together.
  var gallerySection = document.getElementById('gallery-section');
  var galleryEyebrow = document.querySelector('.gallery-heading__eyebrow');
  var buttons = document.querySelectorAll('[data-template]');
  var demoMode = new URLSearchParams(window.location.search).get('demo') === '1';

  /**
   * Apply a template class to the gallery root and update
   * aria-pressed state on picker buttons.
   * Note: we no longer change body background — the dark shell always stays.
   */
  function switchTemplate(templateClass) {
    if (!gallerySection || TEMPLATES.indexOf(templateClass) === -1) return;

    // Swap only the active template, leaving the rest of the page shell unchanged.
    TEMPLATES.forEach(function (cls) {
      gallerySection.classList.remove(cls);
    });
    gallerySection.classList.add(templateClass);
    gallerySection.dataset.activeTemplate = templateClass;
    if (galleryEyebrow) {
      galleryEyebrow.textContent = TEMPLATE_TAGLINES[templateClass];
      galleryEyebrow.hidden = templateClass === 'tpl-calm' && !demoMode;
    }

    // Update aria-pressed for the template picker buttons
    buttons.forEach(function (btn) {
      btn.setAttribute(
        'aria-pressed',
        btn.dataset.template === templateClass ? 'true' : 'false'
      );
    });
    if (window.eutopiaRefreshGallery) window.eutopiaRefreshGallery();
  }

  // Attach click handlers to each template swatch button
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTemplate(btn.dataset.template);
    });
  });

  // why: set calm as the default on page load
  switchTemplate('tpl-calm');
})();
