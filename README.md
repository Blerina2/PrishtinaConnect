# Prishtina Connect 🎓

Platformë komunikimi e mbyllur dhe në kohë reale e dedikuar ekskluzivisht për studentët e Universitetit të Prishtinës "Hasan Prishtina". 

## 🔒 Karakteristikat Kryesore të Sigurisë
* **Verifikim strikt i domenit**: Regjistrimi dhe kyçja në aplikacion lejohet vetëm për përdoruesit me email zyrtar studentor të UP-së (`@uni-pr.edu`).
* **Firestore Security Rules**: Baza e të dhënave NoSQL mbron mesazhet dhe kanalet përmes rregullave që lejojnë qasjen vetëm për studentët e autentikuar të UP-së.

## 🛠 Teknologjitë e Përdorura
* **Frontend/UI**: React Native & JavaScript (Komponentë Nativë Celularë si FlatList dhe KeyboardAvoidingView).
* **IDE**: WebStorm
* **Prapavija (Backend)**: Firebase Authentication & Firebase Firestore (Real-time NoSQL Database).
* **Paketuesi**: Metro Bundler & Babel.

## 📂 Struktura e Dosjeve (Architecture)
* `src/config/firebase.js` - Menaxhimi i instancave celulare dhe rregullit të domenit UP.
* `src/screens/LoginScreen.js` - Ndërfaqja e kyçjes së studentëve.
* `src/screens/ChannelsScreen.js` - Menaxhimi dhe krijimi i dhomave të bisedës sipas lëndëve/viteve.
* `src/screens/ChatScreen.js` - Transmetimi në kohë reale i mesazheve studentore.
* `src/screens/ProfileScreen.js` - Sistemi i profilit personal të studentit.
*