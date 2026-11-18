import app from 'flarum/common/app';
import Component from 'flarum/common/Component';
import UserFileList from './UserFileList';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';

export default class DropZone extends Component {
    oninit(vnode) {
        super.oninit(vnode);

        this.uploaded = false;
        this.enable = false;
        this.loading = false;
        this.content = '';
        this.files = '';
        this.text_original = Stream(!!this.attrs.text_original);
        this.text_transliterat = Stream(!!this.attrs.text_transliterat);
        this.files = '';

        this.contor = 0;
    }

    view() {
        if (this.attrs.selectedFiles.length != 0) {
            this.uploaded = true;
        } else {
            this.uploaded = false;
        }

        app.fileListState.files.map((file) => {
            if (!this.attrs.selectedFiles.includes(file.id())) return;

            if (file.type().includes('image/') || file.type() === 'application/pdf') {
                this.contor++;
            }

            if (this.contor != 0) {
                this.enable = true;
            } else {
                this.enable = false;
            }
        });

        return (
            <div >
                {
                    this.loading &&
                    (
                        <div className="div_loading">
                            <img src="https://digi.emoldova.org/assets/files/2021-04-29/1619697698-204093-cyr-ocr-animation.gif" />
                        </div>
                    )
                }
                <div className='NoDropZone'>
                    {
                        this.uploaded &&
                        (UserFileList.component({
                            user: this.attrs.user,
                            selectable: true,
                            onFileSelect: this.attrs.onFileSelect.bind(this),
                            selectedFiles: this.attrs.selectedFiles,
                            restrictFileType: this.attrs.restrictFileType
                        }))
                    }
                    {
                        this.uploaded && (
                            <div className='UserFileList-buttons'>
                                {
                                    (this.files == '') ?
                                        Button.component({
                                            className: "Button Button--primary button_transliterare",
                                            onclick: this.transliterate.bind(this),
                                            disabled: !this.enable,
                                            loading: this.loading
                                        },
                                            app.translator.trans('digi-media-manager.forum.dropzone.transliterate_button')
                                        ) : ''
                                }

                                {this.files && (
                                    <div className='UserFileList-text'>
                                        <h3 class>Textul din imagine a fost recunoscut si transliterat. Selecteaza textul/textele pentru a continua.</h3>
                                        <div className="Form-group">
                                            <div>
                                                <label className="checkbox">
                                                    <input type="checkbox" bidi={this.text_original} oncha disabled={this.loading} />
                                                    {app.translator.trans('digi-media-manager.forum.dropzone.checkbox_text_original')}
                                                </label>
                                                <label className="checkbox">
                                                    <input type="checkbox" bidi={this.text_transliterat} disabled={this.loading} />
                                                    {app.translator.trans('digi-media-manager.forum.dropzone.checkbox_text_transliterat')}
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                )
                                }
                                {(this.files !== '') ?
                                    Button.component({
                                        className: "Button Button--primary button_transliterare",
                                        onclick: this.addFilesAndText.bind(this),
                                    },
                                        app.translator.trans('digi-media-manager.forum.dropzone.add_to_composer_button')
                                    ) : ''}
                            </div>
                        )

                    }
                </div>


                {!this.uploaded &&
                    (<div className="dropzone">
                        <div class="icon-container">
                            <i class="far fa-file-image fa-4x"></i>
                            <i class="far fa-file-pdf fa-4x"></i>
                            <i class="far fa-file-alt fa-4x"></i>
                        </div>
                        <h1>{app.translator.trans('digi-media-manager.forum.dropzone.title')}</h1>
                        <p>{app.translator.trans('digi-media-manager.forum.dropzone.subtitle')}</p>
                    </div>)}
            </div>
        );
    }

    transliterate() {
        this.loading = true;
        this.files = '';
        let params = { user_id: app.session.user.id() };
        let maxFileSize = 0;

        app.fileListState.files.map((file) => {
            if (!this.attrs.selectedFiles.includes(file.id())) return;

            if (file.url().includes('imgur')) return;

            if (file.type().includes('image/') || file.type() === 'application/pdf') {
                eval(`params.id_${file.id()} = ${file.id()}`);
                if (file.size() > maxFileSize) {
                    maxFileSize = file.size();
                }
            }
        });

        if (maxFileSize === 0) {
            alert('One or more files no corresponding with requirement!');
            this.loading = false;
            m.redraw();
            return;
        }
        this.request(params);
        // if (maxFileSize < 5242880) { // less than 5 MB
        //     setTimeout(() => { this.request(params) }, 1000 * 20); // 20 sec.
        //     return;
        // }
        // if (maxFileSize >= 5242880 && maxFileSize < 10485760) { // between 5 MB and 10 MB
        //     setTimeout(() => { this.request(params) }, 1000 * 90); // 90 sec. / 1.5 minutes
        //     return;
        // }
        // if (maxFileSize >= 10485760 && maxFileSize < 15728640) { // between 10 MB and 15 MB
        //     setTimeout(() => { this.request(params) }, 1000 * 150); // 150 sec. / 2.5 minutes
        //     return;
        // }
        // if (maxFileSize >= 15728640 && maxFileSize < 20971520) { // between 15 MB and 20 MB
        //     setTimeout(() => { this.request(params) }, 1000 * 300); // 300 sec. / 5 minutes
        //     return;
        // }
        // if (maxFileSize >= 20971520 && maxFileSize < 26214400) { // between 20 MB and 25 MB
        //     setTimeout(() => { this.request(params) }, 1000 * 400); // 400 sec. / 6,(6) minutes
        //     return;
        // }
        // if (maxFileSize >= 26214400 && maxFileSize < 52428800) { // between 20 MB and 50 MB
        //     setTimeout(() => { this.request(params) }, 1000 * 500); // 500 sec. / 8,(3) minutes
        //     return;
        // }
        // if (maxFileSize >= 52428800 && maxFileSize < 104857600) { // between 50 MB and 100 MB
        //     setTimeout(() => { this.request(params) }, 1000 * 600); // 600 sec. / 10 minutes
        //     return;
        // }
        // if (maxFileSize >= 104857600 && maxFileSize < 262144000) { // between 100 MB and 250 MB
        //     setTimeout(() => { this.request(params) }, 1000 * 60 * 20); // 20 minutes
        //     return;
        // }
    }

    request(params) {
        return app
            .request({
                method: 'GET',
                url: app.forum.attribute('apiUrl') + '/trans-texts',
                params: params,
            })
            .then((data) => {
                this.files = data.data;
                this.loading = false;
                m.redraw();
            })
            .catch((error) => {
                this.loading = false;
                m.redraw();
                throw error;
            });
    }

    addFilesAndText() {
        app.modal.close();

        const text_original = this.text_original();
        const text_transliterat = this.text_transliterat();

        let k = 0;
        this.attrs.selectedFiles.map((fileId) => {
            const file = app.store.getById('files', fileId);

            try {
                if (file.id() === this.files[k].id) {
                    app.composer.editor.insertAtCursor(file.bbcode() + '\n\n');
                    if (text_transliterat == true) {
                        app.composer.editor.insertAtCursor('[transliterat]\n' + this.files[k].attributes.url + '\n[/transliterat]\n\n');
                    }
                    if (text_original == true) {
                        app.composer.editor.insertAtCursor('[chirilic]\n' + this.files[k].attributes.path + '\n[/chirilic]\n\n');
                    }
                    k++;
                }
            } catch (error) {
                k++;
                app.composer.editor.insertAtCursor(file.bbcode() + '\n\n');
            }
        });
    }
}
