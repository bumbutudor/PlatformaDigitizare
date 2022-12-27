import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Modal from "react-bootstrap/Modal";
import FetchWrapper from "./FetchWrapper";
import Alert from 'react-bootstrap/Alert';
import { mapPeriod } from "../utils/Utills";

const ExceptionWidget = (props) => {
    const [exceptions, setExceptions] = useState([]);
    const [exception, setException] = useState("");
    const [correctWord, setCorrectWord] = useState("");
    const [period, setPeriod] = useState(mapPeriod(props.period));
    const [addedBy, setAddedBy] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const API = new FetchWrapper('https://a1ef-81-180-76-251.eu.ngrok.io/');

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
        console.log(data);
        API.post(dictionaryEndpoint, data).then((data) => {
            setException("");
            setCorrectWord("");
            setPeriod(mapPeriod(props.period));
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
                        <div className="form-group">
                            <label htmlFor="period">Perioadă</label>
                            <select className="form-control" id="period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                                <option value="1">Secolul XX</option>
                                <option value="2">Secolul XIX</option>
                                <option value="3">Secolul XVIII</option>
                                <option value="4">Secolul XVII</option>
                            </select>
                        </div>
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
