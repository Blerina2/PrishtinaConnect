# Prishtina Connect 🎓

Platformë komunikimi e mbyllur dhe në kohë reale e dedikuar ekskluzivisht për studentët e Universitetit të Prishtinës "Hasan Prishtina". Ky portal shërben si një pikë qendrore për shkëmbimin e materialeve, lajmeve akademike, menaxhimin e klubeve studentore dhe bisedave live.

## 🔒 Karakteristikat Kryesore të Sigurisë
* **Verifikim strikt i domenit**: Regjistrimi dhe kyçja në aplikacion lejohet vetëm për përdoruesit me email zyrtar studentor të UP-së (`@student.uni-pr.edu`).
* **Sistemi i Rikuperimit me Backup Email**: Çdo student regjistron një email personal të dytë (si Gmail) ku dërgohet linku i sigurt i Firebase për rivendosjen e fjalëkalimit.
* **Firestore Security Rules**: Rregulla strikte të sigurisë që garantojnë izolimin e të dhënave. Studentët mund të lexojnë gjithçka, por mund të ndryshojnë vetëm biografinë e tyre dhe të fshijnë vetëm postimet që i kanë krijuar vetë.

## 🚀 Funksionalitetet e Aplikacionit
* **Chat Kanale & Biseda Private**: Kanalet zyrtare të fakulteteve (FIEK, FSHMN, Ekonomik, etj.) dhe bisedat private ndërmjet studentëve me sistem kërkesash (Pending/Incoming), reaksione me Emoji dhe dërgim të linqeve akademike.
* **Katalogu i Klubeve Studentore**: Mundësia për të krijuar klube ku krijuesi merr statusin e Presidentit dhe menaxhon me leje pranimet e studentëve nga fakultetet e tjera.
* **Burimet Akademike **: Ndarja e materialeve mësimore dhe linqeve të Google Drive/OneDrive sipas lëndëve dhe fakulteteve, me motor kërkimi të integruar.
* **Muri i Njoftimeve **: Publikimi i njoftimeve zyrtare universitare (lajme globale ose specifike për fakultet) të ruajtura në mënyrë persistente.
* **Campus Lifestyle Hub**: Guidë e plotë për jetën studentore në Prishtinë, përfshirë Kalendarin Akademik të UP-së, linjat e Trafikut Urban (udhëtimi falas me ID kartelë), aplikimet online për Menzë/Konvikte dhe kuponat e zbritjeve.

## 🛠 Teknologjitë e Përdorura
* **Frontend/UI**: React Native, React Native Web & JavaScript (FlatList, KeyboardAvoidingView, Modal, Switch).
* **Mjedisi i Ekzekutimit**: Optimizuar për Google Chrome (Web Browser) dhe pajisje celulare.
* **Prapavija (Backend)**: Firebase Core Engine, Firebase Authentication & Firebase Firestore (Real-time NoSQL Database).
* **IDE**: WebStorm
* **Paketuesi**: Metro Bundler & Babel.

## 📂 Struktura e Dosjeve (Architecture)
* `src/config/firebase.js` - Konfigurimi zyrtar i Firebase Cloud dhe filtrimi i domenit `@student.uni-pr.edu`.
* `src/context/AuthContext.js` - Konteksti global për menaxhimin e seancës së përdoruesit dhe Temës së Errët (Dark Mode).
* `src/navigation/AppNavigator.js` - Naviguesi qendror me panelin lundrues (Floating Bottom Tab Bar) me 6 direktori kryesore.
* `src/components/MessageBubble.js` - Komponenti i flluskave të bisedës me mbështetje për reaksione (Discord style), skedarë dhe emra të formatuar.
* `src/screens/LoginScreen.js` - Formularët luksozë të Kyçjes, Regjistrimit me përzgjedhje fakulteti dhe Rikuperimit të llogarisë.
* `src/screens/ChannelsScreen.js` - Filtrimi i kanaleve të fakultetit dhe menaxhimi i miqve (fshirja e bisedave dhe opsioni Unfriend).
* `src/screens/ChatScreen.js` - Ndërfaqja live e bisedave me kontroll të statusit të kërkesave dhe panel të reaksioneve.
* `src/screens/ProfileScreen.js` - Muri personal i studentit, krijimi/fshirja e postimeve, pëlqimet, komentet dhe modifikimi i biografisë/sigurisë.
* `src/screens/MaterialsScreen.js` - Portali i ngarkimit dhe kërkimit të linqeve të burimeve akademike.
* `src/screens/NewsScreen.js` - Paneli i shpërndarjes dhe leximit të njoftimeve universitare (i integruar me AsyncStorage).
* `src/screens/StudentLifeScreen.js` - Kalendari real-time i UP-së dhe menaxhimi i linjave të transitit e ofertave studentore.
