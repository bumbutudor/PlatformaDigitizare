import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";

const DictionaryModal = (props) => {
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
                                    <Button variant="outline-secondary" id="button-addon2">
                                        Adaugă
                                    </Button>
                                </InputGroup>
                            </Form.Group>
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