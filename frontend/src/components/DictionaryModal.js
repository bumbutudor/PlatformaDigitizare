import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

const mapPerid = (period) => {
    switch (period) {
        case "secolulXX":
            return "1";
        case "secolulXIX":
            return "2";
        case "secolulXVIII":
            return "3";
        case "secolulXVII":
            return "4";
    }
}

const DictionaryModal = (props) => {
    const [exceptionsDict, setExceptionDict] = useState([]);
    const [exception, setException] = useState("");
    const [correctWord, setCorrectWord] = useState("");
    const [period, setPeriod] = useState(mapPerid(props.period));
    const [addedBy, setAddedBy] = useState("anonim");



    const handleGetDictionary = () => {
        const dictionaryEndpoint = 'exception-dictionary/';
        props.api.post(dictionaryEndpoint, { "crsf": "XXX" }).then((data) => {
            setExceptionDict(data.entries);
            // console.log(data);
        }).catch((error) => {
            console.log(error);
        });
    }


    const handleAddException = (event) => {
        event.preventDefault();
        const dictionaryEndpoint = 'api/exception-dictionary/';
        const data = {
            "exception": exception,
            "correct_word": correctWord,
            "period": period,
            "added_by": addedBy,
        }

        props.api.post(dictionaryEndpoint, data).then((data) => {
            console.log(data);
            handleGetDictionary();
        }).catch((error) => {
            console.log(error);
        });
    }

    useEffect(() => {
        handleGetDictionary();
    }, []);
    // handleGetDictionary();

    return (

        <Modal size='lg' fullscreen={false} {...props} aria-labelledby="contained-modal-title-vcenter">
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Dictionarul de exceptii
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="show-grid">

                <Row>
                    <Col xs={12} md={4} className="border rounded p-2 bg-light h-50">
                        Lista de exceptii

                        <ul className='h-50'>
                            {
                                exceptionsDict.map((item, index) => {
                                    return (
                                        <li key={index}>{`${item.exception} => ${item.correct_word}`}</li>
                                    )
                                })
                            }
                        </ul>

                    </Col>
                    <Col xs={12} md={8}>
                        <Form className='border rounded p-2 bg-light'>
                            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                                <Form.Label>Adaugă o excepție nouă</Form.Label>
                                <InputGroup className="mb-3">
                                    {/* <InputGroup.Text>Varianta gresita si corectă</InputGroup.Text> */}
                                    <Form.Control
                                        placeholder="Varianta gresita"
                                        aria-label="Varianta gresita"
                                        aria-describedby=""
                                        value={exception}
                                        onChange={(event) => setException(event.target.value)}
                                    />
                                    <Form.Control
                                        placeholder="Varianta corecta"
                                        aria-label="Varianta corecta"
                                        aria-describedby=""
                                        value={correctWord}
                                        onChange={(event) => setCorrectWord(event.target.value)}
                                    />
                                </InputGroup>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>Autor</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="cine adauga exceptia"
                                    value={addedBy}
                                    onChange={(event) => setAddedBy(event.target.value)}
                                />
                                <Form.Text className="text-muted">
                                    In mod implicit autorul este anonim.
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicCheckbox">

                                <Form.Label>Secolul</Form.Label>
                                <Form.Check
                                    type="checkbox"
                                    label=" XX"
                                    id='period'
                                    value='1'
                                    checked={period === '1'}
                                    onChange={(event) => setPeriod(event.target.value)}
                                />
                                <Form.Check
                                    type="checkbox"
                                    label=" XIX"
                                    value='2'
                                    checked={period === '2'}
                                    onChange={(event) => setPeriod(event.target.value)}
                                />
                                <Form.Check inline
                                    type="checkbox"
                                    label=" XVIII"
                                    value='3'
                                    checked={period === '3'}
                                    onChange={(event) => setPeriod(event.target.value)}
                                />
                                <Form.Check inline
                                    type="checkbox"
                                    label=" XVII"
                                    value='4'
                                    checked={period === '4'}
                                    onChange={(event) => setPeriod(event.target.value)}
                                />
                            </Form.Group>
                            <Button variant="primary" type="submit" onClick={handleAddException}>
                                Adaugă
                            </Button>
                        </Form>
                    </Col>
                </Row>


            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Închide dicționarul</Button>
            </Modal.Footer>
        </Modal>
    );
}
export default DictionaryModal;