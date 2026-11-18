import app from 'flarum/common/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import UserFileList from './UserFileList';
import { newJobId, bridgeRequest, bridgeError } from '../digitization';

export default class DigiDropZone extends Component {
  oninit(vnode) {
    super.oninit(vnode);
    this.results = [];
    this.error = '';
    this.loading = false;
    this.original = true;
    this.transliterated = true;
    this.status = '';
  }

  onremove() {
    this.removed = true;
    clearTimeout(this.timer);
  }

  selection() {
    return this.attrs.selectedFiles.filter(id => {
      const file = app.store.getById('files', id);
      return file && (file.type().includes('image/') || file.type() === 'application/pdf');
    });
  }

  async start(mode = 'simple') {
    const ids = this.selection();
    if (!ids.length) return;
    this.error = '';
    this.loading = true;
    this.results = [];
    this.publication = null;
    this.status = 'Se trimit documentele…';
    const tab = mode === 'advanced' ? window.open('about:blank', '_blank') : null;
    const storageKey = 'digi-job:' + app.session.user.id() + ':' + mode + ':' + ids.slice().sort().join(',');
    let id = sessionStorage.getItem(storageKey);
    if (!id) { id = newJobId(); sessionStorage.setItem(storageKey, id); }
    this.jobId = id;
    try {
      const data = await bridgeRequest('jobs', 'POST', { id, mode, fileIds: ids });
      if (mode === 'advanced') {
        if (tab) { tab.opener = null; tab.location.replace(data.advancedUrl); }
        else this.advancedUrl = data.advancedUrl;
        this.loading = false;
        this.status = 'Continuă în Platforma de Digitizare. La final poți salva rezultatul în contul tău Digi.';
      } else { this.pollStarted = Date.now(); await this.poll(); }
    } catch (err) {
      if (tab) tab.close();
      this.error = bridgeError(err);
      this.loading = false;
    }
    m.redraw();
  }

  async poll() {
    if (this.removed) return;
    try {
      const data = await bridgeRequest('jobs/' + this.jobId);
      if (this.removed) return;
      this.publication = data.publication && data.publication.draftId ? data.publication : null;
      if (data.status === 'done') {
        this.results = data.results;
        this.status = 'Textul a fost recunoscut și transliterat. Verifică rezultatul înainte de publicare.';
        this.loading = false;
      } else if (data.status === 'error') {
        this.error = data.msg || 'Procesarea nu a reușit. Poți reîncerca.';
        this.loading = false;
      } else if (Date.now() - this.pollStarted > 2 * 60 * 60 * 1000) {
        this.error = 'Procesarea durează mai mult. Poți relua verificarea; documentele sunt păstrate.';
        this.loading = false;
      } else {
        this.status = data.status === 'queued' ? 'Documentele așteaptă procesarea.' :
          'Se execută OCR și transliterarea (' + data.results.length + ' documente finalizate)…';
        this.timer = setTimeout(() => this.poll(), 5000);
      }
    } catch (err) { this.error = bridgeError(err); this.loading = false; }
    m.redraw();
  }

  async retry() {
    this.error = ''; this.loading = true; this.pollStarted = Date.now();
    try { await bridgeRequest('jobs/' + this.jobId, 'POST', {}); await this.poll(); }
    catch (err) { this.error = bridgeError(err); this.loading = false; }
    m.redraw();
  }

  async saveDraft() {
    this.loading = true; this.error = '';
    try { this.publication = await bridgeRequest('jobs/' + this.jobId + '/draft', 'POST', {}); }
    catch (err) { this.error = bridgeError(err); }
    this.loading = false; m.redraw();
  }

  addFilesAndText() {
    app.modal.close();
    this.results.forEach(result => {
      const file = app.store.getById('files', String(result.id));
      if (!file) return;
      let content = file.bbcode() + '\n\n';
      if (this.original) content += '[chirilic]\n' + result.ocr + '\n[/chirilic]\n\n';
      if (this.transliterated) content += '[transliterat]\n' + result.trans + '\n[/transliterat]\n\n';
      app.composer.editor.insertAtCursor(content);
    });
  }

  view() {
    const selected = this.selection();
    return <div className="DigiDigitization">
      <p>Recunoaștere și transliterare pentru documente tipărite din perioada sovietică (secolul XX).</p>
      {this.attrs.selectedFiles.length > 0 ? <UserFileList user={this.attrs.user} selectable={true}
        onFileSelect={this.attrs.onFileSelect.bind(this)} selectedFiles={this.attrs.selectedFiles}
        restrictFileType={this.attrs.restrictFileType} /> : <p>Încarcă sau selectează documentele din biblioteca ta.</p>}
      {this.status && <p role="status">{this.status}</p>}
      {this.error && <p className="Alert Alert--error" role="alert">{this.error}</p>}
      <div className="DigiDigitization-actions">
        <Button className="Button Button--primary" disabled={!selected.length || this.loading}
          loading={this.loading} onclick={() => this.start('simple')}>Recunoaște și transliterează</Button>
        {this.error && this.jobId && <Button className="Button" disabled={this.loading}
          onclick={() => this.retry()}>Reîncearcă / verifică rezultatul</Button>}
      </div>
      <div className="DigiDigitization-advanced">
        <a className="Button" href="https://digitizare.math.md/" target="_blank" rel="noopener noreferrer"
          onclick={event => { if (selected.length) { event.preventDefault(); if (!this.loading) this.start('advanced'); } }}>
          Folosește Platforma de Digitizare pentru opțiuni avansate
        </a>
        <p>Pentru preprocesare și opțiuni OCR avansate, continuă în Platforma de Digitizare.
          La final, poți salva documentul în contul tău Digi, ca ciornă, pentru verificare și publicare.</p>
        {this.advancedUrl && <a href={this.advancedUrl} target="_blank" rel="noopener noreferrer">Continuă cu documentele selectate</a>}
      </div>
      {!!this.results.length && <div>
        <label><input type="checkbox" checked={this.original} onchange={e => { this.original = e.target.checked; }} /> Text chirilic</label>
        <label><input type="checkbox" checked={this.transliterated} onchange={e => { this.transliterated = e.target.checked; }} /> Text transliterat</label>
        <div className="DigiDigitization-actions">
          <Button className="Button" onclick={() => this.addFilesAndText()}>Adaugă în editor</Button>
          <Button className="Button Button--primary" disabled={this.loading || !!this.publication}
            onclick={() => this.saveDraft()}>Salvează ca ciornă în Digi</Button>
        </div>
      </div>}
      {this.publication && <p className="Alert Alert--success">{this.publication.msg}{' '}
        <a href={this.publication.url}>Deschide documentul în Digi</a></p>}
    </div>;
  }
}
