<p align="center"><img src="www/icons/icon-192.png" width="96" alt="ClassTrack logo"></p>

<h1 align="center">ClassTrack</h1>
<p align="center">Offline class attendance for CRs (class representatives). Mark a whole class in seconds and share daily, weekly or semester reports as PDF or WhatsApp text.</p>

## Download the app

1. Open the **[Releases](../../releases/latest)** page of this repository on your phone.
2. Download the file that ends in **`.apk`** and open it.
3. If Android asks, allow "Install unknown apps" for your browser or Files app.

Every time code is pushed to `main`, GitHub builds a new APK automatically (see the **Actions** tab). New versions install over the old one and keep all data.

## Features

- **Fast marking**: everyone starts as Present, tap the absent students and save. Search, "All P" and "All A" shortcuts.
- **Many lectures a day**, each with its own course and lecture number. Past lectures can be edited.
- **Courses and students** you add yourself. Paste a whole class list at once (`01, Ali Khan`, one per line, straight from Excel). Courses can include all students or only some (electives).
- **Reports**: Day, Week, Month, Semester or any custom dates. One course or all courses.
  - **PDF register**: every lecture as a column with P / A, totals and percentage, and short-attendance students highlighted.
  - **Daily PDF**: each lecture's absentees and a student-wise P/A sheet for the day.
  - **Student PDF**: one student's percentage per course and every absence.
  - **WhatsApp text**: a short summary ready to paste in the class group.
- **Midnight (dark) and Light themes**.
- **Backup and restore** to move data to a new phone or hand the app to the next CR, and **New semester** to start fresh while keeping the student list.
- **100% offline**. No account, no internet, no ads. Data stays on the phone.

## Project layout

```
www/                 The app itself (HTML, CSS, JavaScript). Open www/index.html in a browser to try it.
  js/store.js        Data storage (on the phone, in localStorage)
  js/reports.js      Report numbers, PDF and WhatsApp text
  js/app.js          Screens and interactions
  vendor/            jsPDF and jsPDF-AutoTable (MIT)
android-res/         Launcher icons and splash screens
android-keys/        Signing key used for test builds (see below)
scripts/             customize-android.mjs: applies icons, version and signing
.github/workflows/   build-apk.yml: builds the APK and AAB on GitHub
```

The Android app is a [Capacitor](https://capacitorjs.com) wrapper around `www/`. The `android/` folder is generated during the build, so it is not stored in the repository.

## Build on your own computer (optional)

Needs Node.js 22, JDK 21 and Android Studio (Android SDK).

```bash
npm install
cp node_modules/@capacitor/core/dist/capacitor.js www/vendor/
npm run android:prepare
cd android && ./gradlew assembleRelease
```

## Publishing on Google Play

`android-keys/classtrack-dev.jks` is a shared test key (password `classtrack`) so every GitHub build installs over the previous one. **Do not use it for Google Play.** For the Play Store:

1. Create your own upload key:
   `keytool -genkeypair -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
2. In GitHub go to **Settings → Secrets and variables → Actions** and add:
   - `KEYSTORE_BASE64`: output of `base64 -w0 upload.jks`
   - `KEYSTORE_PASSWORD`, `KEY_ALIAS` (`upload`), `KEY_PASSWORD`
3. Push again. The next build is signed with your key; upload its `.aab` file from the release to the Play Console.
4. Use [PRIVACY.md](PRIVACY.md) as the privacy policy page.

Keep `upload.jks` and its password safe; you need the same key for every update on Play.

Note: an APK signed with your new key cannot install over one signed with the test key. Make a backup in the app, uninstall, install the new APK and restore.

## Licence

MIT. Bundled libraries: jsPDF (MIT), jsPDF-AutoTable (MIT), Capacitor (MIT).
