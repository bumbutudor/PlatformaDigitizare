"use strict";

import React, { Component, useRef } from "react";
import PropTypes from "prop-types";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import layouts from "../components/KeyboardLayouts";
import RichTextEditor from "../components/RichTextEditor";
import { EditorState, ContentState, convertFromHTML } from "draft-js";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import StepsInfo from "../components/StepsInfo";
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";

class Step4 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // ocrResults: [
      //   "\ufeffн у се штие ын че ан, дар ера ун ом некибзуит ла требь ши жумулит де соартэ. Унде н’ар фи лукрат, фэчя кыте о гафэ, де токмай ыць луний мыниле ’н кап. Шефилор ли се фэчя милэ де нэтынгэрииле луй ши-л му-тау де коло-коло, пынэ ын сфыршит се помени, бьетул ом, дрегэтор песте алиментация публика, С'а букурат омул де маштабул активитэций ши унде се репеде де адунэ тоатэ оастя алиментацией публиче ши унде се уркэ ла трибунэ ши цине о кувынта-ре:\n— Скумпий мей, в’ам адунау коля, ка сэ вэ аминтеск, поате май ку тылк декыт алций, кэ мынкаря есте уна дин кондицииле фундаментале але фиинцэрий омулуй... Ятэ о пилдэ: я ынчеркаць ши ну хрэниць вителе. Ындатэ ор ынчепе сэ збере...\nЛумя рэмасе таблоу. Пынэ акум нимень ну ле ворбисе атыт де фрумос ши ку пилде атыт де конкрете. Инструкция ноул шеф шь-о ынкее аша:\n— Еу персонал вой трече прин фиекаре оспэтэрие сэ дмскутэм лынгэ кастроане, че фел де мынкаре плаче публикулуй... Вэ дореск спор ла мункэ, яр консуматорилор пофтэ бунэ!\nБукэтарий сынт оамень ку фанте-зие. Де ачея песте ноапте шь-ау ре-визуит куноштинцеле кулинаре, ка сэ ну се дее де рушине. Пе унде стэтяу ла ындоялэ, май ынтребау ши де соакре.\n— Че авець бун? — зисе омул ын лок де бинеце, сосит ла прима букэтэрие ку ноаптя ын кап. Симци о кэлдурэ плэкутэ де абурь.\nАкасэ ну луасе нич нафурэ ын гурэ. Кыт ай зиче пеште букэтарий ый пусерэ о штюка ымплутэ, кытева фелурь де икре ши лифтие де крап.\n— Де унде сэ ынчеп?.. А!.. Де ла куркан!\n*— Черем скузё, — зисерэ букэтарий фыстычиць. — Букате ле куркан о сэ авем мыне.\nА мынкат ку пофтэ, мэкар кэ ну ера куркан.\nНетезинду-се ушурел песте пынтече, пропусе субалтернилор, ка пе меселе дин оалэ сэ фие ынтотдяуна саре, килер мэчинат ши муштар. Кэч консуматорий фак гэлэжие дин кау-\nМЭМЭЛИГА\nза аста ши чер кондика де рекламаций. Букэтарий ынсэ ау зымбит дул-чаг:\n— Се поате... дар... хык... штиць... кум сэ вэ спунем?.. Оспэтэрия ноастрэ е диететикэ.\n— Пунець! Доар мынкаря есте уна дин кондицииле де самэ але екзистенцей омулуй.\nШефул плякэ, дар ну уйтэ ла амязэ сэ трякэ пе ла алтэ оспэтэрие ын интерес де сервичиу. Яр ын урма луй консуматорий визитау «диететика» ши стэтяу ла рынд аштептынд кондика де рекламаций. Оамений ышь аш-терняу фиекаре ын фелул сэу немул-цумириле. «Ной обсервэм, — скрие Иванов сау Гуцу,— кэ мыякэруриле се прегэтеск прост. Сервиря консуматорилор ну-й дин челе май плэкуте. Ын сала читим инскрипция: «Колек-тивул оспэтэрией луптэ пентру титлул де бригадэ а мунчий комунисте». Дупэ мине, ачастэ лозинка е афишатэ ын оспэтэрия № З пря девреме, мэкар кэ ын фонд еа есте ун лукру фоарте бун». Ши дупэ фиекаре рекламацие шефул вине сингур сэ рэспундэ ын скрис, кум кэ «мынкаря есте уна дин проблемеле де базэ але сочиализмулуй... Аша кэ май сынт греутэць ши букэтарий виноваць сынт педепсиць пе линие административэ!»\nЗилеле де лукру тречяу ын маре кин. Май алес кынд визита кафеняуа ку мынкэрурь национале «Пэпушой». Доар аколо унде лукрасе май ынаинте авя де афаче ку орьче врей, нумай ну ку асортиментул продуселор. Де унде сэ штие, бунэоарэ, кум е мэ-мэлигуца ку брынзэ де оае, ку жу-мере, токана ку муждей? Доар ши еле фак парте дин «кондицииле де самэ але фиинцэрий омулуй». Ынсэ кум аратэ еле? Букэтарий сэ штие? Да де унде! Букэтарий ыс тот «фраций» луй, ачеясйь дупэ густ ши киб-зуялэ... Сэ фие ал найбей чел де-а нэскочит ши кулинария аста!\nЫл принде ынтр’о зи ун клиент\nЕ РОТУНДЭ\nаморезат де «Пэпушой» ши-л я ку кресчендо:\n— Думнята ынцележь че фел де алуат е ачеста?\n— Мэмэлигэ!\n— Пэй, мэмэлига-й аша, бре?.. Кынд ый фяртэ бине, еа ну се липеш-те де фарфурие. Е густоасэ ши ро-тундэ... Ротундэ, ынцележь?..\n— Ыхы... Ротундэ! Ын формэ де «О»!... Ротундэ!\n— Стай! Думнята ну мэ луа ку ротунда... Мэмэлига май есте ши алтфел: урс де мэмэлигэ, мэмэлигэ прэжитэ, мэмэлигэ ла куптор. Ултима се сервеште ын формэ.\n— Жуст! Ын формэ де «О>!..\nКонсуматорул претенциос н’а скрис нимик ын кондика де рекламаций. Ел штия динаинте рэспунсул; «мынкаря есте уна дин проблемеле... аша кэ... букэтарий сынт педепсиць пе линие...»\nСэ май визитезе вре-о оспэтэрие? Ый есте лехамите! Шефул кулинари-лор се дуче ла рестаурант. Ынтрэ. Веде музика. Ши командэ кынтекул «И баранку не бросал шофер». Пе урмэ, трече директ ла букэтэрие. Аколо букэтарий авяу нумай антрикоате. Шефул а черут бифштекс. Пынэ и л-ор прэжи, буфетара ыл сервеште ку ун коньяк. Семидиспус ел я оспэтэрица ла дане ши унде-й зиче уна солдэ-цяскэ, ын чуда тутурор... Адикэ, а «тутурор» е пря мулт спус. Ын сала ера нумай клиентул чела де ла «Пэпушой», каре-й спусе, кэ мэмэлига е ротундэ, ши венисе мэкар аич с’о гэсяскэ.\nШи акум ворба де ла ынчепут: «Ну се штие ын че ан, дар ера ун ом...» Ба ши анул се штие, ши омул се штие. Чел каре кондуче алиментация публикэ дин Сорока есте Н. Корол. Ной интенционат ну л-ам нумит де одатэ, деоарече ын фойлетон (ка прототипь) фигурязэ ши алць дрегэ-торь, каре штиу доар уна ши бунэ: мэмэлига е ротундэ!\nА. ВАСИЛЮК",
      //   '\ufeffлумилор черешть, ка ши ын в’|яца челей май неын-сэмнате в!ецуитоаре, семнул нумелуй Вииторулуй.\nВеститул ынвэцат енглез ши адынк кужетэтор Бакон, пэринтеле штиинцей, ынтемеяте пе довезь вэзуте, спуне, кы фшнца адевэратей штиинце ши адевэратей философа е де а дуче омениря ла десэвыршитэ причепере а Зидиторулуй ей. ши чел май бун мижлок спре а-шь ажунже цинта ачяста есте, ле лынгы Сфынта Скрилтуры, черчетаря лум1й, ынтемеяты пе довезь вэзуте. Ши ачесте ворбе, спусе де Бакон, сынт пентру фиекаре минте лумина! ы ку атыт мэй лэмурите ши май адевэрате, ку кыт ши минтя ачяста пэтрунде май адынк ши ку кыт куноштинцеле ей сынт май ынтинсе.\nЛуаць, де пилды, пе Ньютон, каре а лэмурит лежиле мишкэрь тутурор стелелор ши сорилор дин луме. Чейлалць ынвэцаць марь ну гэсеск дестуле ворбе, ка сы-л лауде, ши ел, ачест маре Ньютон, обишнуя сы спуе деспре сине урмэтоареле: „ну шву кум и се паре лум1й, дар м!е ми се паре, кы сынт ка ун копил мик. каре се жоакы пе малул мэр1й ши адуны петричеле албе ши лучюасе ши скойчь де маре, ын време че очеанул чел .маре акопере ши аскунде адевэрул динаинтя луй". Аша зичя деспре сине ачест маре ур!аш ал минщй ши ал штшнцей, ши фацы де Думнезэу авя атыта плекаре ши атыта евлав1е, ынкыт, кынд мержя пе улицы, ну путя сы ростяскы нумеле луй Думнезэу, фэры сы-шь ее пэ-лэр1я дин кап.\nВеститул математик ши натуралист Ампер, каре а ынтемеят о ноуы игпинцы—електродинамика, сфэ-туеште астфель пе ун тынэр: .Фереште-те де а те ынделетничи нумай ку штшнца, кум ай фэкут лэны',
      // ],
      ocrResults: props.getStore().ocrResults,
      sourceFiles: props.getStore().sourceFiles,
      s3SourceFiles: props.getStore().s3SourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      s3PreprocessedFiles: props.getStore().s3PreprocessedFiles,
      layoutName: "default",
      showk: false,
      showNextStep: false,
      // input: ""
      inputID: 0,
    };
    // this.keyboard = React.createRef();

    this.cyrillicRomanianLayout = layouts[props.getStore().alphabet];

    /* this.state = {editorState: EditorState.createEmpty()};
    this.onChange = editorState => this.setState({editorState}); */

    /* console.log(this.setState()); */
    this.onChange = (editorState) => this.setState({ editorState });

    this.step4Info = (
      <Popover id="popover-basic">
        <Popover.Header as="h4">{StepsInfo.step4Info.title}</Popover.Header>
        <Popover.Body>
          {StepsInfo.step3Info.body}

        </Popover.Body>
      </Popover>
    );
  }

  componentDidMount() { }

  onChange(e) {
    let newState = {};
    newState[e.target.name] = e.target.value;
    this.setState(newState);
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

  setActiveInput(event) {
    this.setState({ inputID: event.target.id });
    /* console.log(event.target.id); */
  }

  onChangeInput(event) {
    const input = event.target.value;
    this.state.ocrResults[this.state.inputID] = input;
    this.setState({ ocrResults: [...this.state.ocrResults] });
    console.log(this.state.ocrResults);
    this.props.updateStore({ ocrResults: this.state.ocrResults });
    // this.keyboard.setInput(input);
  }

  onChangeKeyboardInput(input, a) {
    console.log(input, a);
    const inputID = this.state.inputID;
    const ocrResults = this.state.ocrResults;
    ocrResults[inputID] = input;
    this.setState({ ocrResults: [...ocrResults] });
  }

  handleKeyboardButton(showk) {
    const keyboardButton = document.querySelector("button#keyboard-button");
    if (keyboardButton) {
      if (showk) {
        keyboardButton.classList.remove("btn-primary");
        keyboardButton.classList.add("btn-keyboard");
        return "Închide tastatura virtuală";
      }
      keyboardButton.classList.remove("btn-keyboard");
      keyboardButton.classList.add("btn-primary");
    }
    return "Deschide tastatura virtuală";
  }

  handleSubmit() {
    this.setState({ showNextStep: true });
  }

  render() {
    // Fisierele sursa
    const handleFilePath = (filePath) => {
      if (filePath.length > 0) return "https://a926-81-180-76-251.eu.ngrok.io/media/" + filePath;
      //https://httpbin.org/post
      //http://127.0.0.1:8000/media/
      return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
    };
    return (
      <div className="step step4">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="control-label col-md-12 d-flex">
                <h1>Pasul 4: Verifică și editează textul recunoscut</h1>
                <OverlayTrigger
                  trigger="click"
                  rootClose
                  placement="right"
                  overlay={this.step4Info}
                >
                  <Button
                    type="button"
                    className="btn btn-info text-white mx-4"
                  >
                    Info
                  </Button>
                </OverlayTrigger>

              </label>
            </div>
            <div className="row mt-3">
              <div className="form-group col-md-12 content form-block-holder">
                <Accordion defaultActiveKey={0} alwaysOpen>
                  {/* <label className="control-label col-12"> */}
                  {this.state.ocrResults.length > 0 &&

                    this.state.ocrResults.map((item, index) => {
                      return (

                        <Accordion.Item eventKey={index} key={index}>
                          {/* <Accordion.Header>
                            {`Rezultatul OCR pentru documentul ${this.state.sourceFiles[index].name}`}
                          </Accordion.Header> */}
                          <Accordion.Body>

                            <Row>

                              <Col sm={9}>
                                <textarea
                                  key={index}
                                  id={index}
                                  onFocus={this.setActiveInput.bind(this)}
                                  value={item}
                                  onChange={this.onChangeInput.bind(this)}
                                  className="form-control text"
                                  rows="14"
                                ></textarea>
                              </Col>

                              <Col sm={3}>
                                <Col sm={12}>
                                  <button
                                    id="keyboard-button"
                                    className="btn btn-primary"
                                    type="button"
                                    title="Tastatura Virtuală"
                                    onClick={() => this.setState({ showk: !this.state.showk })}>
                                    <svg className="svg_keyboard mx-2 pb-1" viewBox="0 0 24 24">
                                      <path fill="currentColor"
                                        d="M19,10H17V8H19M19,13H17V11H19M16,10H14V8H16M16,13H14V11H16M16,17H8V15H16M7,10H5V8H7M7,13H5V11H7M8,11H10V13H8M8,8H10V10H8M11,11H13V13H11M11,8H13V10H11M20,5H4C2.89,5 2,5.89 2,7V17A2,2 0 0,0 4,19H20A2,2 0 0,0 22,17V7C22,5.89 21.1,5 20,5Z"
                                      /></svg>
                                    {this.handleKeyboardButton(this.state.showk)}
                                  </button>
                                  <div className="mt-3">
                                    Compară rezultatul OCR cu imaginea sursă preprocesată:
                                    <img src={this.state.s3PreprocessedFiles[index]}
                                    />
                                  </div>

                                </Col>


                              </Col>



                            </Row>
                          </Accordion.Body>
                        </Accordion.Item>

                      );
                    })}
                </Accordion>


                {/* </label> */}

                {this.state.showk && (
                  <Keyboard
                    keyboardRef={(r) => (this.keyboard = r)}
                    layoutName={this.state.layoutName}
                    onChange={(inputs) =>
                      this.onChangeKeyboardInput(
                        inputs,
                        this.state.ocrResults[this.state.inputID]
                      )
                      //.bind(this)
                    }
                    onKeyPress={this.onKeyPress.bind(this)}
                    layout={this.cyrillicRomanianLayout.layout}
                  />
                )}
              </div>
              {/* <div className="form-group col-md-3 content form-block-image">
                
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
              </div> */}
            </div>
          </form>
        </div >

        <Row className="mt-2">
          <Col>
            <Button className="save-ocr  float-end" onClick={this.handleSubmit.bind(this)}>
              Salvează modificările
            </Button>
            <span className="text-muted mx-2 mt-2 float-end">Ai verificat textul? Dacă da atunci </span>

          </Col>
          <Col>
            {this.state.showNextStep && (<>
              {document.querySelector(".save-ocr").disabled = true}
              {" "}
              <Button
                variant="primary mx-4"
                onClick={() => this.props.jumpToStep(4)}>
                Mergi la pasul următor - transliterarea textului verificat
              </Button>
            </>)}
          </Col>
        </Row>
      </div >
    );
  }
}

export default Step4;
