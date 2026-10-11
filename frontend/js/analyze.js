(function () {
  'use strict';

  var uploadButton = document.getElementById('upload-btn');
  if (!uploadButton) return;

  var API_URL = 'http://127.0.0.1:8000/analyze';
  var MAX_IMAGE_BYTES = 2 * 1024 * 1024;
  // why: 115 s lets the backend finish its bounded upload, generation, and one repair attempt.
  var FETCH_TIMEOUT_MS = 115000;
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/webp,image/jpeg,image/png';
  input.hidden = true;
  document.body.appendChild(input);

  var status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.className = 'analyze-status';
  uploadButton.insertAdjacentElement('afterend', status);
  var galleryGrid = document.querySelector('#gallery-root .gallery__grid');
  var captionSearch = document.getElementById('caption-search');
  var captionSearchForm = document.getElementById('caption-search-form');
  var searchStatus = document.getElementById('caption-search-status');
  var noSearchResults = document.getElementById('caption-search-empty');
  var gallerySection = document.getElementById('gallery-section');
  var demoMode = new URLSearchParams(window.location.search).get('demo') === '1';

  // why: filtering the rendered cards locally makes searches immediate and keeps captions on-device.
  function filterPhotosByCaption() {
    if (!galleryGrid || !captionSearch) return;
    var query = captionSearch ? captionSearch.value.trim().toLocaleLowerCase() : '';
    var activeTemplate = gallerySection && gallerySection.dataset.activeTemplate || 'tpl-calm';
    var cards = galleryGrid.querySelectorAll('.photo-card');
    var visibleCount = 0;

    cards.forEach(function (card) {
      var caption = card.querySelector('.photo-card__caption');
      var belongsToTemplate = card.dataset.templateGroup === activeTemplate;
      var matchesCaption = !query || (caption && caption.textContent.toLocaleLowerCase().includes(query));
      var matches = belongsToTemplate && matchesCaption;
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    if (searchStatus) {
      searchStatus.textContent = query
        ? visibleCount + (visibleCount === 1 ? ' photo found' : ' photos found')
        : '';
    }
    if (noSearchResults) noSearchResults.hidden = !query || visibleCount > 0;
    if (galleryGrid && galleryGrid.parentElement) {
      galleryGrid.parentElement.classList.toggle('gallery--empty', !query && visibleCount === 0);
    }
  }

  window.eutopiaRefreshGallery = filterPhotosByCaption;

  function addExamplePhotos() {
    if (!galleryGrid || galleryGrid.querySelector('[data-demo-photo]')) return;

    // why: bundled examples make all three requested template/search flows usable without an API call.
    var examples = [
      {
        group: 'tpl-calm', image: 'assets/demo-default.jpg', alt: 'Blue abstract flowing wallpaper',
        title: 'Flowing Blue Abstract Waves', caption: 'Flowing blue layered 3D shapes with smooth curves against a light blue backdrop.',
        note: 'Example caption from Gemma',
      },
      {
        group: 'tpl-nostalgia', image: 'assets/nature-echidna.jpg', alt: 'Echidna walking on a pale surface',
        title: 'Echidna in Nature', caption: 'An echidna walks across a pale rocky surface beneath soft natural light.',
        note: 'Example caption',
      },
      {
        group: 'tpl-nostalgia', image: 'assets/nature-whales.jpg', alt: 'Several whales swimming underwater',
        title: 'Endangered Whales', caption: 'A group of whales swims together through deep blue ocean water.',
        note: 'Example caption',
      },
      {
        group: 'tpl-celebration', image: 'assets/college-memories.jpg', alt: 'College friends smiling together outdoors',
        title: 'Campus Friends', caption: 'College friends smile together outdoors with books and backpacks.',
        note: 'Example caption',
      },
    ];

    examples.forEach(function (example) {
      if (example.group === 'tpl-calm' && !demoMode) return;
      var card = document.createElement('article');
      card.className = 'photo-card';
      card.dataset.demoPhoto = 'true';
      card.dataset.templateGroup = example.group;
      var frame = document.createElement('div');
      frame.className = 'photo-card__image';
      var image = document.createElement('img');
      image.src = example.image;
      image.alt = example.alt;
      frame.appendChild(image);
      var body = document.createElement('div');
      body.className = 'photo-card__body';
      var title = document.createElement('h3');
      title.className = 'photo-card__title';
      title.textContent = example.title;
      var caption = document.createElement('p');
      caption.className = 'photo-card__caption';
      caption.textContent = example.caption;
      var note = document.createElement('p');
      note.className = 'photo-card__status';
      note.textContent = example.group === 'tpl-calm' ? 'Demo data · ' + example.note : example.note;
      body.append(title, caption, note);
      card.append(frame, body);
      galleryGrid.appendChild(card);
    });
    galleryGrid.parentElement.classList.remove('gallery--empty');
  }

  addExamplePhotos();
  if (captionSearch) captionSearch.addEventListener('input', filterPhotosByCaption);
  filterPhotosByCaption();
  if (captionSearchForm) {
    captionSearchForm.addEventListener('submit', function (event) {
      event.preventDefault();
      filterPhotosByCaption();
      var firstMatch = galleryGrid && galleryGrid.querySelector('.photo-card:not([hidden])');
      if (firstMatch) {
        firstMatch.setAttribute('tabindex', '-1');
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstMatch.focus({ preventScroll: true });
      } else if (galleryGrid) {
        document.getElementById('gallery-root').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function createPhotoCard(file) {
    if (!galleryGrid) return null;

    var card = document.createElement('article');
    card.className = 'photo-card';
    card.dataset.templateGroup = gallerySection && gallerySection.dataset.activeTemplate || 'tpl-calm';

    var frame = document.createElement('div');
    frame.className = 'photo-card__image';
    var image = document.createElement('img');
    image.src = URL.createObjectURL(file);
    image.alt = 'Uploaded photo';
    frame.appendChild(image);

    var body = document.createElement('div');
    body.className = 'photo-card__body';
    var title = document.createElement('h3');
    title.className = 'photo-card__title';
    title.textContent = 'New memory';
    var caption = document.createElement('p');
    caption.className = 'photo-card__caption';
    caption.textContent = 'No caption yet';
    var emotion = document.createElement('span');
    emotion.className = 'photo-card__emotion';
    emotion.textContent = 'Analysis pending';
    var cardStatus = document.createElement('p');
    cardStatus.className = 'photo-card__status';
    cardStatus.textContent = 'Analyzing with Gemma…';

    body.appendChild(title);
    body.appendChild(caption);
    body.appendChild(emotion);
    body.appendChild(cardStatus);
    card.appendChild(frame);
    card.appendChild(body);
    galleryGrid.appendChild(card);
    galleryGrid.parentElement.classList.remove('gallery--empty');
    filterPhotosByCaption();

    return { title: title, caption: caption, emotion: emotion, status: cardStatus };
  }

  function markAnalysisFailed(card, reason) {
    if (!card) return;
    // why: show the sanitized backend reason on the photo itself so missing captions are diagnosable.
    card.status.textContent = reason || 'Analysis failed';
    card.status.classList.add('photo-card__status--error');
    card.emotion.textContent = 'Not analyzed';
  }

  uploadButton.addEventListener('click', function () {
    input.click();
  });

  input.addEventListener('change', async function () {
    var file = input.files && input.files[0];
    input.value = '';
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      status.textContent = 'This photo is over 2 MB. Choose a smaller one.';
      return;
    }

    var photoCard = createPhotoCard(file);
    var formData = new FormData();
    formData.append('file', file);
    status.textContent = 'Analyzing with Gemma…';
    uploadButton.disabled = true;

    // why: AbortController cancels the fetch if the backend doesn't respond in time
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);

    try {
      var response;
      try {
        response = await fetch(API_URL, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
      } catch (_error) {
        if (_error && _error.name === 'AbortError') {
          status.textContent = 'Analysis took too long. Check the backend window for an error.';
        } else {
          status.textContent = 'Cannot reach the backend. Is it running on port 8000?';
        }
        markAnalysisFailed(photoCard, _error && _error.name === 'AbortError'
          ? 'Analysis took too long'
          : 'Cannot reach the backend');
        return;
      }

      var data;
      try {
        data = await response.json();
      } catch (_error) {
        status.textContent = 'The backend sent an unexpected response.';
        markAnalysisFailed(photoCard, 'Unexpected backend response');
        return;
      }

      if (!data || data.ok !== true) {
        var reason = data && typeof data.error === 'string' ? data.error : 'Unknown error';
        status.textContent = 'AI unavailable: ' + reason + '. No caption shown.';
        markAnalysisFailed(photoCard, reason);
        return;
      }

      var result = data.result;
      var allowedEvents = ['diwali', 'graduation', 'college', 'trip', 'family', 'other'];
      var allowedEmotions = ['joy', 'calm', 'nostalgia', 'pride', 'excitement', 'love'];
      var validKeywords = result && Array.isArray(result.keywords) &&
        result.keywords.length >= 3 && result.keywords.length <= 6 &&
        result.keywords.every(function (word) {
          return typeof word === 'string' && word.trim().length > 0 &&
            word.trim().length <= 24 && word.trim() === word.trim().toLowerCase();
        }) && new Set(result.keywords).size === result.keywords.length;
      var validMoodWords = result && Array.isArray(result.mood_words) &&
        result.mood_words.length <= 3 && result.mood_words.every(function (word) {
          return typeof word === 'string' && word.trim().length > 0 && word.trim().length <= 32;
        });
      var titleWordCount = result && typeof result.suggested_title === 'string'
        ? result.suggested_title.trim().split(/\s+/).filter(Boolean).length
        : 0;
      if (
        !result ||
        typeof result.caption !== 'string' ||
        result.caption.trim().split(/\s+/).length < 4 ||
        result.caption.trim().split(/\s+/).length > 18 ||
        !validKeywords ||
        !allowedEvents.includes(result.event) ||
        !allowedEmotions.includes(result.emotion) ||
        !validMoodWords ||
        titleWordCount < 2 || titleWordCount > 6
      ) {
        status.textContent = 'The backend response was incomplete.';
        markAnalysisFailed(photoCard, 'Incomplete backend response');
        return;
      }

      // Use textContent so untrusted model output is displayed as text rather than interpreted as markup.
      if (photoCard) {
        photoCard.title.textContent = result.suggested_title;
        photoCard.caption.textContent = result.caption;
        photoCard.emotion.textContent = result.emotion;
        photoCard.status.textContent = 'Analysis complete';
      }
      filterPhotosByCaption();
      status.textContent =
        'Caption: ' + result.caption +
        ' | Emotion: ' + result.emotion +
        ' | Group: ' + result.event +
        ' | Title: ' + result.suggested_title;
    } finally {
      // why: always clear the abort timer so it doesn't fire after a normal response
      clearTimeout(timer);
      uploadButton.disabled = false;
    }
  });
})();
