# PlatformaDigitizare

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
