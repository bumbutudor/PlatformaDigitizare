import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Spinner from 'react-bootstrap/esm/Spinner';
import Table from 'react-bootstrap/Table';
import FetchWrapper from './FetchWrapper';

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
    const [exceptions, setExceptions] = useState([]);
    const [exception, setException] = useState("");
    const [correctWord, setCorrectWord] = useState("");
    const [period, setPeriod] = useState(mapPerid(props.period));
    const [addedBy, setAddedBy] = useState("anonim");
    const [loading, setLoading] = useState(false);



    const API = new FetchWrapper('https://a1ef-81-180-76-251.eu.ngrok.io/');
    const handleGetDictionary = async () => {
        // const proxy = "https://cors-anywhere.herokuapp.com/";
        const dictionaryEndpoint = 'exception-dictionary/';
        API.post(dictionaryEndpoint, {}).then(data => {
            setExceptions(data.entries);
        })

    }


    const handleAddException = async (event) => {
        setLoading(true);
        event.preventDefault();
        const dictionaryEndpoint = 'api/exception-dictionary/';
        const data = {
            "exception": exception,
            "correct_word": correctWord,
            "period": period,
            "added_by": addedBy,
        }

        API.post(dictionaryEndpoint, data).then((data) => {
            // console.log(data);
            // clear the form
            setException("");
            setCorrectWord("");
            handleGetDictionary();
            setLoading(false);

        }).catch((error) => {
            console.log(error);
        });
    }

    useEffect(() => {
        handleGetDictionary();
    }, []);
    // handleGetDictionary();

    return (

        <Modal scrollable={false} size='lg' {...props} aria-labelledby="contained-modal-title-vcenter">
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Dictionarul de exceptii
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="show-grid">

                <Row>
                    <div className=" py-1 px-2">

                        {props.about}
                    </div>
                    <Col xs={12} md={4} className="text-center bg-light rounded">


                        <div className='bg-light p-2'>Tabelul de excepții</div>
                        <div className='table-fixed'>
                            <Table bordered hover size="sm" className='table-success'>
                                <thead>
                                    <tr>
                                        <th>Varianta greșită</th>
                                        <th>Varianta corectă</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        exceptions.map((item, index) => {
                                            // filter by period
                                            if (item.period !== period) {
                                                return null;
                                            }

                                            return (
                                                <tr key={index}>
                                                    <td>{item.exception}</td>
                                                    <td>{item.correct_word}</td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </Table>
                        </div>

                    </Col>
                    <Col xs={12} md={8}>
                        <Form className='border rounded py-1 px-2 bg-light'>
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
                            <Row>
                                <Col xs={12} md={6}> <Form.Group className="mb-3" controlId="formBasicCheckbox">

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
                                    <Form.Check
                                        type="checkbox"
                                        label=" XVIII"
                                        value='3'
                                        checked={period === '3'}
                                        onChange={(event) => setPeriod(event.target.value)}
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        label=" XVII"
                                        value='4'
                                        checked={period === '4'}
                                        onChange={(event) => setPeriod(event.target.value)}
                                    />
                                </Form.Group>

                                </Col>
                                <Col xs={12} md={6}>
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

                                </Col>
                            </Row>

                            {loading && <Spinner animation="border" role="status">
                                <span className="visually-hidden">Se adaugă excepția...</span>
                            </Spinner>}
                            {!loading && <Button variant="primary" type="submit" onClick={handleAddException}>
                                Adaugă
                            </Button>}
                        </Form>
                    </Col>
                </Row>


            </Modal.Body>
            <Modal.Footer>
                <Button onClick={props.onHide}>Închide dicționarul</Button>
            </Modal.Footer>
        </Modal >
    );
}
export default DictionaryModal;