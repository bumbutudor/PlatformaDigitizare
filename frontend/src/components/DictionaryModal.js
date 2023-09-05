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
import AddExceptionWidget from './AddExceptionWidget';
import ExceptionListWidget from './ExceptionListWidget';

const DictionaryModal = (props) => {
    const [exceptions, setExceptions] = useState([]);
    const [exception, setException] = useState("");
    const [correctWord, setCorrectWord] = useState("");
    const [period, setPeriod] = useState(props.period);
    const [addedBy, setAddedBy] = useState("anonim");
    const [loading, setLoading] = useState(false);



    const API = new FetchWrapper('https://uuj2kn6s.ngrok.app/');
    const handleGetDictionary = async () => {
        // const proxy = "https://cors-anywhere.herokuapp.com/";
        const dictionaryEndpoint = 'exception-dictionary/';
        API.post(dictionaryEndpoint, {}).then(data => {
            setExceptions(data.entries);
            // console.log(data.entries);
        })

    }

    // remove exception from the dictionary By name of the exception
    const handleRemoveExceptionById = async (id) => {
        const response = await fetch('https://uuj2kn6s.ngrok.app/api/exception-dictionary/' + id + '/', {
            method: 'DELETE',
            body: JSON.stringify({
                id: id
            }),
        });

        if (response.ok) {
            handleGetDictionary();
        }


    }





    useEffect(() => {
        handleGetDictionary();
    }, []);
    // handleGetDictionary();

    return (

        <Modal scrollable={false} size='lg' {...props} aria-labelledby="contained-modal-title-vcenter">
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Dictionarul de excepții
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="show-grid">

                <Row>
                    <div className=" py-1 px-2">

                        {props.about}
                    </div>
                    <Col xs={12} md={6} className="text-center bg-light rounded">


                        <div className='bg-light p-2'>Tabelul de excepții</div>
                        <div className='table-fixed'>
                            <ExceptionListWidget exceptions={exceptions} onRemove={handleRemoveExceptionById} period={period} />

                        </div>

                    </Col>
                    <Col xs={12} md={4}>
                        <div className='border rounded py-1 px-2 bg-light'>
                            <AddExceptionWidget period={props.period} api={props.api} onGetDictionary={handleGetDictionary} />
                        </div>
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