# Prishtina Connect 🎓

**Prishtina Connect** është një platformë akademike e mbyllur dhe në kohë reale, e projektuar dhe e dedikuar ekskluzivisht për studentët e Universitetit të Prishtinës "Hasan Prishtina". Ky portal shërben si një ekosistem digjital qendror për shkëmbimin e materialeve mësimore, përditësimin me lajmet akademike, menaxhimin multidisiplinar të klubeve studentore dhe zhvillimin e bisedave live përmes kanaleve të izoluara.

---

## 🔒 Karakteristikat Kryesore të Sigurisë (Security Layer)

*   **Autentikimi Institucional strikt:** Regjistrimi dhe qasja në aplikacion lejohet në mënyrë rigoroze vetëm për përdoruesit e pajisur me email zyrtar studentor të UP-së (`@student.uni-pr.edu`), duke krijuar një rrjet të mbyllur dhe të sigurt.
*   **Mekanizmi i Rikuperimit me Email Dytësor:** Çdo student gjatë regjistrimit lidh një adresë personale të dytë (si Gmail, Outlook etj.), ku dërgohet një lidhje (link) e sigurt e gjeneruar nga Firebase për rivendosjen e fjalëkalimit.
*   **Rregullat Granulare të Sigurisë (Firestore Rules):** Implementimi i rregullave strikte në anën e serverit garanton izolimin e të dhënave. Studentët kanë të drejtë të lexojnë të gjithë përmbajtjen akademike, por mund të modifikojnë vetëm biografinë e tyre dhe të fshijnë ekskluzivisht postimet e krijuara nga vetë ata.

---

## 🚀 Funksionalitetet e Aplikacionit (Application Modules)

*   **Kanalet e Komunikimit dhe Bisedat Private:** Menaxhimi i kanaleve zyrtare të ndara sipas fakulteteve (FIEK, FSHMN, Ekonomik, etj.) dhe bisedat private ndërmjet studentëve. Ky modul përfshin një sistem kërkesash për shoqëri (Pending/Incoming), integrimin e reaksioneve me Emoji dhe shpërndarjen e lidhjeve akademike.
*   **Katalogu i Klubeve Studentore:** Një modul i dedikuar që mundëson krijimin e klubeve akademike. Krijuesi i klubit merr rolin e Presidentit dhe menaxhon me leje pranimet (Access Control) e studentëve nga fakultetet e tjera, duke nxitur bashkëpunimin ndërfakultetor.
*   **Depoja e Burimeve Akademike:** Portali qendror për ngarkimin, katalogimin dhe kërkimin e materialeve mësimore dhe lidhjeve të Cloud Storage (si Google Drive apo OneDrive) të organizuara sipas lëndëve dhe departamenteve përkatëse.
*   **Muri i Njoftimeve Persistente:** Publikimi i njoftimeve zyrtare universitare (lajme globale ose specifike për fakultet) të cilat ruhen në mënyrë të qëndrueshme dhe shfaqen në kohë reale te përdoruesit.
*   **Qendra e Jetës Studentore (Campus Lifestyle Hub):** Një udhëzues i unifikuar për jetën studentore in Prishtinë. Përfshin Kalendarin Akademik të UP-së, linjat e Trafikut Urban (për udhëtimin falas me kartelë ID), aplikimet online për Mensë/Konvikte dhe kuponat e zbritjeve ekskluzive për studentë.

---

## 🛠 Teknologjitë e Përdorura (Technology Stack)

*   **Frontend & UI/UX:** React Native, React Native Web dhe JavaScript (duke përdorur komponentë si `FlatList`, `KeyboardAvoidingView`, `Modal` dhe `Switch`).
*   **Mjedisi i Ekzekutimit:** Projektuar dhe optimizuar për mjediset **Web** (shfletues si Google Chrome) dhe **Android** nativ.
*   **Prapavija (Backend):** Firebase Core Engine, Firebase Authentication dhe Firebase Cloud Firestore (si bazë e të dhënave NoSQL në kohë reale).
*   **Mjedisi i Zhvillimit (IDE):** WebStorm.
*   **Paketuesit dhe Përpiluesit:** Metro Bundler dhe Babel Compiler.

---

## 📂 Struktura Arkitekturore e Dosjeve (Project Architecture)

*   `src/config/firebase.js` – Konfigurimi zyrtar i Firebase Cloud dhe implementimi i filtrit të domenit institucional `@student.uni-pr.edu`.
*   `src/context/AuthContext.js` – Konteksti global për menaxhimin e seancës së përdoruesit (session management) dhe kontrollin e temës vizuale (Dark Mode).
*   `src/navigation/AppNavigator.js` – Naviguesi qendror që integron panelin lundrues (Floating Bottom Tab Bar) me gjashtë direktoritë kryesore të aplikacionit.
*   `src/components/MessageBubble.js` – Komponenti modular i flluskave të bisedës me mbështetje për reaksione (stili Discord), shfaqje të skedarëve dhe formatim të emrave.
*   `src/screens/LoginScreen.js` – Ndërfaqja e kyçjes (Login), regjistrimit me përzgjedhje të fakultetit dhe formularit për rikuperimin e llogarisë.
*   `src/screens/ChannelsScreen.js` – Filtrimi i kanaleve sipas fakulteteve dhe menaxhimi i listës së miqve (fshirja e bisedave dhe opsioni Unfriend).
*   `src/screens/ChatScreen.js` – Ndërfaqja e bisedës live me kontroll të statusit të kërkesave dhe panel të integruar të reaksioneve.
*   `src/screens/ProfileScreen.js` – Muri personal i studentit që menaxhon krijimin/fshirjen e postimeve, pëlqimet, komentet dhe modifikimin e biografisë apo sigurisë.
*   `src/screens/MaterialsScreen.js` – Portali i dedikuar për ngarkimin, indeksimin dhe kërkimin filtrues të burimeve akademike.
*   `src/screens/NewsScreen.js` – Paneli i shpërndarjes dhe leximit të njoftimeve universitare, i integruar me `AsyncStorage` për ruajtje lokale.
*   `src/screens/StudentLifeScreen.js` – Kalendari në kohë reale i Universitetit të Prishtinës, menaxhimi i linjave të transitit publik dhe ofertave për studentë.

---

## 💻 Udhëzuesi i Ekzekutimit dhe Konfigurimit (Execution Guide)

Aplikacioni është i gatshëm për ekzekutim të menjëhershëm në mjedisin **Web** dhe **Android**. Për shkak të natyrës "serverless", kodi zbaton një kontroll dinamik të mjedisit ekzekutues (window check) për të garantuar përputhshmëri të plotë të komponentëve.

### Nisja e Serverit të Zhvillimit
Për të startuar mjedisin e punës, ekzekutoni komandën e mëposhtme në terminalin e projektit:

```bash
npx expo start
```

Pasi kodi të paketohet përmes *Metro Bundler*, në terminal do të shfaqet një meny interaktive e cila ju lejon të zgjidhni mjedisin e dëshiruar:

*   `w` - Hap aplikacionin automatikisht në ueb shfletues (Web Browser).
*   `a` - Ekzekuton aplikacionin në emulatorin Android ose në pajisjen fizike.
*   `r` - Rinvon dhe rifreskon (reload) aplikacionin në kohë reale.

### 🌐 1. Ekzekutimi në Mjedisin Web
Pasi të shtypet tasti `w`, shfletuesi hapet automatikisht në adresën lokale.
*   **Përkthimi Semantik:** Sistemi përdor *React Native Web* për të përkthyer komponentët nativë në elemente standarde HTML5/DOM.
*   **Anashkalimi i CORS:** Gjatë ngarkimit të skedarëve, sistemi shndërron skedarin në një objekt binar (`Blob`) për të shmangur bllokimet nga politika e sigurisë *Same-Origin Policy*.

### 🤖 2. Ekzekutimi në Mjedisin Android (Nativ)
Ekzekutimi në Android realizohet përmes skanimit të kodit QR me aplikacionin *Expo Go* ose përmes një *Development Build*. Në këtë mjedis, aplikacioni përdor shtigjet lokale (`File URI`) për qasje të shpejtë në kujtesën e telefonit.

#### Skedarët Kryesorë të Konfigurimit Nativ (`/android`):
1.  **`MainActivity.java`** – Pika kryesore e hyrjes duke konfiguruar emrin e komponentit (`PrishtinaConnect`).
2.  **`MainApplication.java`** – Menaxhon ciklin e jetës dhe inicializimin e paketave native përmes `PackageList` dhe `SoLoader`.
3.  **`AndroidManifest.xml`** – Definon lejet kritike si `android.permission.INTERNET`.
4.  **`build.gradle` (Moduli: app)** – Integron plugin-in `com.google.gms.google-services` për Firebase.
5.  **`build.gradle` (Projekti: Rrënja)** – Vendos versionet globale të SDK-së (Min SDK: 21, Compile SDK: 33).

---

## 🍏 3. Udhëzues për Zgjerimin e Platformës në iOS (Udhëzime për Zhvilluesit)

Ky projekt në formën e tij fillestare **nuk përfshin dosjen native të konfigurimit për iOS** dhe është optimizuar për Web dhe Android. Megjithatë, për shkak se kodi burimor është shkruar në *React Native*, çdo zhvillues i ardhshëm që dëshiron ta portojë (zgjerojë) këtë platformë edhe për pajisjet **Apple (iPhone/iPad)**, duhet të ndjekë këto hapa inxhinierikë:

1.  **Gjenerimi i Direktorisë Native:** Duhet të xhirohet komanda `npx expo prebuild` ose të konfigurohet struktura bare-metal për të krijuar direktorinë `/ios`. Ky proces kërkon detyrimisht një kompjuter me sistem operativ **macOS** dhe veglen zyrtare **Xcode**.
2.  **Konfigurimi i Firebase për iOS:** Duhet të hyni në konsolën e Firebase, të shtoni një aplikacion të ri të tipit iOS brenda të njëjtit projekt, dhe të shkarkoni skedarin e konfigurimit **`GoogleService-Info.plist`**. Ky skedar duhet të importohet direkt brenda projektit në Xcode.
3.  **Menaxhimi i Varësive (CocoaPods):** Për të lidhur libraritë e shkruara në JavaScript me kodin nativ të iOS, zhvilluesi duhet të lundrojë në direktorinë e re `/ios` përmes terminalit dhe të ekzekutojë instalimin e "podeve":
    ```bash
    cd ios
    pod install
    ```
4.  **Deklarimi i Lejeve të Privatësisë (`Info.plist`):** Për të lejuar që funksionet e aplikacionit si ngarkimi i fotove të profilit të funksionojnë në iPhone, zhvilluesi duhet të shtojë lejet për qasje në galeri dhe kamerë (`NSCameraUsageDescription` dhe `NSPhotoLibraryUsageDescription`) brenda skedarit të konfigurimit `Info.plist`.
