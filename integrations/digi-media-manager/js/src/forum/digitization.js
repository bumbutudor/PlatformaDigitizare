import app from 'flarum/forum/app';
import Page from 'flarum/common/components/Page';
import Button from 'flarum/common/components/Button';
import LogInModal from 'flarum/forum/components/LogInModal';

export function newJobId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const s = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return s.slice(0, 8) + '-' + s.slice(8, 12) + '-' + s.slice(12, 16) + '-' + s.slice(16, 20) + '-' + s.slice(20);
}

export function bridgeRequest(path, method = 'GET', body) {
  return app.request({ method, url: app.forum.attribute('apiUrl') + '/digitization/' + path, body });
}

export function bridgeError(error) {
  return (error.response && error.response.msg) || 'Serviciul de digitizare este temporar indisponibil. Documentele sunt păstrate; reîncearcă.';
}

export class DigitizationPage extends Page {
  oninit(vnode) { super.oninit(vnode); this.loading = false; this.message = ''; this.id = newJobId(); }

  async connect() {
    this.loading = true;
    try {
      const data = await bridgeRequest('jobs', 'POST', { id: this.id, mode: 'advanced', fileIds: [] });
      if (window.opener && new URLSearchParams(location.search).get('connect') === '1') {
        window.opener.postMessage({ type: 'digi-connected', context: data.handoff }, 'https://digitizare.math.md');
        this.message = 'Contul Digi este conectat. Revino în Platforma de Digitizare pentru a salva documentul.';
      } else { location.assign(data.advancedUrl); }
    } catch (error) { this.message = bridgeError(error); }
    this.loading = false; m.redraw();
  }

  view() {
    return <div className="container DigiDigitization">
      <h2>Platforma de Digitizare</h2>
      <p>Folosește preprocesarea și opțiunile OCR avansate. La final, documentul poate fi salvat ca ciornă în contul tău Digi.</p>
      {app.session.user ? <Button className="Button Button--primary" loading={this.loading} onclick={() => this.connect()}>
        Continuă cu contul {app.session.user.displayName()}
      </Button> : <Button className="Button Button--primary" onclick={() => app.modal.show(LogInModal)}>Autentifică-te în Digi</Button>}
      {this.message && <p role="status">{this.message}</p>}
    </div>;
  }
}

export class DigitizationResultPage extends Page {
  oninit(vnode) { super.oninit(vnode); this.loading = false; this.error = ''; }

  async openDraft() {
    this.loading = true;
    try {
      await app.store.find('drafts');
      app.cache.draftsLoaded = true;
      const draft = app.store.getById('drafts', String(m.route.param('id')));
      if (!draft || !draft.user() || draft.user().id() !== app.session.user.id()) {
        this.error = 'Ciorna nu există în acest cont sau a fost deja publicată. Verifică articolele și ciornele tale.';
      } else { app.drafts.showComposer(draft); }
    } catch (error) { this.error = 'Ciorna nu a putut fi deschisă. Reîncearcă.'; }
    this.loading = false; m.redraw();
  }

  view() {
    return <div className="container DigiDigitization"><h2>Documentul digitizat</h2>
      <p>Documentul a fost salvat ca ciornă. Verifică textul înainte de publicare.</p>
      {app.session.user ? <Button className="Button Button--primary" loading={this.loading} onclick={() => this.openDraft()}>Deschide ciorna în editor</Button> :
        <Button className="Button Button--primary" onclick={() => app.modal.show(LogInModal)}>Autentifică-te în Digi</Button>}
      {this.error && <p role="alert">{this.error}</p>}
      <p><a href="/drafts">Toate ciornele mele</a></p>
    </div>;
  }
}
