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


const ScanTailor = (props) => {
    const [uploadFolder, setUploadFolder] = React.useState(props.getStore().uploadFolder);
    const [selectedColorMode, setSelectedColorMode] = React.useState(
        props.getStore().preprocessScanTailor.colorMode
    );

    const [selectedDespeckleOption, setSelectedDespeckleOption] = React.useState(
        props.getStore().preprocessScanTailor.despeckle
    );

    const [orientation, setOrientation] = React.useState(
        props.getStore().preprocessScanTailor.orientation
    );

    const [selectedContentDetectionMode, setSelectedContentDetectionMode] = React.useState(
        props.getStore().preprocessScanTailor.contentDetection
    );

    const [tab, setTab] = React.useState(props.getStore().preprocessMode);

    const [resolution, setResolution] = React.useState(
        props.getStore().preprocessScanTailor.resolution
    );

    const [threshold, setThreshold] = React.useState(
        props.getStore().preprocessScanTailor.threshold
    );

    const [whiteMargins, setWhiteMargins] = React.useState(
        props.getStore().preprocessScanTailor.whiteMargins
    );

    const [normalizeIllumination, setNormalizeIllumination] = React.useState(
        props.getStore().preprocessScanTailor.normalizeIllumination
    );

    const handleTabChange = (event) => {
        setTab(event);
        props.updateStore({ preprocessMode: event });
    }

    const handleColorModeChange = (e) => {
        setSelectedColorMode(e.target.value);
        props.updateStore({
            preprocessScanTailor: {
                ...props.getStore().preprocessScanTailor,
                colorMode: e.target.value
            }
        });
    };


    const handleContentDetectionModeChange = (e) => {
        setSelectedContentDetectionMode(e.target.value);
        props.updateStore({
            preprocessScanTailor: {
                ...props.getStore().preprocessScanTailor,
                contentDetection: e.target.value
            }
        });
    };

    const handleDespeckleOptionChange = (e) => {
        setSelectedDespeckleOption(e.target.value);
        props.updateStore({
            preprocessScanTailor: {
                ...props.getStore().preprocessScanTailor,
                despeckle: e.target.value
            }
        });
    };

    const handleOrientationChange = (e) => {
        setOrientation(e.target.value);
        props.updateStore({
            preprocessScanTailor: {
                ...props.getStore().preprocessScanTailor,
                orientation: e.target.value
            }
        });
    };

    const handleResolutionChange = (e) => {
        setResolution(e.target.value);
        props.updateStore({
            preprocessScanTailor: {
                ...props.getStore().preprocessScanTailor,
                resolution: e.target.value,
            },
        });
    };

    const handleThresholdChange = (e) => {
        setThreshold(e.target.value);
        props.updateStore({
            preprocessScanTailor: {
                ...props.getStore().preprocessScanTailor,
                threshold: e.target.value,
            },
        });
    };

    const handleWhiteMargins = (e) => {
        setWhiteMargins(e.target.checked);
        props.updateStore({
            preprocessScanTailor: {
                ...props.getStore().preprocessScanTailor,
                whiteMargins: e.target.checked,
            },
        });
    };


    const handleNormalizeIllumination = (e) => {
        setNormalizeIllumination(e.target.checked);
        props.updateStore({
            preprocessScanTailor: {
                ...props.getStore().preprocessScanTailor,
                normalizeIllumination: e.target.checked,
            },
        });
    };

    const handleOpenScanTailorRequest = async () => {

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
                    2.2 Opțiuni de preprocesare cu ScanTailor recomandate:
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
                            Preprocesare cu ScanTailor este disponibilă doar în versiunea Desktop a platformei. <br></br>
                            Urmează pașii de mai jos pentru a continua.
                        </Form.Label>
                        <ListGroup as="ol" numbered>
                            <ListGroup.Item as="li">Click pe butonul Deschide ScanTailor de mai jos.
                                <em className="text-secondary mx-2">Înainte de a deschide aplicația citește toți pașii!</em>
                            </ListGroup.Item>
                            <ListGroup.Item as="li">Din fereastra ScanTailor, alege <code>New Project...</code> </ListGroup.Item>
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
                        onClick={handleOpenScanTailorRequest}>
                        Deschide ScanTailor
                    </Button>
                </Tab>

                {/* web functionalities */}
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
                                // className="form-check-inline"
                                label="Alb-negru"
                                name="colorMode"
                                type="radio"
                                id="black_and_white"
                                value="black_and_white"
                                checked={selectedColorMode === "black_and_white"}
                                onChange={handleColorModeChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Grayscale"
                                name="colorMode"
                                type="radio"
                                id="color_grayscale"
                                value="color_grayscale"
                                checked={selectedColorMode === "color_grayscale"}
                                onChange={handleColorModeChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
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
                    <Form.Group as={Row} className="mb-4">
                        <Col>
                            <Form.Label>Selectează opțiunea de reducere a zgomotului din imagine:</Form.Label>
                            <Form.Check
                                // className="form-check-inline"
                                label="Off"
                                name="despeckle"
                                type="radio"
                                id="off"
                                value="off"
                                checked={selectedDespeckleOption === "off"}
                                onChange={handleDespeckleOptionChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Cautious"
                                name="despeckle"
                                type="radio"
                                id="cautious"
                                value="cautious"
                                checked={selectedDespeckleOption === "cautious"}
                                onChange={handleDespeckleOptionChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Normal"
                                name="despeckle"
                                type="radio"
                                id="normal"
                                value="normal"
                                checked={selectedDespeckleOption === "normal"}
                                onChange={handleDespeckleOptionChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Aggressive"
                                name="despeckle"
                                type="radio"
                                id="aggressive"
                                value="aggressive"
                                checked={selectedDespeckleOption === "aggressive"}
                                onChange={handleDespeckleOptionChange}
                            />
                        </Col>
                    </Form.Group>
                    {/* orientation default is portrait <left|right|upsidedown|none> */}
                    <Form.Group as={Row} className="mb-4">
                        <Col>
                            <Form.Label>Schimbă orientarea:</Form.Label>
                            <Form.Check
                                // className="form-check-inline"
                                label="Păstează orientarea originală"
                                name="orientation"
                                type="radio"
                                id="none"
                                value="none"
                                checked={orientation === "none"}
                                onChange={handleOrientationChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Spre stânga"
                                name="orientation"
                                type="radio"
                                id="left"
                                value="left"
                                checked={orientation === "left"}
                                onChange={handleOrientationChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Spre dreapta"
                                name="orientation"
                                type="radio"
                                id="right"
                                value="right"
                                checked={orientation === "right"}
                                onChange={handleOrientationChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Inversat (upside down)"
                                name="orientation"
                                type="radio"
                                id="upsidedown"
                                value="upsidedown"
                                checked={orientation === "upsidedown"}
                                onChange={handleOrientationChange}
                            />
                        </Col>
                    </Form.Group>

                    {/* contentDetection default is normal <cautious|normal|aggressive> */}
                    <Form.Group as={Row} className="mb-4">
                        <Col>
                            <Form.Label>Selectează modul de detectare a continutului din imagine: </Form.Label>
                            <Form.Check
                                // className="form-check-inline"
                                label="Precaut (mai puțin de 3%)"
                                name="contentDetection"
                                type="radio"
                                id="cautious"
                                value="cautious"
                                checked={selectedContentDetectionMode === "cautious"}
                                onChange={handleContentDetectionModeChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Normal (recomandat)"
                                name="contentDetection"
                                type="radio"
                                id="normal"
                                value="normal"
                                checked={selectedContentDetectionMode === "normal"}
                                onChange={handleContentDetectionModeChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Agresiv"
                                name="contentDetection"
                                type="radio"
                                id="aggressive"
                                value="aggressive"
                                checked={selectedContentDetectionMode === "aggressive"}
                                onChange={handleContentDetectionModeChange}
                            />
                        </Col>
                    </Form.Group>
                    {/* whiteMargins default is false */}
                    <Form.Group as={Row} className="mb-3">
                        <Col>
                            <Form.Check
                                label="Adaugă margini albe"
                                name="whiteMargins"
                                id="white_margins"
                                type="checkbox"
                                checked={whiteMargins}
                                onChange={handleWhiteMargins}
                            />
                        </Col>
                    </Form.Group>
                    {/* normalizeIllumination default: false */}
                    <Form.Group as={Row} className="mb-3">
                        <Col>
                            <Form.Check
                                label="Corectează iluminarea din imagine"
                                name="normalizeIllumination"
                                id="normalize_illumination"
                                type="checkbox"
                                checked={normalizeIllumination}
                                onChange={handleNormalizeIllumination}
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="mb-4">
                        <Form.Label className="mb-4">
                            Schimbă grosimea caracterelor:
                        </Form.Label>
                        <Col xs="9">
                            <RangeSlider
                                value={threshold}
                                tooltipLabel={(threshold) => threshold}
                                onChange={handleThresholdChange}
                                tooltipPlacement='top'
                                min={-100}
                                max={100}
                                step={1}
                            />
                        </Col>
                        <Col xs="3">
                            <Form.Control value={threshold} onChange={handleThresholdChange} />
                        </Col>
                    </Form.Group>


                </Tab>
            </Tabs >
        </>
    );
}

export default ScanTailor;