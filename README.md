# Platforma de Digitizare

Platformă pentru preprocesarea, recunoașterea, transliterarea și editarea documentelor chirilice românești.

## Install

### Frontend setup (make sure you have npm installed on your machine)

1. Enter frontend folder
   `cd frontend`
2. Install the packages with npm
   `npm install`
3. Run the server
   `npm start`

### Backend setup (make sure you have python 3 on your machine)

1. Enter backend folder
   `cd backend`

2. Create virtual environment with the name _venv_
   `python -m venv venv`

3. Activate the virual environment
   `.\venv\Scripts\activate`

4. Install the packages with pip
   `pip install -r requirements.txt`

5. Run the server
   `python manage.py runserver`

## About and Features

Platforma de digitizare este o aplicație web/desktop scrisă în Python și
Javascript, care permite încărcarea imaginilor sau documentelor PDF,
extragerea automată a textului prin recunoașterea optică a caracterelor
(OCR), transliterarea acestuia în scrierea latină (alfabetul român
modern), editarea și exportarea rezultatelor ca text, document TXT, sau
eventual DOC.

Platforma de digitizare are ca scop integrarea instrumentarului de
digitizare a textelor din patrimoniul istorico lingvistic românesc
\[N\]. Instrumentarul de digitizare include: instrumente de preprocesare
a imaginii cum ar fi ScanTailor \[N\], FineReader Image Pre-processing
\[N\] și OpenCV \[N\]; șabloane de recunoaștere optică a caracterelor
chirilice și dicționare de cuvinte pentru secolele XVII, XVIII, XIX și
XX; soft de transliterare din chirilică în latină elaborat la IMCS;
editor de texte împreună cu tastaturi virtuale speciale caracteristice
alfabetelor folosite în perioadele sus menționate, și anume _alfabetul
chirilic românesc, alfabete de tranziție, alfabetul chirilic sovietic,
alfabetul românesc modern_. Esența integrării acestor instrumente
într-un întreg, într-o singură platformă, este de a asigura
utilizatorul cu o interfață grafică unică din care să poată controla
procesul de digitizare a documentului său. Platforma include pașii
procesului de digitizare, iar la fiecare pas utilizatorul este ghidat în
acțiunile caracteristice acelui pas.

Arhitectura curentă a aplicației permite digitizarea unui document în 7
pași, unii dintre care fiind opționali, cu posibilitatea de a fi săriți.
Procesul de traversare a acestor pași este numit _ciclu de digitizare_.
Un ciclu de digitizare include, în următoarea ordine, încărcarea
imaginilor sau/și a fișierele PDF, preprocesarea imaginii, recunoașterea
optică a caracterelor din imagine, verificarea și editarea textului
recunoscut, transliterarea textului după verificarea textului
recunoscut, verificarea și editarea textului transliterat și la final
salvarea rezultatelor în baza de date și/sau descărcarea acestora în
calculatorul utilizatorului. În figura 1 este afișat un fragment din
interfața grafică a platformei cu pașii din ciclu de digitizare - în
stânga este afișată interfața grafică pentru ciclul de digitizare în
faza incipientă a unui document care urmează a fi digitizat, în mijloc
este afișată interfața grafică pentru un document care se află la pasul
4 din ciclul de digitizare - pasul cu verificarea și editarea textului
recunoscut, iar în dreapta este afișată interfața grafică pentru un
ciclu de digitizare complet, atunci când documentul a ajuns la ultimul
pas (pasul 7) din ciclu de digitizare. Interfața grafică cu pașii din
ciclu de digitizare își schimbă starea în dependență de completarea
fiecărui pas în parte. Un pas completat este marcat de culoarea
albastru închis a fundalului pasului, respectiv și o bifă într-un
cerculeț verde. Fundalul albastru deschis al unui pas de digitizare
indică starea curentă din ciclul de digitizare a documentului.


## Resources
https://stackoverflow.com/questions/8408046/how-to-change-the-name-of-a-django-app

## Acces la corectarea Codex

Endpoint-ul `codex-correct/` necesită o cheie locală, care nu este inclusă în
frontend și nu este salvată în baza de date. Pentru a vedea cheia curentă din
terminalul calculatorului pe care rulează backend-ul:

`cd backend`

`venv\Scripts\python.exe manage.py codex_access_key --show`

Cheia se introduce în panoul compact din Pasul 3 sau Pasul 5 și este păstrată
numai în `sessionStorage`, până la închiderea tabului. În Pasul 3, Codex compară
textul OCR cu imaginea procesată corespunzătoare și propune numai modificări
care trebuie validate de utilizator. Auditul vizual este disponibil numai pentru
imagini; documentele PDF sunt excluse. Referințele imaginilor sunt semnate de
backend, expiră și nu permit trimiterea unor URL-uri sau căi arbitrare.

Pentru a invalida toate sesiunile și a genera o cheie nouă:

`venv\Scripts\python.exe manage.py codex_access_key --rotate`

Dacă `CODEX_ACCESS_KEY` este definită în `.env` sau în environment, rotația se
face acolo, urmată de repornirea backend-ului; comanda `--rotate` va refuza să
creeze o cheie concurentă în fișier.

## ScanTailor pe server, în pasul 2

Implementarea a fost verificată pe Windows cu `C:\ScanTailor\scantailor-cli.exe`,
versiunea **0.9.11.1**. Executabilul se găsește prin PATH sau se configurează în
`backend/.env`: `SCANTAILOR_CLI_PATH=C:\ScanTailor\scantailor-cli.exe`.
`SCANTAILOR_ENABLED=false` dezactivează acest motor. Diagnosticul `/health/`
afișează disponibilitatea și versiunea CLI.

Formularul permite DPI sursă și rezultat separate, culoare, orientare,
îndreptare automată/unghi manual, încadrare, detectarea conținutului, margini în
mm, aliniere, eliminarea punctelor, grosimea textului, uniformizarea iluminării
și corectarea curburii. Se încarcă o pagină per imagine; împărțirea unei imagini
în două pagini și PDF-urile nu sunt acceptate de acest adaptor. Rezultatele sunt
PNG fără pierderi, în directoare distincte pentru fiecare cerere.

### Diferențe CLI/UI reproduse pe această mașină

- `--deskew=auto` produce în realitate `mode="manual"`, unghi zero. Omiterea
  argumentului păstrează modul automat; pe `samples/5.jpg` a detectat −1°.
- Toate valorile `--despeckle` testate produc `despeckleLevel=""` în proiectul
  salvat; `--dewarping=auto` rămâne `off`, iar `--depth-perception=1.5` rămâne 2.
- `--orientation=none` este documentat în help, dar este respins de parser.
- Culoarea trebuie specificată explicit prin CLI și când se citește un proiect;
  altfel executabilul testat o resetează la alb-negru.

Adaptorul generează intern un proiect `.ScanTailor` cu setările de output în
formatul UI și îl procesează cu CLI. Nu transmite opțiunile defectuoase de
despeckle/dewarping/depth, omite deskew pentru modul automat și orientation
pentru lipsa rotirii. Culoarea și geometria sunt transmise explicit, împreună cu
etapele 1–6. Nu se acceptă proiecte XML arbitrare de la client.

Testele cu executabilul real recitesc proiectul salvat de CLI pentru a verifica
modul de îndreptare, unghiul, marginea, alinierea, DPI, culoarea, grosimea textului,
despeckle și dewarping. Aceste verificări nu demonstrează identitate pixel cu
pixel cu un export UI sau cu Advanced/Universal; ajustările manuale ale zonelor
și ale grilei de dewarping din UI nu sunt implementate în formular.

Istoric relevant: [autorul Advanced despre CLI-ul nefuncțional în 2017](https://github.com/4lex4/scantailor-advanced/issues/1),
[implementarea îndreptării în CLI clasic](https://github.com/scantailor/scantailor/blob/master/ConsoleBatch.cpp).
Raportul despre filtrele implicite greșite din 0.9.12.2 nu s-a reprodus în
executabilul local 0.9.11.1, care a executat toate cele șase etape și fără aceste
două argumente. Le păstrăm explicite pentru predictibilitate.

Limitele implicite sunt 10 imagini/cerere, 30 MB/imagine, 40 milioane pixeli la
intrare, 60 milioane pixeli estimați/la ieșire și 120 secunde/cerere. Un singur
job rulează per proces Django; cererile concurente primesc 429 și pot fi reluate.
`SCANTAILOR_TIMEOUT` și `SCANTAILOR_MAX_FILES` sunt configurabile.

### ABBYY Hot Folder: configurația verificată la 17 noiembrie 2026

Configurația completă, cu căi absolute și numele fișierelor `.hft`, este în
[snapshot-ul JSON](docs/hotfolder-windows-2026-11-17.json). Toate cele șapte
task-uri erau `Watching…` în UI, programate `everyMinute`, cu subfoldere incluse.
Valorile `paused` din unele fișiere `.hft` nu reflectau starea UI curentă.

Căile de mai jos sunt relative la
`C:\Users\tudor\Desktop\PlatformaDigitizare\backend\media\`.

| Task | Intrare | Ieșire | Formate |
|---|---|---|---|
| SecXX_preFR | `pre\FR` | `ocr\secolulXX\cyrillic` | TXT, DOCX, PDF căutabil |
| SecXX_PDF | `pdfs\secolulXX` | `ocr\secolulXX\cyrillic` | TXT, DOCX, PDF căutabil |
| SecXX_OpenCV | `pre\OpenCV` | `ocr\secolulXX\cyrillic` | TXT, DOCX, PDF căutabil |
| SecXVIII_Geografie_ScanTailor | `out` | `ocr\secolulXVIII` | TXT, DOCX, PDF căutabil |
| SecXVIII_Geografie_preFR | `pre\FR` | `ocr\secolulXVIII` | TXT, DOCX, PDF căutabil |
| SecXVII_PDF | `pdfs\secolulXVII` | `ocr\secolulXVII` | TXT, DOCX, PDF căutabil |
| SecXIX_Epistolariu_OpenCV | `pre\OpenCV` | `ocr\secolulXIX\cyrillicRomanian` | Numai TXT |

Niciun task nu urmărește `media` sau `pre\ScanTailor`. La cererea OCR, imaginile
noi ScanTailor sunt copiate atomic, cu nume unice, în `out` pentru XVIII și
`pre\OpenCV` pentru XIX/XX. Folderul OpenCV este comun celor două task-uri, deci
ambele pot procesa aceeași imagine. Pentru XVII nu există un task de imagini:
cererea raportează lipsa configurării, fără să aștepte un rezultat imposibil.
Căile se pot modifica prin `FINEREADER_SCANTAILOR_XVII_INPUT`,
`FINEREADER_SCANTAILOR_XVIII_INPUT`, `FINEREADER_SCANTAILOR_XIX_INPUT` și
`FINEREADER_SCANTAILOR_XX_INPUT`. Configurarea acestor variabile nu creează
task-uri ABBYY. Tesseract primește direct PNG-ul procesat când este selectat.

Verificare backend, din `backend` (PowerShell):

```powershell
$env:SCANTAILOR_INTEGRATION = '1'
.\venv\Scripts\python.exe manage.py test apps.access.tests apps.access.test_scantailor --noinput
```

Fără variabila `SCANTAILOR_INTEGRATION`, testul care pornește executabilul este
omis; celelalte teste folosesc directoare temporare și nu trimit fișiere către
Hot Folder-ul real.
