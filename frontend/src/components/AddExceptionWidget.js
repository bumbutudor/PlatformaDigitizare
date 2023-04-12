import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import FetchWrapper from "./FetchWrapper";
import Alert from 'react-bootstrap/Alert';
import { mapPeriod } from "../utils/Utills";
import Form from 'react-bootstrap/Form';

const ExceptionWidget = (props) => {
    const [exceptions, setExceptions] = useState([]);
    const [exception, setException] = useState("");
    const [correctWord, setCorrectWord] = useState("");
    const [period, setPeriod] = useState([5]);
    const [addedBy, setAddedBy] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const API = new FetchWrapper('https://uuj2kn6s.ngrok.app/');

    const handleAddException = async (event) => {
        setLoading(true);
        event.preventDefault();
        const dictionaryEndpoint = 'api/exception-dictionary/';
        const data = {
            "exception": exception,
            "correct_word": correctWord,
            "period": period,
            "alphabet": [1],
            "added_by": addedBy,
            "exception_dictionary": 1,

        }
        console.log(data);
        API.post(dictionaryEndpoint, data).then((data) => {
            setException("");
            setCorrectWord("");
            setPeriod([5]);
            setAddedBy("");
            props.onGetDictionary();
            setLoading(false);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
            }, 2000);

        }).catch((error) => {
            console.log(error);
        });


    }
    // close the success alert after 3 seconds

    console.log(period);

    return (
        <div>
            <div className="row">
                <div className="col-12">
                    <h3>Adaugă excepție</h3>
                    <form onSubmit={handleAddException}>
                        <div className="form-group">
                            <label htmlFor="exception">Excepție</label>
                            <input type="text" className="form-control" id="exception" placeholder="Excepție" value={exception} onChange={(e) => setException(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="correctWord">Cuvânt corect</label>
                            <input type="text" className="form-control" id="correctWord" placeholder="Cuvânt corect" value={correctWord} onChange={(e) => setCorrectWord(e.target.value)} />
                        </div>

                        {/* multiple selections from period */}
                        <Form.Group>
                            <Form.Label>Perioada</Form.Label>
                            <Form.Control
                                as="select"
                                multiple
                                value={period}
                                onChange={e => setPeriod([].slice.call(e.target.selectedOptions).map(item => item.value))}>
                                <option value="5">secolulXX</option>
                                <option value="4">secolulXIX</option>
                                <option value="3">secolulXVIII</option>
                                <option value="2">secolulXVII</option>

                            </Form.Control>
                        </Form.Group>


                        <div className="form-group">
                            <label htmlFor="addedBy">Adăugat de</label>
                            <input type="text" className="form-control" id="addedBy" placeholder="Adăugat de" value={addedBy} onChange={(e) => setAddedBy(e.target.value)} />
                        </div>

                        <div className="row">
                            <div className="col text-center p-2">
                                <button type="submit" className="btn btn-success btn-sm" disabled={loading}>{loading ? "Se adaugă..." : "Adaugă excepția"}</button>
                            </div>
                        </div>

                        <Alert show={showSuccess} variant="success" onClose={() => setShowSuccess(false)} dismissible>
                            <Alert.Heading>Excepție adăugată cu succes!</Alert.Heading>
                            <p>
                                Mulțumim pentru contribuție!
                            </p>
                        </Alert>
                    </form>
                </div>
            </div >
        </div >
    );

}

export default ExceptionWidget;
