# PlatformaDigitizare

Platforma pentru preprocesarea, recunoasterea, transliterarea si editarea documentelor chirilice

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

![](media/image15.png)![](media/image13.png)![](media/image5.png)

Figura 1. Interfața grafică care indică pașii din ciclu de digitizare și
3 stări diferite ale unui ciclu de digitizare a unui document. În partea
stângă este un ciclu de digitizare care a început, în mijloc este afișat
un ciclu de digitizare care incomplet, iar în dreapta este afișat un
ciclu de digitizare complet.

În continuare vom descrie în detaliu fiecare pas din ciclu de
digitizare.

1.  **Încărcarea fișierelor**

Într-un singur ciclu de digitizare pot fi prelucrate unul sau mai multe
fișiere. Se acceptă următoarele tipuri de fișiere: **png, jpeg, tiff și
pdf**. Mărimea totală nu trebuie să depășească 700MB, iar mărimea
fiecărui fișier are limita de 100MB. Fișierele pot fi selectate din
calculatorul utilizatorului la tastarea butonului roșu „Selectează
fișierele din calculatorul tău” (vezi figura 2), sau la tragerea
fișierelor din calculator prin „Drag and Drop”.

În figura 2 este afișată interfața grafică pentru încărcarea fișierelor
din calculatorul utilizatorului. La apăsarea butonului „Selectează
fișierele din calculatorul tău”, utilizatorul va putea selecta unul sau
mai multe fișiere (documente) care urmează a fi digitizate. Atunci când
vor fi selectate mai două sau mai multe fișiere, trebuie de luat în
considerare că toate aceste fișiere vor fi procesate cu aceleași opțiuni
de procesare, respectiv, utilizatorul trebuie să se asigure că fișierele
încărcate sunt din aceeași perioadă, au unul și același alfabet și
necesită aceleași opțiuni de preprocesare a imaginii. Dacă utilizatorul
are seturi de documente din mai multe perioade sau care necesită opțiuni
diferite de preprocesare a imaginii, atunci aceste seturi vor fi
digitizate în diferite cicluri de digitizare.

![](media/image3.png)

Figura 2. Interfața grafică pentru pasul 1, încărcarea fișierelor.

În figura 2 poate fi observat butonul „Info”. Acest buton este afișat în
interfața fiecărui pas din ciclul de digitizare. La apăsarea acestui
buton utilizatorul poate citi, dintr-o fereastră nouă (figura 3),
informații referitoare la pasul dat de digitizare.

![](media/image16.png)

Figura 3. Fereastra cu informații referitoare la pasul 1, care apare
când este apăsat butonul „Info” din interfața aceluiași pas.

Pentru a trece la pasul 2, utilizatorul poate tasta „Pasul următor” în
dreapta sus a paginii, sau „Continuă cu procesarea imaginii” în dreapta
jos a chenarului cu imaginile încărcate (vezi figura 4). Butonul
„Continuă cu procesarea imaginii” apare doar atunci când este selectat
cel puțin un fișier. De asemenea, este posibilitatea de a selecta un
fișier nou prin apăsarea butonului „Mai selectează un fișier”, sau de a
șterge unul sau mai multe fișiere prin apăsarea butonului „x” care se
află sub fiecare fișier în parte. Linia albastră din dreptul fiecărei
imagini afișate în figura 4 indică faptul că fișierul este încărcat cu
succes.

![](media/image4.png)

Figura 4. Starea interfeței grafice pentru pasul 1 când au fost
selectate două fișiere.

Dacă au fost încărcate unul sau mai multe fișiere, utilizatorul poate
continua cu pasul 2, și anume cu preprocesarea imaginilor încărcate. În
continuare vom descrie cum poate fi folosit acest pas, ce motoare de
preprocesare a imaginii sunt propuse, inclusiv și opțiunile recomandate
de preprocesare.

2.  **Preprocesarea imaginilor încărcate**

La acest pas, utilizatorul poate sa aleagă motorul de preprocesare și
opțiunile de preprocesarea necesare paginilor sale. La momentul dat
sunt disponibile 3 motoare de preprocesare: ScanTailor, FineReader 15 și
OpenCV. Fiecare din aceste motoare oferă opțiuni de preprocesare
diferite (cu unele opțiuni comune), iar cele setate implicit sunt
opțiuni de preprocesare a imaginii recomandate înainte de recunoașterea
optică a caracterelor. În figura 5 este reprezentat pasul cu
preprocesarea imaginii. Utilizatorul poate selecta unul din cele 3
motoare de preprocesare. Butonul „Start preprocesare” este dezactivat
atâta timp cât nu este selectat nici un motor de preprocesare.

![](media/image8.png)

Figura 5. Interfața grafică pentru pasul 2, preprocesarea imaginii.

**ScanTailor** este primul motor de preprocesare din această listă și
oferă cea mai largă gamă de opțiuni de preprocesare din toate cele trei
motoare propuse. În această platformă, spre deosebire de celelalte
motoare, se propun două modalități de utilizare a motorului ScanTailor
pentru preprocesarea imaginii (vezi figura 6): a) Desktop - cu
integrarea propriu-zisă a aplicației ScanTailor, împreună cu
instrucțiunile pentru utilizator; b) Web - cu opțiuni de bază de
preprocesare a imaginii recomandate prin folosirea api-ului
_scantailor-cli_ din varianta web a platformei. Modalitatea Desktop de
preprocesare cu ScanTailor este disponibilă doar în varianta desktop a
platformei și oferă mai multe opțiuni de preprocesare, inclusiv opțiuni
de tăiere manuală a imaginii, selectarea manuală a conținutului,
curățarea manuală a petelor din imagine, etc. În varianta Web sunt
selectate doar opțiunile cele mai necesare, fără de a se lua în
considerare imaginile excepționale (care au nevoie de unele setări
speciale).

![](media/image12.png)![](media/image14.png)

Figura 6. Două modalități de preprocesare cu ScanTailor: în stânga -
preprocesarea Desktop, în dreapta - opțiuni de preprocesare Web.

![](media/image10.png)

Figura 7. Alte opțiuni de preprocesare a imaginii cu ScanTailor.

Luând în considerare că preprocesarea imaginii cu ScanTailor este
descrisă în capitolul II din teză, în continuare voi scrie doar despre
opțiunile de bază selectate din ScanTailor care au fost integrate în
varianta web a platformei. Din aceste opțiuni fac parte:

1.  > Setarea rezoluției pentru imaginea procesată. Rezoluția
    > recomandată aici este de 600 dpi, iar rezoluția maximă admisă din
    > interfața grafică este de 1200 dpi. Această opțiune este utilă
    > atunci când încercăm să procesăm documente din secolul XVII, care
    > necesită o rezoluție optimă între 800 și 1200 dpi înainte de
    > recunoașterea optică. În documentele din secolul XVII se folosesc
    > pe larg semne diacritice, ligaturi verticale, iar din aceste
    > considerente se recomandă o rezoluție mai mare pentru imagine
    > preprocesată.

2.  > Convertirea culorii imaginii în alb-negru (binarizare), în tonuri
    > de gri (grayscale) și convertire mixtă. Modul mixt este utilizat
    > pentru documentele în care există imagini semiton (tonuri de gri
    > sau culoare). Zonele vor fi detectate automat și afișate așa cum
    > sunt, colorate sau gri. Restul zonelor vor fi convertite în
    > alb-negru. Această setare este disponibilă doar în ScanTailor, pe
    > când FineReader oferă doar opțiunea de convertire în alb-negru.
    > Opțiunea implicită a acestei setări este convertirea imaginii în
    > alb-negru.

3.  > Reducerea zgomotului (despeckle) sau curățarea imaginii de gunoi
    > (eliminarea punctelor, petelor suplimentare din imagine). Punctele
    > suplimentare din imagine au diferite mărimi și pot fi eliminate
    > doar prin selectarea opțiunii corecte ale acestei setări. Această
    > setare are următoarele opțiuni: _fără curățare; curățare precaută;
    > curățare normală; și curățare agresivă_. Curățarea petelor
    > suplimentare nu se bazează doar după un filtru de mărime. Modelul
    > este mai complicat. Există o limită superioară a dimensiunii, iar
    > obiectele mai mari nu vor fi șterse. Literele depășesc această
    > limită, dar nu și semnele de punctuație. Un obiect poate ține un
    > alt obiect dacă nu este prea mare sau prea departe. Acel obiect,
    > la rândul său, poate ține și alte obiecte și așa mai departe.
    > Pentru fiecare obiect se verifică dacă există vreun deținător de
    > obiect în lanț care a atins limita superioară de dimensiune.
    > Această setare nu este disponibilă când se convertește imaginea în
    > tonuri de gri.

4.  > Orientarea imaginii. Din această setare este posibilă întoarcerea
    > imagini cu multipli de 90 de grade, pentru a corecta orientarea
    > scanărilor laterale sau inversate cu susul în jos (upside-down).
    > Aceasta este o setare manuală, deoarece ScanTailor nu știe cum să
    > determine orientarea corectă a imaginii - utilizatorul trebuie să
    > facă acest lucru. Acest lucru înseamnă, de asemenea, că utilizarea
    > procesării mai multor imagini cu orientări diferite este inutilă.
    > Imaginile cu orientări diferite vor fi procesate individual în
    > diferite cicluri de digitizare. Sunt propuse următoare opțiuni de
    > orientare: _fără îndreptarea orientării, întoarce spre stânga,
    > întoarce spre dreapta, și întoarce cu susul în jos._

5.  > Detectarea conținutului din imagine. Această setare determină
    > regiunea dreptunghiulară cu conținut util sau utilizabil. De ce
    > trebuie definite limitele conținutului? În primul rând, pentru a
    > determina dimensiunea imaginii preprocesate la ieșire. În al
    > doilea rând, pentru ca imaginile finale să nu arate linia de
    > pliere sau alte resturi de pe margini - astfel marginile sunt
    > completate cu zone de alb pe la margini. Sunt disponibile
    > următoarele opțiuni: d*etectare precaută, detectare normală,
    > detectare agresivă*. Algoritmul de detectare se comportă analog
    > algoritmului de curățarea a gunoiului din imagine. Opțiunea setată
    > implicit este „detectare normală” a conținutului, iar utilizatorul
    > trebuie să fie atent la opțiunea „detectare agresivă”, întrucât
    > poate primi la ieșire doar un mic fragment de conținut din
    > imaginea originală. Tot de aici, este opțiunea de a adăuga sau nu
    > margini albe imprejurul imaginii procesate (vezi figura 7).

6.  > Corectarea iluminării din imagine. În mod implicit, această setare
    > nu este activată și se folosește atunci când imaginile nu au o
    > iluminare uniformă după fotografiere sau scanare. Acest lucru
    > poate fi observat când în imagine sunt umbre ale unor obiecte.

7.  > Setarea grosimii caracterelor. Această opțiune este unul dintre
    > punctele forte a motorului ScanTailor față de FineReader și
    > OpenCV. Cu această opțiune utilizatorul poate îngroșa sau subția
    > unele obiecte din imagine, cum ar fi literele, unele semne de
    > punctuație, liniile de margine alte tablelor, dar și alte
    > caractere. Valoarea implicită a acestei setări este 0, iar
    > utilizatorul poate selecta valori mai mari decât 0 pentru a
    > îngroșa obiectul (adaugare de pixeli negri) și valori mai mici
    > ca 0 pentru a subția obiectul (ștergerea de pixeli negri).

Din motoarele de procesare propuse în platformă, ScanTailor (desktop) ar
fi varianta cea mai bună pentru preprocesarea de documente vechi din
secolele XVII și XVIII. Acolo unde este nevoie de experimentarea cu
diferite valori de rezoluție și uneori de îngroșarea caracterelor.

Următorul motor de preprocesare disponibil în platformă este motorul de
preprocesare din **FineReader 15.** Din interfața platformei (vezi
figura 8) pot fi folosite deocamdată funcțiile de bază de preprocesarea
a imaginii, cum ar fi: _corectarea rezoluției imaginii_ sau _detectarea
rezoluției optimale pentru imaginea dată_; _corectarea automată a
orientării paginii_; _convertirea imaginii în alb-negru_; _reducerea
zgomotului ISO din imagine_; și _îndreptarea rândurilor de text_. Spre
deosebire de setările monitorului ScanTailor, aici utilizatorul pune sau
scoate bifa din dreptul opțiunii, adică folosește sau nu unele opțiuni
la preprocesarea documentelor sale. În mod implicit toate aceste opțiuni
sunt bifate și fac parte din setările recomandate.

![](media/image19.png)

Figura 8. Opțiuni de preprocesare a imaginii cu FineReader.

Informații adiționale referitoare la opțiunile de preprocesare
FineReader integrate în platformă sunt:

1.  > Divizarea imaginii în mai multe pagini. Se bifează această opțiune
    > când o imagine scanată conține mai multe pagini, ce e intalnit des
    > la scanarea cărților.

2.  > Corectarea automată a rezoluției imaginii. Această opțiune se
    > folosește mai des când imaginea a fost scanată cu o rezoluție mai
    > mică de 75 dpi și caracterele text se vad neclar la zoom, sau
    > pentru documentele speciale precum cele tipărite în secolul XVII.
    > Spre deosebire de ScanTailor, aici rezoluția optimă se detectează
    > automat.

3.  > Îndreptarea orientării paginii. Este o opțiune utilă chiar și
    > atunci când imaginea este inclinata cu un unghi mic, sub 20 de
    > grade. Această înclinare se detectează automat și se îndreaptă
    > imaginea cu o precizie foarte înaltă.

4.  > Convertirea imaginii color in alb negru. Bifarea acestei opțiuni
    > va contribuie la o acuratețe sporită la recunoașterea optică a
    > caracterelor.

5.  > Reducerea zgomotului ISO - se folosește atunci cand în imagini se
    > observă multe puncte mici care pot afecta recunoașterea
    > caracterelor.

6.  > Îndreptarea randurilor de text. Se folosește atunci când
    > orientarea integrală a paginii este corectă, iar unele rânduri de
    > text sunt înclinate din cauza boțirii paginii la scanare sau
    > fotografiere.

Aceste setări de procesare a imaginii cu FineReader se folosesc pentru a
îmbunătăți calitatea imaginilor documentelor pentru procesul de
recunoaștere. În acest fel, chiar și imaginile cu o calitate scăzută
sau documentele fotografiate cu smartphone-ul pot fi procesate eficient
și oferă rezultate de recunoaștere ridicate. În continuare vom descrie
un un alt motor de preprocesare a imaginii, integrat în platformă, și
nume - OpenCV.

În platforma de digitizare, **OpenCV** permite, ca și în cazul lui
ScanTailor, setarea manuală a rezoluției imaginii preprocesate dar și
filtre de curățare a imaginii de pete și reducere a zgomotului ISO
integrate într-o singură opțiune (vezi figura 9), ceea ce simplifică
lucrul utilizatorului, dar totodată nu se asigură un control mai larg,
ca de exemplu, cel oferit de FineReader sau ScanTailor. Valoarea
implicită a rezoluției pentru imaginea preprocesată este de 300 dpi, iar
valoarea maximă care poate fi setată este 1200 dpi.

![](media/image2.png)  
Figura 9. Opțiuni de preprocesare a imaginii cu OpenCV.

Atunci când utilizatorul a selectat motorul și opțiunile necesare de
preprocesare a imaginilor sale, va tasta butonul „Start preprocesare”
prezentat în figura 9 pentru procesarea imaginii și vizualizarea
rezultatului obținut (vezi figura 10). Imaginile originale și cele
obținute după preprocesare sunt afișate în interfața platformei pentru
a fi vizualizate și verificate de către utilizator. Dacă utilizatorul nu
este mulțumit de imaginea preprocesată, poate selecta alt motor de
preprocesare sau poate modifica setările curente pentru a obține un
rezultat satisfăcător și de a putea merge mai departe la pasul cu
recunoașterea optică a caracterelor. Odată obținut un rezultat
satisfăcător la preprocesarea imaginii, utilizatorul poate merge la
pasul următor prin apăsarea butonului „Mergi la pasul următor - OCR”.

![](media/image22.png)

Figura 10. Imaginea originală și imaginea preprocesată cu motorul OpenCV
afișate în interfața grafică a platformei.

În continuare vom descrie informațiile necesare referitoare la
utilizarea opțiunilor din pasul 3 din ciclul de digitizare -
recunoașterea optică a caracterelor.

3.  **Recunoașterea optică a caracterelor - OCR**

La acest pas utilizatorul selectează perioda și alfabetul documentului
(vezi figura 11). Aici sunt integrate șabloane (modele) de recunoaștere
optică pentru secolele XVII, XVIII, XIX, XX. Pentru secolul XX sunt
integrate 2 șabloane, unul învățat cu caractere din alfabetul chirilic
sovietic pe baza lucrării \[N\], celălalt cu litere din alfabetul
românesc (șablon integrat în FineReader 15). Pentru recunoașterea unui
document din secolul XIX au fost integrate șabloane învățate pe
caracterele din următoarele lucrări:

- > Legiuire, 1818, G. Caragea (116 pagini cu caractere din alfabetul
  > chirilic românesc)

- > Epistolariul românesc, 1841 (peste 250 pagini cu caractere din
  > alfabetul de tranziție)

- > Elemente de aritmetică, 1836, G. Asachi (214 pagini)

Utilizatorul poate selecta șablonul cel mai apropiat de perioada
documentului său. Pentru secolul XVIII sunt integrate șabloane învățate
pe baza documentelor, toate tipărite în alfabetul chirilic românesc:

- > De Obște Geografie, 1795 (peste 150 pagini)

- > Ducere de mână către aritmetică, 1785 (peste 100 pagini)

- > Fiziognomie, 1785 (141 pagini)

- > Așezământ, 1786 (90 pagini)

Pentru secolul XVII este integrat deocamdată un singur șablon învățat pe
baza documentului _Noul Testament_, tipărit în 1648 (peste 150 de
pagini).

![](media/image6.png)

![](media/image7.png)

![](media/image1.png)

![](media/image20.png)

Figura 11. Opțiuni OCR disponibile în platformă.

![](media/image9.png)

Figura 12. Exemplu de utilizare OCR din platformă (pasul 3) pentru un
document din secolul XVII.

4.  <span class="underline">Verificarea OCR</span>  
    Permite prelucrarea manuală a textului obținut din pasul anterior,
    dacă imediat (sau la pașii următori) este observată o neregularitate
    în conținutul generat. Sunt integrate instrumente de lucru cu text
    bogat dar tastatură virtuală pentru fiecare alfabet în parte.

![](media/image17.png)

Figura 13. Exemplu de verificare OCR din platformă (pasul 4) pentru un
document din secolul XVII.

5.  <span class="underline">Transliterare</span>

La acest pas textul OCR este transformat în scrierea latină. Aici
utilizatorul poate confirma setările selectate din pasul 2, precum și
confirma anumite preferințe stilistice văzute în imagine. Rezultatul
transliterării este 1 la 1 în scriere, și multe reguli de scriere
moderne din limba română sunt ignorate (ex: _chee_ în loc de _cheie_).
Aceste erori pot însă fi rezolvate la pasul următor.  
![](media/image21.png)

6.  <span class="underline">Verificarea transliterației:</span>
    Asemenea pasului 4, utilizatorul are posibilitatea de a analiza
    textul obținut din transliterare, și include niște editări manuale
    pe care le observă.

![](media/image11.png)

7.  <span class="underline">Obținerea rezultatului:</span>
    În urma îndeplinirii pașilor 1-6 este obținut un text. La acest pas
    textul poate fi descărcat în formatul preferat de utilizator. La
    moment sunt disponibile TXT și DOC. Textul este presupus cu un număr
    observabil de erori, de aceea o funcție importantă a documentului
    este editarea și prelucrarea continuă, de aceea formatul PDF (ce
    este creat pentru citire și complică enorm editarea) nu este inclus.

![](media/image18.png)
