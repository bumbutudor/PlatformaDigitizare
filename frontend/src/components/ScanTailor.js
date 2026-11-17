import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { SCANTAILOR_DEFAULT_OPTIONS } from '../utils/ScanTailorConfig';

export default class ScanTailor extends Component {
  constructor(props) {
    super(props);
    this.state = { options: { ...SCANTAILOR_DEFAULT_OPTIONS, ...props.getStore().preprocessScanTailor } };
  }

  componentDidMount() {
    this.props.updateStore({ preprocessMode: 'web', preprocessScanTailor: { ...this.state.options } });
  }

  saveOptions = () => {
    this.props.updateStore({ preprocessMode: 'web', preprocessScanTailor: { ...this.state.options } });
    if (this.props.onOptionsChange) this.props.onOptionsChange();
  };

  updateOption = (event) => {
    const { name, type, value, checked } = event.target;
    this.setState(({ options }) => ({ options: { ...options, [name]: type === 'checkbox' ? checked : value } }), this.saveOptions);
  };

  resetOptions = () => {
    this.setState({ options: { ...SCANTAILOR_DEFAULT_OPTIONS } }, this.saveOptions);
  };

  numberField(name, label, min, max, step = 1) {
    return <Form.Group className="col-sm-6 col-lg-4 mb-2" controlId={`st-${name}`} key={name}>
      <Form.Label>{label}</Form.Label>
      <Form.Control name={name} type="number" min={min} max={max} step={step}
        value={this.state.options[name]} onChange={this.updateOption} />
    </Form.Group>;
  }

  selectField(name, label, choices) {
    return <Form.Group className="col-sm-6 col-lg-4 mb-2" controlId={`st-${name}`} key={name}>
      <Form.Label>{label}</Form.Label>
      <Form.Select name={name} value={this.state.options[name]} onChange={this.updateOption}>
        {choices.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </Form.Select>
    </Form.Group>;
  }

  render() {
    const options = this.state.options;
    return <fieldset disabled={this.props.disabled} className="py-3">
      <legend>2.2 ScanTailor pe server</legend>
      <p>Încarcă o singură pagină per imagine. Rezultatul PNG păstrează detaliile fără compresie JPEG.</p>
      <div className="row">
        {this.numberField('inputDpi', 'DPI sursă', 75, 1200)}
        {this.numberField('resolution', 'DPI rezultat', 75, 1200)}
        {this.selectField('colorMode', 'Mod culoare', [['black_and_white', 'Alb-negru'], ['color_grayscale', 'Culoare / tonuri de gri'], ['mixed', 'Mixt']])}
      </div>
      <p className="small text-muted">Pentru comparația cu desktopul, reproduce separat DPI-ul sursei și DPI-ul rezultatului din proiectul ScanTailor.</p>
      <div className="row">
        {this.selectField('orientation', 'Orientare', [['none', 'Fără rotire'], ['left', '90° stânga'], ['right', '90° dreapta'], ['upsidedown', '180°']])}
        {this.selectField('deskew', 'Îndreptare', [['auto', 'Automată'], ['manual', 'Unghi manual']])}
        {options.deskew === 'manual' && this.numberField('rotation', 'Unghi (grade)', -45, 45, 0.1)}
        {this.selectField('layout', 'Încadrare pagină', [['1', 'O pagină, fără tăiere laterală'], ['1.5', 'O pagină, cu tăiere laterală']])}
        {this.selectField('contentDetection', 'Detectarea conținutului', [['cautious', 'Prudentă'], ['normal', 'Normală'], ['aggressive', 'Agresivă']])}
      </div>
      <div className="row">
        {this.numberField('marginTop', 'Margine sus (mm)', 0, 50, 0.1)}
        {this.numberField('marginRight', 'Margine dreapta (mm)', 0, 50, 0.1)}
        {this.numberField('marginBottom', 'Margine jos (mm)', 0, 50, 0.1)}
        {this.numberField('marginLeft', 'Margine stânga (mm)', 0, 50, 0.1)}
        {this.selectField('alignmentVertical', 'Aliniere verticală', [['top', 'Sus'], ['center', 'Centru'], ['bottom', 'Jos']])}
        {this.selectField('alignmentHorizontal', 'Aliniere orizontală', [['left', 'Stânga'], ['center', 'Centru'], ['right', 'Dreapta']])}
      </div>
      <div className="row">
        {this.selectField('despeckle', 'Eliminarea punctelor', [['off', 'Oprită'], ['cautious', 'Prudentă'], ['normal', 'Normală'], ['aggressive', 'Agresivă']])}
        {this.numberField('threshold', 'Grosime text (- subțire / + gros)', -50, 50)}
        {this.selectField('dewarping', 'Corectarea curburii', [['off', 'Oprită'], ['auto', 'Automată']])}
        {options.dewarping === 'auto' && this.numberField('depthPerception', 'Intensitatea curburii', 1, 3, 0.1)}
      </div>
      <p className="small text-muted">Eliminarea agresivă a punctelor poate șterge diacritice. Verifică rezultatul mărit înainte de OCR.</p>
      <Form.Check id="st-whiteMargins" name="whiteMargins" label="Margini albe"
        checked={options.whiteMargins} onChange={this.updateOption} />
      <Form.Check id="st-normalizeIllumination" name="normalizeIllumination" label="Uniformizarea iluminării"
        checked={options.normalizeIllumination} onChange={this.updateOption} />
      <Button type="button" variant="outline-secondary" size="sm" className="mt-3" onClick={this.resetOptions}>Restabilește valorile inițiale</Button>
    </fieldset>;
  }
}
