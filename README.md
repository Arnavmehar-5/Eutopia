# Eutopia

*A good place where people and nature are at peace.*

Eutopia is a calm photo gallery for the memories you never want to delete. You upload a photo, and Gemma 4 reads it through the Gemini API and writes a short caption, keywords, an event type, an emotion, a few mood words and a suggested title. The gallery shows each photo with its caption and emotion, and you can switch between three looks and search by caption.

This is a working prototype built during sudo Hacktober 2026. It is not a finished product. See the note at the end for what it can and cannot do today.

## The problem

Photos from a festival, a graduation or a trip sit in a phone's camera roll, sorted by date. Gallery apps group them by time and place, not by what they mean. People keep these photos for years and rarely delete them, so the collection grows and becomes hard to browse.

## What Eutopia does

You open the page in your browser and click **Upload photos**. You can choose a JPEG, PNG or WebP file up to 2 MB. The browser checks the size and sends the file to a small local backend.

The backend checks that the file really is the type it claims to be, by reading its first bytes. It then uploads the image to the Gemini Files API, asks Gemma 4 for a JSON answer with six fields, and checks every field against fixed rules. Captions must be 4 to 18 words. Keywords must be 3 to 6 unique lowercase words. The event must be one of diwali, graduation, college, trip, family or other. The emotion must be one of joy, calm, nostalgia, pride, excitement or love. The backend deletes its temporary upload when it finishes.

The page then shows a card with the photo, its caption, its emotion tag and "Analysis complete". If analysis fails, the card still shows the photo and a plain reason, such as a timeout or a rejected file. It never shows a made-up caption.

You can switch the gallery between three groups, **Wallpaper**, **Nature** and **College memories**. Each group shows only its own cards, and new uploads go into the group you have selected. Below the gallery heading there is a search field labelled "Looking for a photo?". As you type, it filters the cards by caption text. Pressing **Find photo** moves to the first match.

When the system asks for reduced motion, the falling petals and the reveal animations are turned off.

## What it is capable of today

Eutopia can take a real photo, send it to Gemma 4, and show a validated result with a clear error when something fails. The model call uses timeouts, one retry for malformed output, and a retry for temporary server errors. The browser and backend both enforce the same limits, so bad output is rejected rather than shown.

It can filter a gallery by three groups and by caption text, and it keeps the photo visible even when analysis fails.

## How it is built

The frontend is plain HTML, CSS and JavaScript with no framework and no build step. It is served on port 8080. The backend is Python 3 with FastAPI, served on port 8000 by uvicorn. It uses the official google-genai SDK, python-dotenv for configuration, and python-multipart for uploads. Dependencies are pinned in `backend/requirements.txt`.

The architecture is three parts. The browser sends a multipart request to `POST /analyze` on the backend. The backend calls Gemma through the Gemini API and returns JSON. The Gemini API is the only external service.

## Running it locally

You need Python 3.12, a Gemini API key from Google AI Studio, and Git. Clone the repository, create a virtual environment, and install the requirements from `backend/requirements.txt`. Copy `.env.example` to `.env` and fill in `GEMINI_API_KEY`, `GEMMA_MODEL` and `PORT`. The key stays on the server and is never sent to the browser.

Start the backend with `python -m backend.app.main` from the project root. Start the frontend by running `python -m http.server 8080` inside the `frontend` folder. Then open `http://localhost:8080`. Use `localhost`, not `127.0.0.1`, in the browser. The backend accepts requests only from `localhost:8080` and `127.0.0.1:8080`.

The optional script `backend/scripts/check_model.py` makes one direct call to Gemma and prints whether it worked, without starting the server.

## Privacy

Photos are sent to Google's Gemini API for analysis, so do not upload private images you do not want analysed. The backend stores nothing. It uploads each photo to the Gemini Files API, requests the analysis, and deletes the upload afterwards. Google documents automatic deletion after 48 hours if an explicit delete fails.

The browser keeps nothing between visits. Photos appear only while the page is open, and refreshing the page clears them. The code does not use IndexedDB, localStorage or any other persistent storage. Eutopia is a way to browse memories, not a backup. Keep your original photos.

## Status

The Gemma call returned complete, valid results in the runs recorded in the project's progress notes. Those runs were manual, and the repeatability check across several real photos has not been completed. The repository has no automated tests.

Upload checks, caption search, template switching and reduced-motion handling have been checked by hand in the browser, according to the progress notes, but not by automated tests. Saving photos between visits, browser resizing, album sections, search over keywords, place recognition, voice control and hosting are not built.

## Credits and assets

The four images in `frontend/assets/` are the Windows default wallpaper, which is used for the Wallpaper group, and three photos supplied by the owner for the Nature and College memories groups. Their sources and licences are not recorded in the repository. Add them before publishing.

No fonts are loaded from the network. The petal animation and all other code are the project's own.

## Evaluation

No evaluation has been completed. The planned check is five different real photos with the owner judging caption accuracy. The repository contains no results for it.

## License

Eutopia is licensed under the Apache License 2.0. See the LICENSE file.

---

## Note: drawbacks and what it can be right now

**Drawbacks**

The Nature and College memories cards show hand-written example captions, not model output. They appear in the live gallery labelled "Example caption", which is not clearly marked as demo data. This conflicts with the rule of never showing invented captions, so either hide them behind `?demo=1` with a visible label or remove them before you present. The Wallpaper card's caption is a real earlier model result, but it is also fixed text and should follow the same rule.

Photos over 2 MB are rejected, and the browser does not resize them. Most phone photos are larger than 2 MB, so a normal camera photo will often fail. Resizing to about 1280 pixels as WebP is the single most useful fix.

Nothing persists. Refreshing the page clears every photo and result. Saving to IndexedDB is the next step, and it is needed before the app can be called a memory store.

The backend address is fixed at `127.0.0.1:8000` in the frontend code. Changing `PORT` in `.env` breaks the frontend unless you change `API_URL` too. The app runs on one machine, and hosting it needs the frontend served from the same address as the backend.

Search only checks captions. It does not look at keywords, events or group names, so a word that appears only in the keywords will not find a photo.

Gemma's output has not been checked for consistency across several real photos, so one good caption does not prove the next one will be as good. The repository has no automated tests, so every feature has been checked by hand only.

Two documents disagree with the current state. `progress.md` still says git is unavailable in this copy, but the repository has a `.git` folder and a commit history. Some earlier notes also describe a backend connection that later worked. Update `progress.md` before submission so the judges see one accurate account.

The project zip you shared earlier contained a `.env` file with a live key. Check that the key has been rotated, and make sure `.env` is not in any upload or repository history.

**What it can be right now**

Right now Eutopia is a working demonstration. It can accept a photo, send it to Gemma 4, show a validated caption and emotion with honest error states, group the gallery into three looks, and search captions. It is good enough to show the core idea: a camera roll grouped by what the photos mean, with an AI model doing the describing. It is not yet a tool someone can use every day, because it forgets everything on refresh and rejects most phone photos.

For the demo, show one live upload and then the gallery with its three looks and caption search, and say plainly what is not built. Keep the example cards behind a clear label, or leave them out.
