"use strict";

import React, { Component } from "react";
import PropTypes from "prop-types";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import Joi from "joi";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import { flushSync } from "react-dom";

class Step4 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /* ocrResults: props.getStore().ocrResults, */
      ocrResults: [
        "\ufeffн у се штие ын че ан, дар ера ун ом некибзуит ла требь ши жумулит де соартэ. Унде н’ар фи лукрат, фэчя кыте о гафэ, де токмай ыць луний мыниле ’н кап. Шефилор ли се фэчя милэ де нэтынгэрииле луй ши-л му-тау де коло-коло, пынэ ын сфыршит се помени, бьетул ом, дрегэтор песте алиментация публика, С'а букурат омул де маштабул активитэций ши унде се репеде де адунэ тоатэ оастя алиментацией публиче ши унде се уркэ ла трибунэ ши цине о кувынта-ре:\n— Скумпий мей, в’ам адунау коля, ка сэ вэ аминтеск, поате май ку тылк декыт алций, кэ мынкаря есте уна дин кондицииле фундаментале але фиинцэрий омулуй... Ятэ о пилдэ: я ынчеркаць ши ну хрэниць вителе. Ындатэ ор ынчепе сэ збере...\nЛумя рэмасе таблоу. Пынэ акум нимень ну ле ворбисе атыт де фрумос ши ку пилде атыт де конкрете. Инструкция ноул шеф шь-о ынкее аша:\n— Еу персонал вой трече прин фиекаре оспэтэрие сэ дмскутэм лынгэ кастроане, че фел де мынкаре плаче публикулуй... Вэ дореск спор ла мункэ, яр консуматорилор пофтэ бунэ!\nБукэтарий сынт оамень ку фанте-зие. Де ачея песте ноапте шь-ау ре-визуит куноштинцеле кулинаре, ка сэ ну се дее де рушине. Пе унде стэтяу ла ындоялэ, май ынтребау ши де соакре.\n— Че авець бун? — зисе омул ын лок де бинеце, сосит ла прима букэтэрие ку ноаптя ын кап. Симци о кэлдурэ плэкутэ де абурь.\nАкасэ ну луасе нич нафурэ ын гурэ. Кыт ай зиче пеште букэтарий ый пусерэ о штюка ымплутэ, кытева фелурь де икре ши лифтие де крап.\n— Де унде сэ ынчеп?.. А!.. Де ла куркан!\n*— Черем скузё, — зисерэ букэтарий фыстычиць. — Букате ле куркан о сэ авем мыне.\nА мынкат ку пофтэ, мэкар кэ ну ера куркан.\nНетезинду-се ушурел песте пынтече, пропусе субалтернилор, ка пе меселе дин оалэ сэ фие ынтотдяуна саре, килер мэчинат ши муштар. Кэч консуматорий фак гэлэжие дин кау-\nМЭМЭЛИГА\nза аста ши чер кондика де рекламаций. Букэтарий ынсэ ау зымбит дул-чаг:\n— Се поате... дар... хык... штиць... кум сэ вэ спунем?.. Оспэтэрия ноастрэ е диететикэ.\n— Пунець! Доар мынкаря есте уна дин кондицииле де самэ але екзистенцей омулуй.\nШефул плякэ, дар ну уйтэ ла амязэ сэ трякэ пе ла алтэ оспэтэрие ын интерес де сервичиу. Яр ын урма луй консуматорий визитау «диететика» ши стэтяу ла рынд аштептынд кондика де рекламаций. Оамений ышь аш-терняу фиекаре ын фелул сэу немул-цумириле. «Ной обсервэм, — скрие Иванов сау Гуцу,— кэ мыякэруриле се прегэтеск прост. Сервиря консуматорилор ну-й дин челе май плэкуте. Ын сала читим инскрипция: «Колек-тивул оспэтэрией луптэ пентру титлул де бригадэ а мунчий комунисте». Дупэ мине, ачастэ лозинка е афишатэ ын оспэтэрия № З пря девреме, мэкар кэ ын фонд еа есте ун лукру фоарте бун». Ши дупэ фиекаре рекламацие шефул вине сингур сэ рэспундэ ын скрис, кум кэ «мынкаря есте уна дин проблемеле де базэ але сочиализмулуй... Аша кэ май сынт греутэць ши букэтарий виноваць сынт педепсиць пе линие административэ!»\nЗилеле де лукру тречяу ын маре кин. Май алес кынд визита кафеняуа ку мынкэрурь национале «Пэпушой». Доар аколо унде лукрасе май ынаинте авя де афаче ку орьче врей, нумай ну ку асортиментул продуселор. Де унде сэ штие, бунэоарэ, кум е мэ-мэлигуца ку брынзэ де оае, ку жу-мере, токана ку муждей? Доар ши еле фак парте дин «кондицииле де самэ але фиинцэрий омулуй». Ынсэ кум аратэ еле? Букэтарий сэ штие? Да де унде! Букэтарий ыс тот «фраций» луй, ачеясйь дупэ густ ши киб-зуялэ... Сэ фие ал найбей чел де-а нэскочит ши кулинария аста!\nЫл принде ынтр’о зи ун клиент\nЕ РОТУНДЭ\nаморезат де «Пэпушой» ши-л я ку кресчендо:\n— Думнята ынцележь че фел де алуат е ачеста?\n— Мэмэлигэ!\n— Пэй, мэмэлига-й аша, бре?.. Кынд ый фяртэ бине, еа ну се липеш-те де фарфурие. Е густоасэ ши ро-тундэ... Ротундэ, ынцележь?..\n— Ыхы... Ротундэ! Ын формэ де «О»!... Ротундэ!\n— Стай! Думнята ну мэ луа ку ротунда... Мэмэлига май есте ши алтфел: урс де мэмэлигэ, мэмэлигэ прэжитэ, мэмэлигэ ла куптор. Ултима се сервеште ын формэ.\n— Жуст! Ын формэ де «О>!..\nКонсуматорул претенциос н’а скрис нимик ын кондика де рекламаций. Ел штия динаинте рэспунсул; «мынкаря есте уна дин проблемеле... аша кэ... букэтарий сынт педепсиць пе линие...»\nСэ май визитезе вре-о оспэтэрие? Ый есте лехамите! Шефул кулинари-лор се дуче ла рестаурант. Ынтрэ. Веде музика. Ши командэ кынтекул «И баранку не бросал шофер». Пе урмэ, трече директ ла букэтэрие. Аколо букэтарий авяу нумай антрикоате. Шефул а черут бифштекс. Пынэ и л-ор прэжи, буфетара ыл сервеште ку ун коньяк. Семидиспус ел я оспэтэрица ла дане ши унде-й зиче уна солдэ-цяскэ, ын чуда тутурор... Адикэ, а «тутурор» е пря мулт спус. Ын сала ера нумай клиентул чела де ла «Пэпушой», каре-й спусе, кэ мэмэлига е ротундэ, ши венисе мэкар аич с’о гэсяскэ.\nШи акум ворба де ла ынчепут: «Ну се штие ын че ан, дар ера ун ом...» Ба ши анул се штие, ши омул се штие. Чел каре кондуче алиментация публикэ дин Сорока есте Н. Корол. Ной интенционат ну л-ам нумит де одатэ, деоарече ын фойлетон (ка прототипь) фигурязэ ши алць дрегэ-торь, каре штиу доар уна ши бунэ: мэмэлига е ротундэ!\nА. ВАСИЛЮК",
        '\ufeffлумилор черешть, ка ши ын в’|яца челей май неын-сэмнате в!ецуитоаре, семнул нумелуй Вииторулуй.\nВеститул ынвэцат енглез ши адынк кужетэтор Бакон, пэринтеле штиинцей, ынтемеяте пе довезь вэзуте, спуне, кы фшнца адевэратей штиинце ши адевэратей философа е де а дуче омениря ла десэвыршитэ причепере а Зидиторулуй ей. ши чел май бун мижлок спре а-шь ажунже цинта ачяста есте, ле лынгы Сфынта Скрилтуры, черчетаря лум1й, ынтемеяты пе довезь вэзуте. Ши ачесте ворбе, спусе де Бакон, сынт пентру фиекаре минте лумина! ы ку атыт мэй лэмурите ши май адевэрате, ку кыт ши минтя ачяста пэтрунде май адынк ши ку кыт куноштинцеле ей сынт май ынтинсе.\nЛуаць, де пилды, пе Ньютон, каре а лэмурит лежиле мишкэрь тутурор стелелор ши сорилор дин луме. Чейлалць ынвэцаць марь ну гэсеск дестуле ворбе, ка сы-л лауде, ши ел, ачест маре Ньютон, обишнуя сы спуе деспре сине урмэтоареле: „ну шву кум и се паре лум1й, дар м!е ми се паре, кы сынт ка ун копил мик. каре се жоакы пе малул мэр1й ши адуны петричеле албе ши лучюасе ши скойчь де маре, ын време че очеанул чел .маре акопере ши аскунде адевэрул динаинтя луй". Аша зичя деспре сине ачест маре ур!аш ал минщй ши ал штшнцей, ши фацы де Думнезэу авя атыта плекаре ши атыта евлав1е, ынкыт, кынд мержя пе улицы, ну путя сы ростяскы нумеле луй Думнезэу, фэры сы-шь ее пэ-лэр1я дин кап.\nВеститул математик ши натуралист Ампер, каре а ынтемеят о ноуы игпинцы—електродинамика, сфэ-туеште астфель пе ун тынэр: .Фереште-те де а те ынделетничи нумай ку штшнца, кум ай фэкут лэны',
      ],
      sourceFiles: props.getStore().sourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      emailEmergency: "john.smith@example.com",
      layoutName: "default",
      show: false,
      // input: ""
    };

    this.validatorTypes = {
      emailEmergency: Joi.string().required(),
    };

    this.getValidatorData = this.getValidatorData.bind(this);
    this.renderHelpText = this.renderHelpText.bind(this);
    this.isValidated = this.isValidated.bind(this);

    this.cyrillicRomanianLayout = {
      default: [
        "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
        "{tab} ѳ ѡ е р т ї ꙋ и о п ъ ꙟ \\",
        "{lock} а с д ф г х ж к л ц ш щ џ ѫ ' {enter}",
        "{shift} з ѯ ч в б н м ѣ ѧ ѩ ю ѹ ь ѵ ѱ ѕ . / {shift}",
        "{space}",
      ],
      shift: [
        "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
        "{tab} Ѳ Ѡ Е Р Т Ї Ꙋ И О П Ъ Ꙟ |",
        '{lock} А С Д Ф Г Х Ж К Л Ц Ш Щ Џ Ѫ " {enter}',
        "{shift} З Ѯ Ч В Б Н М Ѣ Ѧ Ѩ Ю ОУ Ь Ѵ Ѱ Ѕ {shift}",
        "{space}",
      ],
    };
  }

  isValidated() {
    return new Promise((resolve, reject) => {
      this.props.validate((error) => {
        if (error) {
          reject(); // form contains errors
          return;
        }

        if (
          this.props.getStore().emailEmergency !=
          this.getValidatorData().emailEmergency
        ) {
          // only update store of something changed
          this.props.updateStore({
            ...this.getValidatorData(),
            savedToCloud: false, // use this to notify step4 that some changes took place and prompt the user to save again
          }); // Update store here (this is just an example, in reality you will do it via redux or flux)
        }

        resolve(); // form is valid, fire action
      });
    });
  }

  getValidatorData() {
    return {
      emailEmergency: this.refs.emailEmergency.value,
    };
  }

  onChange(e) {
    let newState = {};
    newState[e.target.name] = e.target.value;
    this.setState(newState);
  }

  renderHelpText(message, id) {
    return (
      <div className="val-err-tooltip" key={id}>
        <span>{message}</span>
      </div>
    );
  }

  // editor
  onInputFromKeyboardChange(input) {
    this.setState({ input });
    console.log(input);
  }

  onKeyPress(button) {
    if (button === "{shift}" || button === "{lock}") this.handleShift();
  }

  handleShift() {
    const layoutName = this.state.layoutName;
    this.setState({
      layoutName: layoutName === "default" ? "shift" : "default",
    });
  }

  onChangeInput(event) {
    const input = event.target.value;
    this.setState({ input });
    this.keyboard.setInput(input);
    console.log(input);
  }

  handleShow() {
    this.setState({ show: false });
  }

  render() {
    // explicit class assigning based on validation
    let notValidClasses = {};
    notValidClasses.emailEmergencyCls = this.props.isValid("emailEmergency")
      ? "no-error col-md-8"
      : "has-error col-md-8";

    // Fisierele sursa
    const handleFilePath = (filePath) => {
      if (filePath.length > 0) return "http://127.0.0.1:8000/media/" + filePath;
      //https://httpbin.org/post
      //http://127.0.0.1:8000/media/
      return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
    };
    return (
      <div className="step step4">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="control-label col-md-12 ">
                <h1>
                  Pasul 4: Verifică și editează rezultatul obținut după procesul
                  OCR
                </h1>
              </label>
            </div>
            <div className="row mt-3">
              <div className="form-group col-md-9 content form-block-holder">
                <label className="control-label col-11">
                  {this.state.ocrResults &&
                    this.state.ocrResults.map((item, index) => {
                      return (
                        <div key={index}>
                          <span className="ocrResultTitle text-info">{`Rezultatul OCR pentru imaginea ${
                            index + 1
                          }:`}</span>
                          <button
                            className="btn btn-secondary col-1"
                            type="button"
                            title="Tatstatura Virtuală"
                            onClick={() =>
                              this.setState({ show: !this.state.show })
                            }
                          >
                            <svg className="svg_keyboard" viewBox="0 0 24 24">
                              <path
                                fill="currentColor"
                                d="M19,10H17V8H19M19,13H17V11H19M16,10H14V8H16M16,13H14V11H16M16,17H8V15H16M7,10H5V8H7M7,13H5V11H7M8,11H10V13H8M8,8H10V10H8M11,11H13V13H11M11,8H13V10H11M20,5H4C2.89,5 2,5.89 2,7V17A2,2 0 0,0 4,19H20A2,2 0 0,0 22,17V7C22,5.89 21.1,5 20,5Z"
                              />
                            </svg>
                          </button>
                          <textarea
                            key={index}
                            value={item}
                            onChange={this.on}
                            className="form-control"
                            rows="20"
                          ></textarea>
                          
                        </div>
                      );
                    })}
                </label>

                {this.state.show && (
                  <Keyboard
                    keyboardRef={(r) => (this.keyboard = r)}
                    layoutName={this.state.layoutName}
                    onChange={this.onInputFromKeyboardChange.bind(this)}
                    onKeyPress={this.onKeyPress.bind(this)}
                    layout={this.cyrillicRomanianLayout}
                  />
                )}
              </div>
              <div className="form-group col-md-3 content form-block-image">
                {/* {this.state.preprocessedFiles[0]} */}
                {this.state.preprocessedFiles.map((src, index) => (
                  <a
                    className=""
                    data-fancybox="gallery_2"
                    data-src={handleFilePath(src)}
                    data-caption="imagine originală"
                    key={index}
                  >
                    <img
                      className="Accordion_image"
                      src={handleFilePath(src)}
                    />
                  </a>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

Step4.propTypes = {
  errors: PropTypes.object,
  validate: PropTypes.func,
  isValid: PropTypes.func,
  handleValidation: PropTypes.func,
  getValidationMessages: PropTypes.func,
  clearValidations: PropTypes.func,
  getStore: PropTypes.func,
  updateStore: PropTypes.func,
};

export default validation(strategy)(Step4);
