import { extend, override } from 'flarum/common/extend';
import Button from 'flarum/components/Button';
import UploadButton from './components/UploadButton';
import DropZone from './components/DigiDropZone';
import app from 'flarum/app';
import { DigitizationPage, DigitizationResultPage } from './digitization';

app.initializers.add('block-cat/digi-media-manager', () => {
  app.routes.digitization = { path: '/digitizare', component: DigitizationPage };
  app.routes.digitizationResult = { path: '/digitizare/rezultat/:id', component: DigitizationResultPage };
  extend(require('@fof-upload').components.FileManagerModal.prototype, 'oninit', function() {
    if (!app.session.user) return;

    app.forum.data.attributes.userFileListVisibility = false;
  });


  override(require('@fof-upload').components.FileManagerModal.prototype, 'view', function(original) {
    if (!app.session.user) return original();

    return (
      <div className={`Modal modal-dialog ${this.className()}`}>
          <div className="Modal-content">
              <div className="fof-modal-buttons App-backControl">
                  <UploadButton uploader={this.uploader} disabled={app.fileListState.isLoading()} isMediaUploadButton />
              </div>

              <div className="fof-drag-and-drop">
                  <div className="fof-drag-and-drop-release">
                      <i className="fas fa-cloud-upload-alt" />

                      {app.translator.trans('fof-upload.forum.file_list.release_to_upload')}
                  </div>
              </div>

              <div className="Modal-header">
                  <h3 className="App-titleControl App-titleControl--text">{app.translator.trans('fof-upload.forum.media_manager')}</h3>
              </div>

              {this.alertAttrs && (
                  <div className="Modal-alert">
                      <Alert {...this.alertAttrs} />
                  </div>
              )}

              <div className="Modal-body">
                {(app.forum.attribute('userFileListVisibility')) ?
                require('@fof-upload').components.UserFileList.component({
                  user: this.attrs.user,
                  selectable: true,
                  onFileSelect: this.onFileSelect.bind(this),
                  selectedFiles: this.selectedFiles,
                  restrictFileType: this.restrictFileType
                }) :
                  DropZone.component({
                    user: this.attrs.user,
                    onFileSelect: this.onFileSelect.bind(this),
                    selectedFiles: this.selectedFiles,
                    restrictFileType: this.restrictFileType,
                    onSelect: this.onSelect.bind(this)
                  })
                }
              </div>

              <div className="Modal-footer">
                {
                  (app.forum.attribute('userFileListVisibility')) ?
                  Button.component({
                    id: "currentFilesButton",
                    onclick: this.showAllFiles.bind(this),
                    className: "Button Button--primary",
                  },
                  app.translator.trans('digi-media-manager.forum.current_files')
                  ) :
                  Button.component({
                    id: "allFilesButton",
                    onclick: this.showAllFiles.bind(this),
                    className: "Button Button--secundary",
                  },
                  app.translator.trans('digi-media-manager.forum.all_files')
                  )
                }

                <Button onclick={this.hide.bind(this)} className="Button">
                    {app.translator.trans('fof-upload.forum.buttons.cancel')}
                </Button>

                <Button
                    onclick={this.onSelect.bind(this)}
                    disabled={this.selectedFiles.length === 0 || (!this.multiSelect && this.selectedFiles.length > 1)}
                    className="Button Button--primary"
                >
                    {app.translator.trans('fof-upload.forum.file_list.confirm_selection_btn', { fileCount: this.selectedFiles.length })}
                </Button>
              </div>
          </div>
      </div>
    );
  });

  require('@fof-upload').components.FileManagerModal.prototype.showAllFiles =  () => {
    if (!app.session.user) return;

    app.forum.data.attributes.userFileListVisibility ^= true;
  }
});
