
export default {
    /**
    * Pasul 1: Upload
    */
    step1Info: {
        title: "Informații referitoare la pasul 1",
        body: `
        <p class="MsoNormal" style="text-align:justify;line-height:
150%"><a name="_Hlk136023690"><span lang="ro" style="font-size:12.0pt;line-height:
150%;font-family:&quot;Times New Roman&quot;,serif;mso-fareast-font-family:&quot;Times New Roman&quot;">Aplicația
de digitizare este o instanță demonstrativă a platformei de digitizare. Scopul
elaborării acestei aplicații este demonstrarea funcționalului unor module din
platformă. Aplicația permite digitizarea unui document în 7 pași,</span></a><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;"> unii dintre care fiind opționali,
cu posibilitatea de a fi omiși. Procesul de traversare a acestor pași îl vom
numi <i style="mso-bidi-font-style:normal">ciclu de digitizare</i>.<o:p></o:p></span></p>

<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%;border:none;mso-padding-alt:31.0pt 31.0pt 31.0pt 31.0pt;
mso-border-shadow:yes"><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif;mso-fareast-font-family:&quot;Times New Roman&quot;;
color:black;mso-color-alt:windowtext">În stânga
este afișată interfața grafică pentru ciclul de digitizare. Interfața
grafică cu pașii din ciclu de digitizare își schimbă starea în funcție de
completarea fiecărui pas în parte. Un pas parcurs este marcat de culoarea
albastru-închis a fundalului și o bifă într-un cerculeț verde. Fundalul
albastru-deschis al unui pas de digitizare indică starea curentă din ciclul de
digitizare a documentului.</span><span lang="ro" style="font-size:12.0pt;
line-height:150%;font-family:&quot;Times New Roman&quot;,serif;mso-fareast-font-family:
&quot;Times New Roman&quot;"><o:p></o:p></span></p>

<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%;border:none;mso-padding-alt:31.0pt 31.0pt 31.0pt 31.0pt;
mso-border-shadow:yes"><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif;mso-fareast-font-family:&quot;Times New Roman&quot;;
color:black;mso-color-alt:windowtext">Într-un singur ciclu de digitizare pot fi
prelucrate unul sau mai multe fișiere. Se acceptă următoarele tipuri de
fișiere: <span class="SpellE"><b style="mso-bidi-font-weight:normal">png</b></span><b style="mso-bidi-font-weight:normal">, <span class="SpellE">jpeg</span>, <span class="SpellE">tiff</span></b>. Mărimea totală a tuturor fișierelor încărcate nu
trebuie s</span><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif;color:black;mso-color-alt:windowtext">ă
depășească 700MB, iar mărimea fiecărui fișier are limita de 100MB. Fișierele
pot fi selectate din calculatorul utilizatorului. Atunci când vor fi selectate
două sau mai multe fișiere, se va lua în considerare că toate aceste fișiere
vor fi procesate cu aceleași opțiuni de procesare, prin urmare utilizatorul se va
asigura că fișierele încărcate sunt din aceeași perioadă, au unul și același
alfabet și necesită aceleași opțiuni de preprocesare a imaginii. Dacă
utilizatorul are seturi de documente din mai multe perioade sau care necesită
opțiuni diferite de preprocesare a imaginii, atunci aceste seturi vor fi
digitizate în diferite cicluri de digitizare.<span style="mso-spacerun:yes">&nbsp;
</span></span><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif"><o:p></o:p></span></p>
<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%;"><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif;color:black;mso-color-alt:windowtext">Unii
pași de digitizare au secțiune „Info” sau „?”. Această secțiune oferă
informații adiționale referitoare la pasul dat de digitizare. </span><span lang="ro" style="font-size:12.0pt;line-height:150%"><o:p></o:p></span></p>
<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%;border:none;mso-padding-alt:31.0pt 31.0pt 31.0pt 31.0pt;
mso-border-shadow:yes"><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif;color:black;mso-color-alt:windowtext">Utilizatorul
poate comuta pașii prin două căi. Prima cale include un buton adițional de
trecere la următorul pas care apare după ce se îndeplinesc acțiunile pasului
curent. Cea dea doua cale se realizează<span style="mso-spacerun:yes">&nbsp;
</span>prin comutarea pașilor utilizând butoanele meta de comutare.</span><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif"><o:p></o:p></span></p>
        `
    },

    /**
    * Pasul 2: Preprocesare
    */
    step2Info: {
        title: "Informații referitoare la pasul 2",
        body: `<p class="MsoNormal" style="text-align:justify;line-height:
        150%;border:none;mso-padding-alt:31.0pt 31.0pt 31.0pt 31.0pt;
        mso-border-shadow:yes"><span lang="ro" style="font-size:12.0pt;line-height:150%;
        font-family:&quot;Times New Roman&quot;,serif;color:black;mso-color-alt:windowtext">La
        acest pas utilizatorul poate sa aleagă motorul de preprocesare și opțiunile de
        preprocesare necesare paginilor sale. Varianta online pune la dispoziție 2 din 3 motoare de preprocesare: Scan Tailor, FineReader 15 si OpenCV. Motorul Scan Tailor este disponibil exclusiv in varianta desktop. </span><span lang="ro" style="font-size:12.0pt;
        line-height:150%"><o:p></o:p></span></p>

        <p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%;"><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif;color:black;mso-color-alt:windowtext"> În motorul
 <b style="mso-bidi-font-weight:normal">FineReader 15</b> pot fi testate
deocamdată funcțiile de bază de preprocesare a imaginii, cum ar fi: <i style="mso-bidi-font-style:normal">corectarea rezoluției imaginii </i>sau <i style="mso-bidi-font-style:normal">detectarea rezoluției optimale pentru
imaginea dată</i>; <i style="mso-bidi-font-style:normal">corectarea automată a
orientării paginii</i>;<i style="mso-bidi-font-style:normal"> convertirea
imaginii în alb-negru</i>;<i style="mso-bidi-font-style:normal"> reducerea
zgomotului ISO din imagine</i>; și <i style="mso-bidi-font-style:normal">îndreptarea
rândurilor de text</i>. </span><span lang="ro" style="font-size:12.0pt;
line-height:150%;font-family:&quot;Times New Roman&quot;,serif"><o:p></o:p></span></p>

<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%;"><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif;color:black;mso-color-alt:windowtext">Motorul
<b style="mso-bidi-font-weight:normal">OpenCV</b> permite setarea manuală a
rezoluției imaginii preprocesate, dar oferă și filtre de curățare a imaginii de
pete și reducere a zgomotului ISO integrate într-o singură opțiune, ceea ce poate
simplifica lucrul utilizatorului, dar totodată nu se asigură un control precum în
cazul lui FineReader sau Scan Tailor.</span><b style="mso-bidi-font-weight:normal"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;"><o:p></o:p></span></b></p>
        
        <p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%;"><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif;color:black;mso-color-alt:windowtext">Din motoarele
de procesare propuse în platforma de digitizare, Scan Tailor (desktop) ar fi
varianta cea mai bună pentru preprocesarea de documente vechi din secolele XVII
și XVIII, în special acolo unde este nevoie de experimentarea cu diferite
valori de rezoluție și uneori de îngroșarea caracterelor.</span><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif"><o:p></o:p></span></p>



`
    },

    /**
    * Pasul 3: OCR
    */
    step3Info: {
        title: "Informații referitoare la pasul 3",
        body: `
        
        <p class="MsoNormal" style="text-align:justify;line-height:
150%;;border:none;mso-padding-alt:31.0pt 31.0pt 31.0pt 31.0pt;
mso-border-shadow:yes"><span lang="ro" style="font-size:12.0pt;line-height:150%;
font-family:&quot;Times New Roman&quot;,serif;color:black;mso-color-alt:windowtext">La
acest pas utilizatorul selectează perioada documentului și modelul pe baza
căruia se va recunoaște documentul. </p>

<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">Utilizatorul are opțiunea de a alege un model OCR din
cele adăugate implicit sau de a adăuga un model nou conform unor condiții
stabilite în platformă. În mod implicit, sunt incluse<span style="mso-spacerun:yes">&nbsp; </span>în total 8 modele OCR. Un model pentru
secolul XX,<span style="mso-spacerun:yes">&nbsp; </span>2 modele pentru secolul XIX,
3 modele pentru XVIII și 2 modele pentru secolul XVII. Aceste modele OCR au
fost obținute prin antrenarea motoarelor OCR din FineReader 12 și FineReader
15.<o:p></o:p></span></p>

<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">Recunoașterea unei singure pagini cu
text în medie durează 30 de secunde. Un document PDF cu 50
pagini text se va recunoaște în circa 90 de secunde; un PDF cu 100 pagini text
- 150 de secunde; PDF cu 360 pagini text - peste 385 de secunde (mai mult de 6
minute).<span style="mso-spacerun:yes">&nbsp; </span>Documentele-text<span style="mso-spacerun:yes">&nbsp; </span>în format PDF atestă durata de aproximativ
1.2 secunde per pagină. La PDF-urile cu imagini nu a fost observată o durată
stabilă. Modelul OCR pentru secolul XX are o acuratețe la nivel de
caractere de peste 98%; modele din secolul XVIII oferă peste 92% la nivel de
cuvinte; iar modelul pentru secolul XVII oferă o acuratețe de peste 95% la
nivel de caractere și dicționare de cuvinte, luând în considerare preprocesarea
potrivită a imaginii, calitatea de scanare a documentului, uzura acestuia etc.<o:p></o:p></span></p>


        `
    },

    /**
    * Pasul 4: Verificare OCR
    */
    step4Info: {
        title: "Informații referitoare la pasul 4",
        body: `
        <p class="MsoNormal" style="text-align:justify;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">În acest pas am
inclus un modul de editare a textului recunoscut. Acest editor de text dispune
de o tastatură virtuală web care își adaptează compoziția caracterelor în
funcție de perioada documentului, bazată pe componenta <span class="SpellE">Javascript</span>
<i>simple-keyboard</i>.
</p>
        
        `
    },

    /**
    * Pasul 5: Transliterare
    */
    step5Info: {
        title: "Informații referitoare la pasul 5",
        body: `
        <p class="MsoNormal" style="text-align:justify;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;;mso-bidi-font-style:italic">Un modul
important pentru utilizator îl constituie </span><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">actualizarea ortografiei, unde la
solicitare<span style="mso-spacerun:yes">&nbsp; </span>se iau în considerare normele
scrierii limbii române moderne. Un exemplu este scrierea cu <b>â</b> (din <b>a)</b>.
În procesul de transliterare, trecerea la scrierea cu “â" este realizată
prin transliterare, doar dacă activăm opțiunea de actualizare a ortografiei, în
caz contrar se păstrează scrierea originală. Vom aminti, că potrivit recomandărilor
Academiei Române, litera “</span><span lang="RO-MO" style="font-size:12.0pt;
line-height:150%;font-family:&quot;Times New Roman&quot;,serif;mso-fareast-font-family:
&quot;Times New Roman&quot;;mso-ansi-language:RO-MO">î</span><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">” va fi întotdeauna scrisă la
începutul și sfârșitul cuvântului (“început”, “înger”, “în”, “întoarce”, “a coborî”,
“a urî”). <span style="mso-spacerun:yes">&nbsp;</span>În interiorul cuvântului, de
obicei este scris “â” (“cuvânt”, “a mârâi”). Totuși, există câteva excepții pentru
această regulă. Cuvintele formate prin prefixarea cuvintelor care încep cu
litera “î” vor păstra acest “î” în interior. De exemplu, “neîmpăcat”, “neîngrijit”,
“preîntâmpinat”,<span style="mso-spacerun:yes">&nbsp; </span>“reînarmat”. Aceeași
regulă se va aplica și cuvintelor compuse: “bineînțeles”, “semiînchis” etc.
<o:p></o:p></span></p>

<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">La transliterare ne mai întâlnim cu abateri
de la normele generale care nu pot fi controlate prin reguli prestabilite, iar
pentru aceasta, acest pas include un modul pentru folosirea dicționarului</span><span lang="RO-MO" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;;mso-ansi-language:RO-MO"> de excepții</span><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">. Dicționarul cu excepții de
transliterare păstrează cuvinte care nu pot fi transliterate corect utilizând doar
regulile de transliterare. De exemplu, cuvântul “<span class="SpellE">амязэ</span>”
conform regulilor de transliterare trece in “<span class="SpellE">amează</span>”,
varianta corectă fiind “amiază”, aceasta regăsindu-se în dicționarul respectiv.
<span style="mso-spacerun:yes">&nbsp;</span>În acest modul este posibilă adăugarea
de excepții noi. </p>

<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">Un modul experimental (indisponibil la moment aici) este
corectarea textului transliterat cu un sistem de inteligență artificială de
top. Acest sistem se numește GPT-3
dezvoltat de <span class="SpellE">OpenAI</span>.
Modelele de învățare automată, numite și modele lingvistice din GPT-3 pot
rezolva probleme de prelucrare a limbajului natural, precum elaborarea
rezumatelor, parafrazarea textului, traducerea automată, clasificarea textului,
transformarea textului din limbaj natural în codul unui limbaj de programare,
corectarea textului etc. GPT-3 rezolvă aceste probleme cu o acuratețe foarte
bună, atât pentru limba engleză cât și pentru limba română. În acest modul folosim modelul <i>text-davinci-003 </i>(în continuare <i>davinci</i>)<i>
</i>pentru corectarea textului recunoscut prin furnizarea condiției: <i>corectează
textul X</i>, unde X este textul transliterat. Modelul poate procesa până la
4000 de „<span class="SpellE">tokenuri</span>” per cerere. Un <span class="SpellE">token</span>
in <i>davinci</i> are in medie 4 caractere din engleza, iar 100 de <span class="SpellE">tokenuri</span> ar fi echivalentul a aproximativ 75 de cuvinte. Un
moment crucial la corectare este faptul că acest model nu păstrează varianta
originală a expresiilor arhaice din textul transliterat. Un exemplu corectat de
<i>davinci </i>este „<i>Cunoscând și Înțelegând măria Ta, noi, românii care
suntem în țara măriei Tale, nu avem nici Testamentul cel Nou, nici cel Vechi în
limba noastră.</i>” pentru expresia transliterată „<i>cum să cunoaște că văzând
și Înțelegând măria ta, că noi rumânii carii <span class="SpellE">sântem</span>
în țara măriei tale. nu ave m <span class="SpellE">neci</span> Testamentul cel
nou, <span class="SpellE">neci</span> cel <span class="SpellE">vechiu</span> de
plin întru limba noastră,</i>”. Lu</span><span class="SpellE"><span lang="RO-MO" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;;mso-ansi-language:RO-MO">ând</span></span><span lang="RO-MO" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;;mso-ansi-language:RO-MO"> în
considerare că acest text a fost scris în secolul XVII, </span><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">practic ceea ce a făcut modelul
<i style="mso-bidi-font-style:
normal">davinci</i>  seamănă mai mult cu o aliniere a textului vechi la textul modern. Însă
acesta nu este cazul și pentru textele din secolul XX unde textul diferă
nesemnificativ față de textele moderne. În acest caz, <i style="mso-bidi-font-style:
normal">davinci</i> corectează suficient de bine. După cum am mai spus,
corectarea textului cu GPT-3 este un modul experimental care trebuie exploatat
mai mult timp pentru a putea face concluzii mai generale.<o:p></o:p></span></p>

        
        `
    },

    /**
   * Pasul 5: Transliterare
   */
    step5Info2: {
        title: "OpenAI și GPT-3",
        body: `<p>OpenAI este o companie de cercetare în inteligență artificială (IA) care se concentrează pe dezvoltarea tehnologiilor de învățare automată (machine learning) avansate și pe aplicarea lor în domenii precum jocuri, limbaj și robotică. OpenAI a fost fondată în 2015 de Elon Musk, Sam Altman, Greg Brockman și Ilya Sutskever cu scopul de a promova și proteja IA prin dezvoltarea unor tehnologii responsabile și sigure.</p>
        <p>GPT-3 (Generative Pre-training Transformer 3) este un model de învățare automată dezvoltat de OpenAI care poate fi utilizat pentru a genera text, răspunde la întrebări și îndeplini diverse sarcini de procesare a limbajului natural. GPT-3 este unul dintre cele mai mari modele de învățare automată disponibile public, cu 175 miliarde de parametri, și este considerat un pas important în direcția dezvoltării modelelor de învățare automată capabile să îndeplinească diverse sarcini de procesare a limbajului natural.</p>
        <p>Pentru mai multe informații despre GPT-3, puteți vizita site-ul oficial al OpenAI la adresa <a href="https://openai.com/blog/gpt-3-apps/">https://openai.com/blog/gpt-3-apps/</a>. Acolo veți găsi detalii despre funcționarea și utilizarea GPT-3, precum și exemple de aplicații care au fost construite utilizând acest model. De asemenea, puteți găsi mai multe informații despre GPT-3 pe Wikipedia la adresa <a href="https://en.wikipedia.org/wiki/GPT-3">https://en.wikipedia.org/wiki/GPT-3</a>.</p>`
    },

    /**
    * Pasul 6: Verificare Transliterare
    */
    step6Info: {
        title: "Informații referitoare la pasul 6",
        body: `
        <p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">Acest pas este similar cu pasul 4. Tastatura virtuală și dicționarele de cuvinte
pentru verificatorul ortografic sunt adaptate la textul transliterat. Aici se
are în vedere că tastatura virtuală conține literele alfabetului românesc
modern, iar dicționarul de cuvinte este scris cu alfabetul românesc modern.


<o:p></o:p></span></p>

<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">Acest pas include și un modul pentru gestionarea dicționarului</span><span lang="RO-MO" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;;mso-ansi-language:RO-MO"> de excepții</span><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">. Dicționarul cu excepții de
transliterare păstrează cuvinte care nu pot fi transliterate corect utilizând doar
regulile de transliterare.
<span style="mso-spacerun:yes">&nbsp;</span>În acest modul este posibilă adăugarea
de excepții noi. </p>
        
        `
    },

    /**
    * Pasul 7: Salvarea rezultatelor
    */
    step7Info: {
        title: "Informații referitoare la pasul 7",
        body: `
        <p class="MsoNormal" style="text-align:justify;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">Documentul digitizat se refer</span><span lang="RO-MO" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;;mso-ansi-language:RO-MO">ă</span><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;"> la imaginile originale și
preprocesate, textele recunoscute și cele transliterate. Acest pas include
include opțiuni de gestionare a documentului digitizat. <o:p></o:p></span></p>

<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">Utilizatorul poate descărca imaginile pe dispozitivul
personal pentru necesități ulterioare. Formatul imaginilor descărcate este JPG.
<o:p></o:p></span></p>
        
<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">Similare sunt și opțiunile de
descărcare a textelor recunoscute și transliterate. Formatele fișierelor
descărcate includ TXT și DOCX. Varianta DOCX nu este altceva decât o
împachetare a textului crud (fără formatare), fără a păstra stilurile sau
ilustrațiile din documentul original.<o:p></o:p></span></p>



<p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
150%"><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
mso-fareast-font-family:&quot;Times New Roman&quot;">O opțiune importantă este publicarea documentului digitizat. Publicarea se face în portalul <a style="mso-footnote-id:ftn25" href="https://emoldova.org/" name="_ftnref25" title=""><span class="MsoFootnoteReference"><span style="mso-special-character:footnote"><!--[if !supportFootnotes]--><span class="MsoFootnoteReference"><span lang="ro" style="font-size:12.0pt;line-height:
115%;font-family:&quot;Times New Roman&quot;,serif;mso-fareast-font-family:&quot;Times New Roman&quot;;
mso-font-kerning:0pt;mso-ligatures:none;mso-ansi-language:#0018;mso-fareast-language:
EN-US;mso-bidi-language:AR-SA">eMoldova</span></span><!--[endif]--></span></span></a>, în particular în <span class="SpellE">portletul</span>
<a style="mso-footnote-id:ftn27" href="https://digi.emoldova.org/" name="_ftnref27" title=""><span class="MsoFootnoteReference"><span style="mso-special-character:footnote"><!--[if !supportFootnotes]--><span class="MsoFootnoteReference"><span lang="ro" style="font-size:12.0pt;line-height:
115%;font-family:&quot;Times New Roman&quot;,serif;mso-fareast-font-family:&quot;Times New Roman&quot;;
mso-font-kerning:0pt;mso-ligatures:none;mso-ansi-language:#0018;mso-fareast-language:
EN-US;mso-bidi-language:AR-SA">Tezaurul Național Digital</span></span><!--[endif]--></span></span></a>. 
<br>
<br>
<b>Important!</b> Când apeși pe "Publică documentul digitizat", acesta nu se publică instantaneu! Publicarea acestuia urmează a fi aprobată de către administratorul portalului.

</p>


        `

    },



    //     step1InfoOld: {
    //         title: "Informații referitoare la pasul 1",
    //         body: `
    //         <p class="MsoNormal" style="text-align:justify;text-indent:36.0pt;line-height:
    // 150%"><a name="_Hlk136023690"><span lang="ro" style="font-size:12.0pt;line-height:
    // 150%;font-family:&quot;Times New Roman&quot;,serif;mso-fareast-font-family:&quot;Times New Roman&quot;">Aplicația
    // de digitizare este o instanță demonstrativă a platformei de digitizare. Scopul
    // elaborării acestei aplicații este demonstrarea funcționalului unor module din
    // platformă. Aplicația permite digitizarea unui document în 7 pași,</span></a><span lang="ro" style="font-size:12.0pt;line-height:150%;font-family:&quot;Times New Roman&quot;,serif;
    // mso-fareast-font-family:&quot;Times New Roman&quot;"> unii dintre care fiind opționali,
    // cu posibilitatea de a fi omiși. Procesul de traversare a acestor pași îl vom
    // numi <i style="mso-bidi-font-style:normal">ciclu de digitizare</i>.<o:p></o:p></span></p>


    //         <p>Se acceptă următoarele tipuri de fișiere la incarcare: <b>png, jpg si tiff</b>.</p>
    //         <p>Fișierele PDF nu se pot prelucra in versiunea demo a aplicatiei.</p>
    //         <p>Pot fi încărcate mai multe fișiere într-un singur ciclu de digitizare.</p>

    //         <p>Un singur fișier incărcat nu va trece limita de 100MB.
    //         Toate fișierele incărcate la un singur ciclu de digitizare nu vor trece limita de 700MB.
    //         </p>
    //         <p>
    //         Atunci când vor fi selectate două sau mai multe fișiere, trebuie de luat în considerare că toate aceste fișiere vor fi procesate cu aceleași opțiuni de procesare, respectiv, trebuie să vă asigurați că fișierele încărcate sunt din aceeași perioadă, au unul și același alfabet și necesită aceleași opțiuni de preprocesare a imaginii. Dacă aveți seturi de documente din mai multe perioade, atunci aceste seturi vor fi digitizate în diferite cicluri de digitizare.
    //         </p>
    //         <p>
    //         Este posibilitatea de a șterge unele fișiere care au fost întamplator selectate in acest pas.
    //         </p>

    //         `
    //     },


};