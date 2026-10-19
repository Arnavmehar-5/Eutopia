# Eutopia

*A good place where people and nature are at peace.*

Eutopia is a calm photo gallery for the memories you never want to delete. You upload a photo, and Gemma 4 (through the Gemini API) writes a short caption, keywords, an event type, an emotion, a few mood words, and a suggested title. The gallery shows each photo with its caption and emotion. You can switch between three groups and search photos by caption.

**Live demo:** https://eutopia-1.onrender.com/

This is a working prototype built during sudo Hacktober 2026. It is not a finished product.

## Purpose

Photos from a festival, a graduation, or a trip sit in a phone's camera roll, sorted by date. Gallery apps group them by time and place, not by what they mean. Eutopia tries a different approach: an AI model describes each photo, and the gallery groups and searches photos by that description.

## How it works

1. You open the page and choose a photo.
2. The browser sends the photo to the backend at `/analyze`.
3. The backend checks that the file is a real JPEG, PNG, or WebP by reading its first bytes.
4. The backend uploads the image to the Gemini Files API and asks Gemma 4 for a JSON answer with six fields: caption, keywords, event, emotion, mood words, and suggested title.
5. The backend checks every field against fixed rules. Captions must be 4 to 18 words. Keywords must be 3 to 6 unique lowercase words. Invalid output is retried once, then rejected.
6. The backend deletes its temporary upload and returns the result. The page shows the photo with its caption and emotion.

If analysis fails, the photo still appears with a plain reason, such as a timeout. Eutopia never shows a made-up caption for a failed analysis.

**Gallery and search.** The page has three groups: Wallpaper, Nature, and College memories. New uploads go into the group you have selected. The search box filters photos by caption text as you type.

**Example cards.** The Nature and College memories groups include example cards with hand-written captions. They are labelled "Example caption" in the interface and are not model output.

**Reduced motion.** If your system asks for reduced motion, the falling petals and reveal animations are turned off.

## Architecture

The app has two parts served from one address:

- **Frontend:** plain HTML, CSS, and JavaScript in `frontend/`. No framework and no build step.
- **Backend:** Python 3 with FastAPI in `backend/app/`. It serves the frontend files and the `/analyze` endpoint.

The Gemini API is the only external service.

## Running it locally

You need Python 3.12, a Gemini API key from Google AI Studio, and Git.

1. Clone the repository and open the project folder:
```bash
   git clone https://github.com/Arnavmehar-5/Eutopia.git
   cd Eutopia
```
2. Create and activate a virtual environment:
```bash
   python -m venv backend/.venv
   # Windows PowerShell
   backend\.venv\Scripts\Activate.ps1
   # macOS / Linux
   source backend/.venv/bin/activate
```
3. Install the dependencies:
```bash
   pip install -r backend/requirements.txt
```
4. Copy `.env.example` to `.env` and fill in your values:
```
   GEMINI_API_KEY=your_key_here
   GEMMA_MODEL=gemma-4-26b-a4b-it
   PORT=8000
```
   The key stays on the server and is never sent to the browser. Never commit `.env`.
5. Start the app from the project root:
```bash
   python -m uvicorn backend.app.main:app --port 8000
```
6. Open http://localhost:8000 in your browser.

The optional script `backend/scripts/check_model.py` makes one direct call to Gemma and prints whether the connection works, without starting the server.

## Deploying on Render

1. Create a new **Web Service** from this GitHub repository.
2. Use these settings:
   - **Build command:** `pip install -r backend/requirements.txt`
   - **Start command:** `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
3. Add the environment variables `GEMINI_API_KEY` (mark it as secret) and `GEMMA_MODEL`. Do not set `PORT`, because Render provides it.

The free tier sleeps after a period without traffic. The first request after that can take up to a minute.

## Privacy

Photos are sent to Google's Gemini API for analysis, so do not upload private images you do not want analysed. The backend stores nothing. It uploads each photo to the Gemini Files API, requests the analysis, and deletes the upload afterwards. Google documents automatic deletion after 48 hours if an explicit delete fails.

**Refreshing the page clears everything.** Eutopia does not save photos or results. The browser keeps nothing between visits, and the code uses no IndexedDB, localStorage, or other persistent storage. Photos and captions appear only while the page is open. Eutopia is a way to browse memories, not a backup, so keep your original photos.

## Limitations

- Photos and results are not saved. Refreshing the page or closing it removes them.
- Search checks captions only, not keywords, events, or group names.
- Gemma's output has been checked on a small number of photos, not a full evaluation set.
- The project has no automated tests. Features were checked by hand.
- The free hosting tier sleeps when idle, so the first request can be slow.

## Status

Eutopia is a working demonstration. It can accept a photo, send it to Gemma 4, show a validated caption and emotion with honest error states, group the gallery into three groups, and search captions. Saving photos between visits, search over keywords, sections, and voice control are not built yet.

## Credits

The sample images are the project owner's photos and Windows wallpapers. Sources and licences for the images are to be added before publishing.

## License

Eutopia is licensed under the Apache License 2.0. See [LICENSE](LICENSE).