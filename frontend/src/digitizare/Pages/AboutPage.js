
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
            <p className="announcement">25 Decembrie 2022 — a fost lansată  <a href="https://github.com/bumbutudor/PlatformaDigitizare/tree/ngrok-server" target="_blank">DigiApp v0.1.0-beta.14</a></p>
            <p>
                Platforma de digitizare oferă instrumente și resurse informaționale pentru digitizarea documentelor românești scrise în alfabete chirilice, tipărite între secolele XVII și XX.
            </p>
            <p>
                Cel mai recent dezvoltat instrument este o aplicație de digitizare (DigiApp) care înglobează majoritatea instrumentelor folosite în procesul de digitizare, precum, motoare și module de prelucrare a imaginilor, modele de recunoaștere optică a caracterelor (modele OCR), dicționare folosite la recunoaștere, aplicație de transliterare din chirilică în latină și viceversa, dicționare de excepții folosite la corectarea textului transliterat. Aceste instrumente pot fi accesate din pagina "Instrumente și Resurse".
            </p>
            <p>
                Pentru a digitiza un document, accesați "Aplicație de digitizare" din menu-ul de mai sus.
            </p>

            <p>
                Apasă pe imaginea de mai jos pentru a o mări.
            </p>
            <div className="oldPages" >
                <a
                    className=""
                    data-fancybox="Platformă de digitizare"
                    data-src={"https://s3.eu-west-2.amazonaws.com/emoldova.bucket/platforma-digi/2023-08-25/old_pages.svg"}
                >
                    <img width={650}
                        className="logo-image"
                        src={"https://s3.eu-west-2.amazonaws.com/emoldova.bucket/platforma-digi/2023-08-25/old_pages.svg"}
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