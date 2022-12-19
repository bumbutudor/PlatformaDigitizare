import React from "react";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import RangeSlider from "react-bootstrap-range-slider";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";


const FineReaderPreprocessor = (props) => {

    // Preprocesare cu FineReader

    const [preprocessFR, setPreprocessFR] = React.useState(
        props.getStore().preprocessFR
    );

    const handlePreprocessFRChange = (e) => {
        setPreprocessFR({ ...preprocessFR, [e.target.name]: e.target.checked });
        props.updateStore({
            preprocessFR: { ...preprocessFR, [e.target.name]: e.target.checked },
        });
    };

    return (
        console.log(props.getStore()),
        <>
            <Form.Group>
                <Form.Label>
                    2.2 Opțiuni de preprocesare cu FineReader recomandate:
                </Form.Label>
            </Form.Group>
            <Form.Group>
                <Form.Check
                    label="Corectează rezoluția imaginii"
                    name="correctResolution"
                    id="checkboxFR1"
                    type="checkbox"
                    checked={preprocessFR.correctResolution}
                    onChange={handlePreprocessFRChange}
                />
                <Form.Check
                    label="Corectează orientarea paginii"
                    name="correctPageOrientation"
                    id="checkboxFR2"
                    type="checkbox"
                    checked={preprocessFR.correctPageOrientation}
                    onChange={handlePreprocessFRChange}
                />
                <Form.Check
                    label="Convertește imaginea în alb-negru"
                    name="convertToBlackAndWhite"
                    id="checkboxF3"
                    type="checkbox"
                    checked={preprocessFR.convertToBlackAndWhite}
                    onChange={handlePreprocessFRChange}
                />
                <Form.Check
                    label="Reduce zgomotul ISO din imagine"
                    name="reduceNoise"
                    id="checkboxFR4"
                    type="checkbox"
                    checked={preprocessFR.reduceNoise}
                    onChange={handlePreprocessFRChange}
                />
                <Form.Check
                    label="Îndreaptă rândurile de text"
                    name="straightenTextLines"
                    id="checkboxFR5"
                    type="checkbox"
                    checked={preprocessFR.straightenTextLines}
                    onChange={handlePreprocessFRChange}
                />
                <Form.Check
                    label="Taie imaginea în pagini"
                    name="divideIntoPages"
                    id="checkboxFR6"
                    type="checkbox"
                    checked={preprocessFR.divideIntoPages}
                    onChange={handlePreprocessFRChange}
                />
            </Form.Group>
        </>
    );

}

export default FineReaderPreprocessor;