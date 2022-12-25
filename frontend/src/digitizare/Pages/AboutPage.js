
import React from 'react';
import DigitizationSteps from '../DigitizationSteps';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const BigModal = (props) => {


    return (
        <Modal

            {...props}
            size="lg"
            fullscreen={true}
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header closeButton>

            </Modal.Header>
            <Modal.Body>
                {props.children}
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Închide</Button>
            </Modal.Footer>
        </Modal>
    );
}




const AboutPage = () => {

    const [modalShow, setModalShow] = React.useState(false);

    return (
        <div className="tab-content-body">
            <p className="announcement">25 Decembrie 2022 — a fost lansată  <a href="#aplicatie" onClick={() => setModalShow(true)}>DigiApp v0.1.0-beta.14</a></p>
            <p>
                Platforma de digitizare oferă instrumente și resurse informaționale pentru digitizarea documentelor românești scrise în alfabete chirilice, tipărite între secolele XVII și XX.
            </p>
            <p>
                Cel mai recent instrument dezvoltat este o <a href="#aplicatie" onClick={() => setModalShow(true)}>aplicație de digitizare</a> (DigiApp) care înglobează majoritatea instrumentelor folosite în procesul de digitizare, precum, motoare și module de prelucrare a imaginilor, modele de recunoaștere optică a caraterelor (modele OCR), dicționare folosite la recunoaștere, aplicație de transliterare din chirilică în latină și viceversa, dicționare de excepții folosite la corectarea textului tranliterat. Acest instrumente pot fi accesate din pagina "Instrumente și Resurse".
            </p>
            <div className="" >
                <a
                    className=""
                    data-fancybox="Platformă de digitizare"
                    data-src={"https://s3.eu-west-2.amazonaws.com/emoldova.bucket/platforma-digi/2022-12-25/Digital_Tree2.png"}
                >
                    <img width={650}
                        className="logo-image"
                        src={"https://s3.eu-west-2.amazonaws.com/emoldova.bucket/platforma-digi/2022-12-25/Digital_Tree2.png"}
                    />
                </a>
            </div>
            <BigModal show={modalShow} onHide={() => setModalShow(false)} >
                <DigitizationSteps />
            </BigModal>

        </div>
    );
}

export default AboutPage;