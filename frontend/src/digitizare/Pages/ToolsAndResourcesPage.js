
import React from 'react';
import DictionaryModal from '../../components/DictionaryModal';


const ToolsAndResourcesPage = (props) => {

    const [modalShow, setModalShow] = React.useState(false);
    return (
        <div className="tab-content-body">
            <p>
                Instrumentele și resursele informaționale sunt in proces de dezvoltare și vor fi disponibile în curând.
                Vă rugăm să reveniți mai târziu.
            </p>
            <ul>
                <li>
                    <a href="#aplicatie" onClick={() => setModalShow(true)}>Dicționar de excepții</a>
                </li>
            </ul>
            <DictionaryModal about={''} period={'secolulXX'} api={"sf"} fullscreen={true} show={modalShow} onHide={() => setModalShow(false)} />
        </div>
    );
}

export default ToolsAndResourcesPage;