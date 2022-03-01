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


const ScanTaylor = (props) => {
    const [uploadFolder, setUploadFolder] = React.useState(props.getStore().uploadFolder);
    const [selectedColorMode, setSelectedColorMode] = React.useState(
        props.getStore().preprocessScanTaylor.colorMode
    );

    const [tab, setTab] = React.useState(props.getStore().preprocessMode);

    const [resolution, setResolution] = React.useState(
        props.getStore().preprocessScanTaylor.resolution
    );

    const handleTabChange = (event) => {
        setTab(event);
        props.updateStore({ preprocessMode: event });
    }

    const handleColorModeChange = (e) => {
        setSelectedColorMode(e.target.value);
        props.updateStore({
            preprocessScanTaylor: {
                ...props.getStore().preprocessScanTaylor,
                colorMode: e.target.value
            }
        });
    };

    const handleResolutionChange = (e) => {
        setResolution(e.target.value);
        props.updateStore({
            preprocessScanTaylor: {
                ...props.getStore().preprocessScanTaylor,
                resolution: e.target.value,
            },
        });
    };

    const handleOpenScanTaylorRequest = async () => {

        const preprocessAPI = "http://127.0.0.1:8000/preprocess/";
        const requestOptions = {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(props.getStore()),
        };
        const response = await fetch(preprocessAPI, requestOptions);
        const data = await response.json();
        console.log(data);
        if (data.uploadFolder) {
            setUploadFolder(data.uploadFolder);
            // props.updateStore({ preprocessedFiles: data.preprocessedFiles });
        }

    };



    return (
        console.log(props.getStore()),
        <>
            <Form.Group>
                <Form.Label>
                    2.2 Opțiuni de preprocesare cu ScanTaylor recomandate:
                </Form.Label>
            </Form.Group>
            <Tabs
                id="controlled-tab-example"
                activeKey={tab}
                onSelect={handleTabChange}
                className="mb-3"
            >
                <Tab eventKey="desktop" title="Desktop">
                    <Form.Group>
                        <Form.Label className="bg-warning p-2">
                            Preprocesare cu ScanTaylor este disponibilă doar în versiunea Desktop a platformei. <br></br>
                            Urmează pașii de mai jos pentru a continua.
                        </Form.Label>
                        <ListGroup as="ol" numbered>
                            <ListGroup.Item as="li">Click pe butonul Deschide ScanTaylor de mai jos.
                                <em className="text-secondary mx-2">Înainte de a deschide aplicația citește toți pașii!</em>
                            </ListGroup.Item>
                            <ListGroup.Item as="li">Din fereastra ScanTaylor, alege <code>New Project...</code> </ListGroup.Item>
                            <ListGroup.Item as="li">Copie și lipește <samp className="bg-warning">{props.getStore().uploadFolder}</samp> în <code>Input Directory</code> </ListGroup.Item>
                            <ListGroup.Item as="li">Apasă pe <code>Select All</code> &nbsp;&nbsp;&nbsp; din
                                <code>Files Not In Project</code>&nbsp;&nbsp;&nbsp;&nbsp; click pe <code>&#62;&#62;</code>&nbsp;&nbsp;&nbsp;&nbsp; și butonul <code>OK</code>
                            </ListGroup.Item>
                            <ListGroup.Item as="li">Din fereastra Fix DPI, selectează <code>All Pages</code>&nbsp;&nbsp;&nbsp;
                                după care setează valorile <code>DPI (se recomandă 600*600 dpi)</code>
                            </ListGroup.Item>
                            <ListGroup.Item as="li">Este recomandat să treci prin următorii pași de preprocesare:
                                Fix Orientation, Deskew, Select Conntent pană a ajunge la pasul Output
                            </ListGroup.Item>
                        </ListGroup>
                    </Form.Group>
                    <Button
                        className="btn btn-secondary mx-2"
                        onClick={handleOpenScanTaylorRequest}>
                        Deschide ScanTaylor
                    </Button>
                </Tab>
                <Tab eventKey="web" title="Web">
                    <Form.Group as={Row} className="mb-4">
                        <Form.Label className="mb-4">
                            Setează rezoluția imaginii preprocesate:
                        </Form.Label>
                        <Col xs="9">
                            <RangeSlider
                                value={resolution}
                                tooltipLabel={(resolution) =>
                                    `${resolution} dpi`
                                }
                                onChange={handleResolutionChange}
                                tooltipPlacement='top'
                                min={75}
                                max={1200}
                                step={25}
                            />
                        </Col>
                        <Col xs="3">
                            <Form.Control value={resolution} onChange={handleResolutionChange} />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="mb-4">
                        <Col>
                            <Form.Label>Setează culoarea imaginii preprocesate:</Form.Label>
                            <Form.Check
                                className="form-check-inline"
                                label="Alb-negru"
                                name="colorMode"
                                type="radio"
                                id="black_and_white"
                                value="black_and_white"
                                checked={selectedColorMode === "black_and_white"}
                                onChange={handleColorModeChange}
                            />
                            <Form.Check
                                className="form-check-inline"
                                label="Grayscale"
                                name="colorMode"
                                type="radio"
                                id="color_grayscale"
                                value="color_grayscale"
                                checked={selectedColorMode === "color_grayscale"}
                                onChange={handleColorModeChange}
                            />
                            <Form.Check
                                className="form-check-inline"
                                label="Mixed"
                                name="colorMode"
                                type="radio"
                                id="mixed"
                                value="mixed"
                                checked={selectedColorMode === "mixed"}
                                onChange={handleColorModeChange}
                            />
                        </Col>
                    </Form.Group>
                </Tab>
            </Tabs >
        </>
    );
}

export default ScanTaylor;