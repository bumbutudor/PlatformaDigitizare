"use strict";

import React, { Component } from "react";
import Promise from "promise";
import "react-awesome-lightbox/build/style.css";
import Form from "react-bootstrap/Form";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import RangeSlider from "react-bootstrap-range-slider";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import { mdiSourceCommitStartNextLocal } from "@mdi/js";
import ImgsViewer from "react-images-viewer";
import { Fancybox } from "@fancyapps/ui/src/Fancybox/Fancybox.js";
import "@fancyapps/ui/dist/fancybox.css";
import { saveAs } from "file-saver";
import { Rnd } from "react-rnd";

export default class Step7 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ocrResults: props.getStore().ocrResults,
      transResults: props.getStore().transResults,
      // ocrResults: [
      //   "\ufeffн у се штие ын че ан, дар ера ун ом некибзуит ла требь ши жумулит де соартэ. Унде н’ар фи лукрат, фэчя кыте о гафэ, де токмай ыць луний мыниле ’н кап. Шефилор ли се фэчя милэ де нэтынгэрииле луй ши-л му-тау де коло-коло, пынэ ын сфыршит се помени, бьетул ом, дрегэтор песте алиментация публика, С'а букурат омул де маштабул активитэций ши унде се репеде де адунэ тоатэ оастя алиментацией публиче ши унде се уркэ ла трибунэ ши цине о кувынта-ре:\n— Скумпий мей, в’ам адунау коля, ка сэ вэ аминтеск, поате май ку тылк декыт алций, кэ мынкаря есте уна дин кондицииле фундаментале але фиинцэрий омулуй... Ятэ о пилдэ: я ынчеркаць ши ну хрэниць вителе. Ындатэ ор ынчепе сэ збере...\nЛумя рэмасе таблоу. Пынэ акум нимень ну ле ворбисе атыт де фрумос ши ку пилде атыт де конкрете. Инструкция ноул шеф шь-о ынкее аша:\n— Еу персонал вой трече прин фиекаре оспэтэрие сэ дмскутэм лынгэ кастроане, че фел де мынкаре плаче публикулуй... Вэ дореск спор ла мункэ, яр консуматорилор пофтэ бунэ!\nБукэтарий сынт оамень ку фанте-зие. Де ачея песте ноапте шь-ау ре-визуит куноштинцеле кулинаре, ка сэ ну се дее де рушине. Пе унде стэтяу ла ындоялэ, май ынтребау ши де соакре.\n— Че авець бун? — зисе омул ын лок де бинеце, сосит ла прима букэтэрие ку ноаптя ын кап. Симци о кэлдурэ плэкутэ де абурь.\nАкасэ ну луасе нич нафурэ ын гурэ. Кыт ай зиче пеште букэтарий ый пусерэ о штюка ымплутэ, кытева фелурь де икре ши лифтие де крап.\n— Де унде сэ ынчеп?.. А!.. Де ла куркан!\n*— Черем скузё, — зисерэ букэтарий фыстычиць. — Букате ле куркан о сэ авем мыне.\nА мынкат ку пофтэ, мэкар кэ ну ера куркан.\nНетезинду-се ушурел песте пынтече, пропусе субалтернилор, ка пе меселе дин оалэ сэ фие ынтотдяуна саре, килер мэчинат ши муштар. Кэч консуматорий фак гэлэжие дин кау-\nМЭМЭЛИГА\nза аста ши чер кондика де рекламаций. Букэтарий ынсэ ау зымбит дул-чаг:\n— Се поате... дар... хык... штиць... кум сэ вэ спунем?.. Оспэтэрия ноастрэ е диететикэ.\n— Пунець! Доар мынкаря есте уна дин кондицииле де самэ але екзистенцей омулуй.\nШефул плякэ, дар ну уйтэ ла амязэ сэ трякэ пе ла алтэ оспэтэрие ын интерес де сервичиу. Яр ын урма луй консуматорий визитау «диететика» ши стэтяу ла рынд аштептынд кондика де рекламаций. Оамений ышь аш-терняу фиекаре ын фелул сэу немул-цумириле. «Ной обсервэм, — скрие Иванов сау Гуцу,— кэ мыякэруриле се прегэтеск прост. Сервиря консуматорилор ну-й дин челе май плэкуте. Ын сала читим инскрипция: «Колек-тивул оспэтэрией луптэ пентру титлул де бригадэ а мунчий комунисте». Дупэ мине, ачастэ лозинка е афишатэ ын оспэтэрия № З пря девреме, мэкар кэ ын фонд еа есте ун лукру фоарте бун». Ши дупэ фиекаре рекламацие шефул вине сингур сэ рэспундэ ын скрис, кум кэ «мынкаря есте уна дин проблемеле де базэ але сочиализмулуй... Аша кэ май сынт греутэць ши букэтарий виноваць сынт педепсиць пе линие административэ!»\nЗилеле де лукру тречяу ын маре кин. Май алес кынд визита кафеняуа ку мынкэрурь национале «Пэпушой». Доар аколо унде лукрасе май ынаинте авя де афаче ку орьче врей, нумай ну ку асортиментул продуселор. Де унде сэ штие, бунэоарэ, кум е мэ-мэлигуца ку брынзэ де оае, ку жу-мере, токана ку муждей? Доар ши еле фак парте дин «кондицииле де самэ але фиинцэрий омулуй». Ынсэ кум аратэ еле? Букэтарий сэ штие? Да де унде! Букэтарий ыс тот «фраций» луй, ачеясйь дупэ густ ши киб-зуялэ... Сэ фие ал найбей чел де-а нэскочит ши кулинария аста!\nЫл принде ынтр’о зи ун клиент\nЕ РОТУНДЭ\nаморезат де «Пэпушой» ши-л я ку кресчендо:\n— Думнята ынцележь че фел де алуат е ачеста?\n— Мэмэлигэ!\n— Пэй, мэмэлига-й аша, бре?.. Кынд ый фяртэ бине, еа ну се липеш-те де фарфурие. Е густоасэ ши ро-тундэ... Ротундэ, ынцележь?..\n— Ыхы... Ротундэ! Ын формэ де «О»!... Ротундэ!\n— Стай! Думнята ну мэ луа ку ротунда... Мэмэлига май есте ши алтфел: урс де мэмэлигэ, мэмэлигэ прэжитэ, мэмэлигэ ла куптор. Ултима се сервеште ын формэ.\n— Жуст! Ын формэ де «О>!..\nКонсуматорул претенциос н’а скрис нимик ын кондика де рекламаций. Ел штия динаинте рэспунсул; «мынкаря есте уна дин проблемеле... аша кэ... букэтарий сынт педепсиць пе линие...»\nСэ май визитезе вре-о оспэтэрие? Ый есте лехамите! Шефул кулинари-лор се дуче ла рестаурант. Ынтрэ. Веде музика. Ши командэ кынтекул «И баранку не бросал шофер». Пе урмэ, трече директ ла букэтэрие. Аколо букэтарий авяу нумай антрикоате. Шефул а черут бифштекс. Пынэ и л-ор прэжи, буфетара ыл сервеште ку ун коньяк. Семидиспус ел я оспэтэрица ла дане ши унде-й зиче уна солдэ-цяскэ, ын чуда тутурор... Адикэ, а «тутурор» е пря мулт спус. Ын сала ера нумай клиентул чела де ла «Пэпушой», каре-й спусе, кэ мэмэлига е ротундэ, ши венисе мэкар аич с’о гэсяскэ.\nШи акум ворба де ла ынчепут: «Ну се штие ын че ан, дар ера ун ом...» Ба ши анул се штие, ши омул се штие. Чел каре кондуче алиментация публикэ дин Сорока есте Н. Корол. Ной интенционат ну л-ам нумит де одатэ, деоарече ын фойлетон (ка прототипь) фигурязэ ши алць дрегэ-торь, каре штиу доар уна ши бунэ: мэмэлига е ротундэ!\nА. ВАСИЛЮК",
      //   '\ufeffлумилор черешть, ка ши ын в’|яца челей май неын-сэмнате в!ецуитоаре, семнул нумелуй Вииторулуй.\nВеститул ынвэцат енглез ши адынк кужетэтор Бакон, пэринтеле штиинцей, ынтемеяте пе довезь вэзуте, спуне, кы фшнца адевэратей штиинце ши адевэратей философа е де а дуче омениря ла десэвыршитэ причепере а Зидиторулуй ей. ши чел май бун мижлок спре а-шь ажунже цинта ачяста есте, ле лынгы Сфынта Скрилтуры, черчетаря лум1й, ынтемеяты пе довезь вэзуте. Ши ачесте ворбе, спусе де Бакон, сынт пентру фиекаре минте лумина! ы ку атыт мэй лэмурите ши май адевэрате, ку кыт ши минтя ачяста пэтрунде май адынк ши ку кыт куноштинцеле ей сынт май ынтинсе.\nЛуаць, де пилды, пе Ньютон, каре а лэмурит лежиле мишкэрь тутурор стелелор ши сорилор дин луме. Чейлалць ынвэцаць марь ну гэсеск дестуле ворбе, ка сы-л лауде, ши ел, ачест маре Ньютон, обишнуя сы спуе деспре сине урмэтоареле: „ну шву кум и се паре лум1й, дар м!е ми се паре, кы сынт ка ун копил мик. каре се жоакы пе малул мэр1й ши адуны петричеле албе ши лучюасе ши скойчь де маре, ын време че очеанул чел .маре акопере ши аскунде адевэрул динаинтя луй". Аша зичя деспре сине ачест маре ур!аш ал минщй ши ал штшнцей, ши фацы де Думнезэу авя атыта плекаре ши атыта евлав1е, ынкыт, кынд мержя пе улицы, ну путя сы ростяскы нумеле луй Думнезэу, фэры сы-шь ее пэ-лэр1я дин кап.\nВеститул математик ши натуралист Ампер, каре а ынтемеят о ноуы игпинцы—електродинамика, сфэ-туеште астфель пе ун тынэр: .Фереште-те де а те ынделетничи нумай ку штшнца, кум ай фэкут лэны',
      // ],
      // transResults: [
      //   "\ufeffн у се штие ын че ан, дар ера ун ом некибзуит ла требь ши жумулит де соартэ. Унде н’ар фи лукрат, фэчя кыте о гафэ, де токмай ыць луний мыниле ’н кап. Шефилор ли се фэчя милэ де нэтынгэрииле луй ши-л му-тау де коло-коло, пынэ ын сфыршит се помени, бьетул ом, дрегэтор песте алиментация публика, С'а букурат омул де маштабул активитэций ши унде се репеде де адунэ тоатэ оастя алиментацией публиче ши унде се уркэ ла трибунэ ши цине о кувынта-ре:\n— Скумпий мей, в’ам адунау коля, ка сэ вэ аминтеск, поате май ку тылк декыт алций, кэ мынкаря есте уна дин кондицииле фундаментале але фиинцэрий омулуй... Ятэ о пилдэ: я ынчеркаць ши ну хрэниць вителе. Ындатэ ор ынчепе сэ збере...\nЛумя рэмасе таблоу. Пынэ акум нимень ну ле ворбисе атыт де фрумос ши ку пилде атыт де конкрете. Инструкция ноул шеф шь-о ынкее аша:\n— Еу персонал вой трече прин фиекаре оспэтэрие сэ дмскутэм лынгэ кастроане, че фел де мынкаре плаче публикулуй... Вэ дореск спор ла мункэ, яр консуматорилор пофтэ бунэ!\nБукэтарий сынт оамень ку фанте-зие. Де ачея песте ноапте шь-ау ре-визуит куноштинцеле кулинаре, ка сэ ну се дее де рушине. Пе унде стэтяу ла ындоялэ, май ынтребау ши де соакре.\n— Че авець бун? — зисе омул ын лок де бинеце, сосит ла прима букэтэрие ку ноаптя ын кап. Симци о кэлдурэ плэкутэ де абурь.\nАкасэ ну луасе нич нафурэ ын гурэ. Кыт ай зиче пеште букэтарий ый пусерэ о штюка ымплутэ, кытева фелурь де икре ши лифтие де крап.\n— Де унде сэ ынчеп?.. А!.. Де ла куркан!\n*— Черем скузё, — зисерэ букэтарий фыстычиць. — Букате ле куркан о сэ авем мыне.\nА мынкат ку пофтэ, мэкар кэ ну ера куркан.\nНетезинду-се ушурел песте пынтече, пропусе субалтернилор, ка пе меселе дин оалэ сэ фие ынтотдяуна саре, килер мэчинат ши муштар. Кэч консуматорий фак гэлэжие дин кау-\nМЭМЭЛИГА\nза аста ши чер кондика де рекламаций. Букэтарий ынсэ ау зымбит дул-чаг:\n— Се поате... дар... хык... штиць... кум сэ вэ спунем?.. Оспэтэрия ноастрэ е диететикэ.\n— Пунець! Доар мынкаря есте уна дин кондицииле де самэ але екзистенцей омулуй.\nШефул плякэ, дар ну уйтэ ла амязэ сэ трякэ пе ла алтэ оспэтэрие ын интерес де сервичиу. Яр ын урма луй консуматорий визитау «диететика» ши стэтяу ла рынд аштептынд кондика де рекламаций. Оамений ышь аш-терняу фиекаре ын фелул сэу немул-цумириле. «Ной обсервэм, — скрие Иванов сау Гуцу,— кэ мыякэруриле се прегэтеск прост. Сервиря консуматорилор ну-й дин челе май плэкуте. Ын сала читим инскрипция: «Колек-тивул оспэтэрией луптэ пентру титлул де бригадэ а мунчий комунисте». Дупэ мине, ачастэ лозинка е афишатэ ын оспэтэрия № З пря девреме, мэкар кэ ын фонд еа есте ун лукру фоарте бун». Ши дупэ фиекаре рекламацие шефул вине сингур сэ рэспундэ ын скрис, кум кэ «мынкаря есте уна дин проблемеле де базэ але сочиализмулуй... Аша кэ май сынт греутэць ши букэтарий виноваць сынт педепсиць пе линие административэ!»\nЗилеле де лукру тречяу ын маре кин. Май алес кынд визита кафеняуа ку мынкэрурь национале «Пэпушой». Доар аколо унде лукрасе май ынаинте авя де афаче ку орьче врей, нумай ну ку асортиментул продуселор. Де унде сэ штие, бунэоарэ, кум е мэ-мэлигуца ку брынзэ де оае, ку жу-мере, токана ку муждей? Доар ши еле фак парте дин «кондицииле де самэ але фиинцэрий омулуй». Ынсэ кум аратэ еле? Букэтарий сэ штие? Да де унде! Букэтарий ыс тот «фраций» луй, ачеясйь дупэ густ ши киб-зуялэ... Сэ фие ал найбей чел де-а нэскочит ши кулинария аста!\nЫл принде ынтр’о зи ун клиент\nЕ РОТУНДЭ\nаморезат де «Пэпушой» ши-л я ку кресчендо:\n— Думнята ынцележь че фел де алуат е ачеста?\n— Мэмэлигэ!\n— Пэй, мэмэлига-й аша, бре?.. Кынд ый фяртэ бине, еа ну се липеш-те де фарфурие. Е густоасэ ши ро-тундэ... Ротундэ, ынцележь?..\n— Ыхы... Ротундэ! Ын формэ де «О»!... Ротундэ!\n— Стай! Думнята ну мэ луа ку ротунда... Мэмэлига май есте ши алтфел: урс де мэмэлигэ, мэмэлигэ прэжитэ, мэмэлигэ ла куптор. Ултима се сервеште ын формэ.\n— Жуст! Ын формэ де «О>!..\nКонсуматорул претенциос н’а скрис нимик ын кондика де рекламаций. Ел штия динаинте рэспунсул; «мынкаря есте уна дин проблемеле... аша кэ... букэтарий сынт педепсиць пе линие...»\nСэ май визитезе вре-о оспэтэрие? Ый есте лехамите! Шефул кулинари-лор се дуче ла рестаурант. Ынтрэ. Веде музика. Ши командэ кынтекул «И баранку не бросал шофер». Пе урмэ, трече директ ла букэтэрие. Аколо букэтарий авяу нумай антрикоате. Шефул а черут бифштекс. Пынэ и л-ор прэжи, буфетара ыл сервеште ку ун коньяк. Семидиспус ел я оспэтэрица ла дане ши унде-й зиче уна солдэ-цяскэ, ын чуда тутурор... Адикэ, а «тутурор» е пря мулт спус. Ын сала ера нумай клиентул чела де ла «Пэпушой», каре-й спусе, кэ мэмэлига е ротундэ, ши венисе мэкар аич с’о гэсяскэ.\nШи акум ворба де ла ынчепут: «Ну се штие ын че ан, дар ера ун ом...» Ба ши анул се штие, ши омул се штие. Чел каре кондуче алиментация публикэ дин Сорока есте Н. Корол. Ной интенционат ну л-ам нумит де одатэ, деоарече ын фойлетон (ка прототипь) фигурязэ ши алць дрегэ-торь, каре штиу доар уна ши бунэ: мэмэлига е ротундэ!\nА. ВАСИЛЮК",
      //   '\ufeffлумилор черешть, ка ши ын в’|яца челей май неын-сэмнате в!ецуитоаре, семнул нумелуй Вииторулуй.\nВеститул ынвэцат енглез ши адынк кужетэтор Бакон, пэринтеле штиинцей, ынтемеяте пе довезь вэзуте, спуне, кы фшнца адевэратей штиинце ши адевэратей философа е де а дуче омениря ла десэвыршитэ причепере а Зидиторулуй ей. ши чел май бун мижлок спре а-шь ажунже цинта ачяста есте, ле лынгы Сфынта Скрилтуры, черчетаря лум1й, ынтемеяты пе довезь вэзуте. Ши ачесте ворбе, спусе де Бакон, сынт пентру фиекаре минте лумина! ы ку атыт мэй лэмурите ши май адевэрате, ку кыт ши минтя ачяста пэтрунде май адынк ши ку кыт куноштинцеле ей сынт май ынтинсе.\nЛуаць, де пилды, пе Ньютон, каре а лэмурит лежиле мишкэрь тутурор стелелор ши сорилор дин луме. Чейлалць ынвэцаць марь ну гэсеск дестуле ворбе, ка сы-л лауде, ши ел, ачест маре Ньютон, обишнуя сы спуе деспре сине урмэтоареле: „ну шву кум и се паре лум1й, дар м!е ми се паре, кы сынт ка ун копил мик. каре се жоакы пе малул мэр1й ши адуны петричеле албе ши лучюасе ши скойчь де маре, ын време че очеанул чел .маре акопере ши аскунде адевэрул динаинтя луй". Аша зичя деспре сине ачест маре ур!аш ал минщй ши ал штшнцей, ши фацы де Думнезэу авя атыта плекаре ши атыта евлав1е, ынкыт, кынд мержя пе улицы, ну путя сы ростяскы нумеле луй Думнезэу, фэры сы-шь ее пэ-лэр1я дин кап.\nВеститул математик ши натуралист Ампер, каре а ынтемеят о ноуы игпинцы—електродинамика, сфэ-туеште астфель пе ун тынэр: .Фереште-те де а те ынделетничи нумай ку штшнца, кум ай фэкут лэны',
      // ],
      sourceFiles: props.getStore().sourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      layoutName: "default",
      show: false,
      // input: ""
      inputID: 0,
      saving: false,
    };
    this.isValidated = this.isValidated.bind(this);
  }

  componentDidMount() { }

  componentWillUnmount() { }

  // This review screen had the 'Save' button, on clicking this is called
  isValidated() {
    /*
    typically this method needs to return true or false (to indicate if the local forms are validated, so StepZilla can move to the next step),
    but in this example we simulate an ajax request which is async. In the case of async validation or server saving etc. return a Promise and StepZilla will wait
    ... for the resolve() to work out if we can move to the next step
    So here are the rules:
    ~~~~~~~~~~~~~~~~~~~~~~~~
    SYNC action (e.g. local JS form validation).. if you return:
    true/undefined: validation has passed. Move to next step.
    false: validation failed. Stay on current step
    ~~~~~~~~~~~~~~~~~~~~~~~~
    ASYNC return (server side validation or saving data to server etc).. you need to return a Promise which can resolve like so:
    resolve(): validation/save has passed. Move to next step.
    reject(): validation/save failed. Stay on current step
    */

    this.setState({
      saving: true,
    });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.setState({
          saving: true,
        });

        this.props.updateStore({ savedToCloud: true }); // Update store here (this is just an example, in reality you will do it via redux or flux)

        // call resolve() to indicate that server validation or other aync method was a success.
        // ... only then will it move to the next step. reject() will indicate a fail
        resolve();
        // reject(); // or reject
      }, 5000);
    });
  }

  jumpToStep(toStep) {
    // We can explicitly move to a step (we -1 as its a zero based index)
    this.props.jumpToStep(toStep - 1); // The StepZilla library injects this jumpToStep utility into each component
  }

  handleFilePath(filePath) {
    if (filePath.length > 0) return "http://127.0.0.1:8000/media/" + filePath;
    //https://httpbin.org/post
    //http://127.0.0.1:8000/media/
    return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
  };

  save_image(event) {
    const file_url = this.handleFilePath(this.state.preprocessedFiles[0]);
    saveAs(file_url, 'image.jpg')
  }
  save_ocr(event) {
    /* let exampleText = "My text"; */
    /* this.state.ocrResults */
    var blob = new Blob(["Textul recunoscut ", "\n\n", this.state.ocrResults], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, "OCR" + ".txt");
  }
  save_ocr_doc(event) {
    /* let exampleText = "My text docx"; */
    /* this.state.ocrResults */
    var blob = new Blob(["Textul recunoscut ", "\n\n", this.state.ocrResults], {
      type: "application/msword",
    });
    saveAs(blob, "OCR" + ".doc");
  }
  save_trans(event) {
    var blob = new Blob(["Textul transliterat: ", "\n\n", this.state.transResults], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, "Transliterat" + ".txt");
  }
  save_trans_doc(event) {
    var blob = new Blob(["Textul transliterat: ", "\n\n", this.state.transResults], {
      type: "application/msword",
    });
    saveAs(blob, "Transliterat" + ".doc");
  }

  render() {
    // Fisierele sursa

    const sourceFiles = this.props.getStore().sourceFiles;
    const [preprocessedFiles, setpreprocessedFiles] =
      this.props.getStore().preprocessedFiles;

    const savingCls = this.state.saving
      ? "saving col-md-12 show"
      : "saving col-md-12 hide";

    return (
      <div className="step step7 review">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="col-md-12 control-label mb-3">
                <h1>Step 7: Salvează rezultatele</h1>
              </label>
            </div>
            <div className="form-group row">
              <div className="col-4">
                {this.props.getStore().preprocessedFiles.length != 0 && (
                  <> <Rnd
                    default={{
                      x: 150,
                      y: 205,
                      width: 500,
                      height: 190,
                    }}
                    minWidth={500}
                    minHeight={190}
                    bounds="window"
                  >
                    <Accordion defaultActiveKey={["0"]} alwaysOpen>
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>
                          Documentul original
                        </Accordion.Header>
                        <Accordion.Body>
                          {this.props
                            .getStore()
                            .sourceFiles.map((src, index) => (
                              console.log(src),
                              <a
                                className=""
                                data-fancybox="gallery_2"
                                data-src={this.handleFilePath(src.name)}
                                data-caption={"imagine preprocesată"}
                                key={index}
                              >
                                <img
                                  className="Accordion_image"
                                  src={this.handleFilePath(src.name)}
                                />
                              </a>
                            ))}
                          <button
                            type="button"
                            className="btn btn-primary col-12"
                            onClick={this.save_image.bind(this)}
                          >
                            Download
                          </button>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </Rnd>
                  </>
                )}
              </div>

              <div className="col-4">
                <Rnd
                  default={{
                    x: 150,
                    y: 205,
                    width: 500,
                    height: 190,
                  }}
                  minWidth={500}
                  minHeight={190}
                  bounds="window"
                >
                  <Accordion defaultActiveKey={["0"]} alwaysOpen>

                    <Accordion.Item eventKey="0">
                      <Accordion.Header>Textul recunoscut</Accordion.Header>
                      <Accordion.Body>
                        {this.state.ocrResults &&
                          this.state.ocrResults.map((item, index) => {
                            return (
                              <textarea
                                key={index}
                                id={index}
                                /* onFocus={this.setActiveInput.bind(this)} */
                                value={item}
                                /* onChange={this.onChangeInput.bind(this)} */
                                readOnly
                                className="form-control_result mb-4"
                                rows="20"
                              ></textarea>
                            );
                          })}
                        <button
                          type="button"
                          className="btn btn-primary col-12"
                          onClick={this.save_ocr.bind(this)}
                        >
                          Descarcă în format .txt
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary col-12 mt-2"
                          onClick={this.save_ocr_doc.bind(this)}
                        >
                          Descarcă în format .doc
                        </button>
                      </Accordion.Body>
                    </Accordion.Item>

                  </Accordion>
                </Rnd>
              </div>

              <div className="col-4">
                <Rnd
                  default={{
                    x: 150,
                    y: 205,
                    width: 500,
                    height: 190,
                  }}
                  minWidth={500}
                  minHeight={190}
                  bounds="window"
                >
                  <Accordion defaultActiveKey={["0"]} alwaysOpen>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>Text transliterat</Accordion.Header>
                      <Accordion.Body>
                        {this.state.transResults &&
                          this.state.transResults.map((item, index) => {
                            return (
                              <textarea
                                key={index}
                                id={index}
                                /* onFocus={this.setActiveInput.bind(this)} */
                                value={item}
                                /* onChange={this.onChangeInput.bind(this)} */
                                readOnly
                                className="form-control_result mb-4"
                                rows="20"
                              ></textarea>
                            );
                          })}
                        <button
                          type="button"
                          className="btn btn-primary col-12"
                          onClick={this.save_trans.bind(this)}
                        >
                          Descarcă în format .txt
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary col-12 mt-2"
                          onClick={this.save_trans_doc.bind(this)}
                        >
                          Descarcă în format .doc
                        </button>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </Rnd>
              </div>

              {/* <div className="col-md-12 control-label">
                <div className="col-md-12 txt">
                  <div className="col-md-4">Data</div>
                  <div className="col-md-4">
                    {{JSON.stringify(this.props.getStore())}}
                    {JSON.stringify(preprocessedFiles)}
                    {console.log(preprocessedFiles)}
                  </div>
                </div>
                {<h2 className={savingCls}></h2>}
              </div> */}
            </div>
          </form >
          {/* <div className="col-2 m-4">
            <button className="btn btn-secondary" onClick={() =>
              this.setState({ show: !this.state.show })
            }>Obiectul digitizat</button>
            {this.state.show && (JSON.stringify(this.props.getStore()))}
          </div> */}

          < div className="col-2 m-4" >
            <button className="btn btn-success" onClick={() => {
              this.props.jumpToStep(0); Object.getOwnPropertyNames(this.props.getStore()).forEach(function (prop) {
                delete obj[prop];
              });
            }}>
              Digitizează un document nou
            </button>

          </div >

        </div >

      </div >
    );
  }
}
