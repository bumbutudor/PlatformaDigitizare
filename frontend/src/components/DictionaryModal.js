import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";



const DictionaryModal = (props) => {
    const [exceptionsDict, setExceptionDict] = useState([]);

    const handleGetDictionary = () => {
        const dictionaryEndpoint = 'api/exception-dictionary/';
        props.api.get(dictionaryEndpoint).then((data) => {
            setExceptionDict(data);
        }).catch((error) => {
            console.log(error);
        });
    }



    return (
        <Modal size='lg' fullscreen={false} {...props} aria-labelledby="contained-modal-title-vcenter">
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Dictionarul de exceptii
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="show-grid">

                <Row>
                    <Col xs={12} md={4}>
                        Lista de exceptii
                        <Button onClick={handleGetDictionary}>Get dictionary</Button>
                        {
                            exceptionsDict.map((item) => {
                                return (
                                    <div>
                                        <p>{item.exception}</p>
                                        <p>{item.correct_word}</p>
                                    </div>
                                )
                            })
                        }

                    </Col>
                    <Col xs={12} md={8}>
                        <Form>
                            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                                <Form.Label>Adaugă o excepție nouă</Form.Label>
                                <InputGroup className="mb-3">
                                    {/* <InputGroup.Text>Varianta gresita si corectă</InputGroup.Text> */}
                                    <Form.Control
                                        placeholder="Varianta gresita"
                                        aria-label="Varianta gresita"
                                        aria-describedby=""
                                    />
                                    <Form.Control
                                        placeholder="Varianta corecta"
                                        aria-label="Varianta corecta"
                                        aria-describedby=""
                                    />
                                </InputGroup>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>Autor</Form.Label>
                                <Form.Control type="email" placeholder="Enter email" />
                                <Form.Text className="text-muted">
                                    In mod implicit autorul este anonim.
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicCheckbox">

                                <Form.Label>Secolul</Form.Label>
                                <Form.Check type="checkbox" label=" XX" />
                                <Form.Check type="checkbox" label=" XIX" />
                                <Form.Check inline type="checkbox" label=" XVIII" />
                                <Form.Check inline type="checkbox" label=" XVII" />
                            </Form.Group>
                            <Button variant="primary" type="submit">
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