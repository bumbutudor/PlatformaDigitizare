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
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Tooltip from "react-bootstrap/Tooltip";
import { Player } from 'video-react';
// import ScanTailorTutorial from '../assets/ScanTailorTutorial.mp4'


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

    // const handleOpenScanTailorRequest = async () => {

    //     const preprocessAPI = "http://127.0.0.1:8000/preprocess/";
    //     const requestOptions = {
    //         method: "POST",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify(props.getStore()),
    //     };
    //     const response = await fetch(preprocessAPI, requestOptions);
    //     const data = await response.json();
    //     console.log(data);
    //     if (data.uploadFolder) {
    //         setUploadFolder(data.uploadFolder);
    //         // props.updateStore({ preprocessedFiles: data.preprocessedFiles });
    //     }

    // };

    const desktopModeInfo = (
        <Popover id="popover-basic">
            <Popover.Body>
                <ListGroup as="ol" numbered>
                    <ListGroup.Item>
                        <Player>
                            <source src="http://127.0.0.1:8000/media/pre/ScanTailor/tutorial.mp4" />
                        </Player>
                    </ListGroup.Item>
                    <ListGroup.Item as="li">Apas?? butonul <code>Start preprocesare</code>&nbsp;&nbsp;&nbsp;&nbsp; de mai jos pentru a deschide aplica??ia ScanTailor ??n calculatorul t??u.
                        <em className="text-secondary mx-2">??nainte de a ap??sa butonul, cite??te to??i pa??ii!</em>
                    </ListGroup.Item>
                    <ListGroup.Item as="li">Verific?? dac?? s-a deschis aplica??ia ScanTailor din calculator. </ListGroup.Item>
                    <ListGroup.Item as="li">Din fereastra ScanTailor, alege <code>New Project...</code> </ListGroup.Item>
                    <ListGroup.Item as="li">Copie ??i lipe??te <samp className="bg-warning">{props.getStore().uploadFolder}</samp> ??n <code>Input Directory</code> </ListGroup.Item>
                    <ListGroup.Item as="li">Apas?? pe <code>Select All</code> &nbsp;&nbsp;&nbsp; din
                        <code>Files Not In Project</code>&nbsp;&nbsp;&nbsp;&nbsp; click pe <code>&#62;&#62;</code>&nbsp;&nbsp;&nbsp;&nbsp; ??i butonul <code>OK</code>
                    </ListGroup.Item>
                    <ListGroup.Item as="li">Din fereastra Fix DPI, selecteaz?? <code>All Pages</code>&nbsp;&nbsp;&nbsp;
                        dup?? care seteaz?? valorile <code>DPI (se recomand?? 600*600 dpi)</code>
                    </ListGroup.Item>
                    <ListGroup.Item as="li">Este recomandat s?? treci prin urm??torii pa??i de preprocesare:
                        Fix Orientation, Deskew, Select Conntent pan?? a ajunge la pasul Output. ??n dreptul fiec??rui pas, apas?? pe butonul "play".
                    </ListGroup.Item>
                    <ListGroup.Item as="li">??n fereastra Output, apas?? butonul "play" pentru a primi imaginea preprocesat??.
                    </ListGroup.Item>
                    <ListGroup.Item as="li">Dup?? ce ai terminat, ??nchide aplica??ia ScanTailor, f??r?? a salva proiectul (alege "Discard").
                    </ListGroup.Item>
                    <ListGroup.Item as="li">Revino ??napoi la fereastra platformei pentru a continua cu urm??torul pas.
                    </ListGroup.Item>
                </ListGroup>
            </Popover.Body>
        </Popover>
    );

    const [isCopied, setCopied] = React.useState(false);

    const renderTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {isCopied ? "Copiat!" : "Apas?? pentru a copia"}
        </Tooltip>
    );

    return (

        console.log(props.getStore()),
        <>
            <Form.Group>
                <Form.Label>
                    2.2 Op??iuni de preprocesare cu ScanTailor recomandate:
                </Form.Label>
            </Form.Group>
            <Tabs
                id="controlled-tab-example"
                activeKey={tab}
                onSelect={handleTabChange}
            // className="mb-3"
            >
                <Tab eventKey="desktop" title="Desktop">
                    <Form.Group>
                        <Form.Label className=" p-2">
                            Modalitatea de preprocesare Desktop cu ScanTailor este disponibil?? doar ??n versiunea desktop a platformei.
                            <OverlayTrigger trigger="click" rootClose placement="right" overlay={desktopModeInfo}>
                                <Button type="button" className="btn btn-info text-white mx-4">?</Button>
                            </OverlayTrigger>
                        </Form.Label>

                    </Form.Group>
                    <ListGroup as="ol" numbered>
                        <ListGroup.Item as="li">Apas?? butonul <code>Start preprocesare</code>&nbsp;&nbsp;&nbsp;&nbsp; de mai jos pentru a deschide aplica??ia ScanTailor ??n calculatorul t??u.
                            <em className="text-secondary mx-2">??nainte de a ap??sa butonul, cite??te to??i pa??ii!</em>
                        </ListGroup.Item>
                        <ListGroup.Item as="li">Verific?? dac?? s-a deschis aplica??ia ScanTailor din calculator. </ListGroup.Item>
                        <ListGroup.Item as="li">Din fereastra ScanTailor, alege <code>New Project...</code> </ListGroup.Item>
                        <ListGroup.Item as="li">Copie ??i lipe??te
                            <OverlayTrigger
                                placement="left"
                                delay={{ show: 250, hide: 400 }}
                                overlay={renderTooltip}
                            >
                                <CopyToClipboard
                                    text={props.getStore().uploadFolder}
                                    onCopy={() => setCopied(true)}>
                                    <Button variant="secondary mx-2">{props.getStore().uploadFolder}</Button>
                                </CopyToClipboard>
                            </OverlayTrigger> ??n <code>Input Directory</code>
                            {/* {isCopied ? <span className="text-success text-center">Copiat!</span> : <span className="text-warning text-center">Apas?? pentru a copia!</span>} */}
                        </ListGroup.Item>
                        <ListGroup.Item as="li">Apas?? pe <code>Select All</code> &nbsp;&nbsp;&nbsp; din
                            <code>Files Not In Project</code>&nbsp;&nbsp;&nbsp;&nbsp; click pe <code>&#62;&#62;</code>&nbsp;&nbsp;&nbsp;&nbsp; ??i butonul <code>OK</code>
                        </ListGroup.Item>
                        <ListGroup.Item as="li">Din fereastra Fix DPI, selecteaz?? <code>All Pages</code>&nbsp;&nbsp;&nbsp;
                            dup?? care seteaz?? valorile <code>DPI (se recomand?? 600*600 dpi)</code>
                        </ListGroup.Item>
                        <ListGroup.Item as="li">Este recomandat s?? treci prin urm??torii pa??i de preprocesare:
                            Fix Orientation, Deskew, Select Conntent pan?? a ajunge la pasul Output. ??n dreptul fiec??rui pas, apas?? pe butonul "play".
                        </ListGroup.Item>
                        <ListGroup.Item as="li">??n fereastra Output, apas?? butonul "play" pentru a primi imaginea preprocesat??.
                        </ListGroup.Item>
                        <ListGroup.Item as="li">Dup?? ce ai terminat, ??nchide aplica??ia ScanTailor, f??r?? a salva proiectul (alege "Discard").
                        </ListGroup.Item>
                        <ListGroup.Item as="li">Revino ??napoi la fereastra platformei pentru a continua cu urm??torul pas.
                        </ListGroup.Item>
                    </ListGroup>
                    {/* <Button
                        className="btn btn-secondary mx-2"
                        onClick={handleOpenScanTailorRequest}>
                        Deschide ScanTailor
                    </Button> */}
                </Tab>

                {/* web functionalities */}
                <Tab eventKey="web" title="Web">
                    <Form.Group as={Row} className="my-3 mx-2">
                        <Form.Label className="mb-4">
                            Seteaz?? rezolu??ia imaginii preprocesate:
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
                    <Form.Group as={Row} className="my-3 mx-2">
                        <Col>
                            <Form.Label>Seteaz?? culoarea imaginii preprocesate:</Form.Label>
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
                                label="Scara tonurilor de gri (grayscale)"
                                name="colorMode"
                                type="radio"
                                id="color_grayscale"
                                value="color_grayscale"
                                checked={selectedColorMode === "color_grayscale"}
                                onChange={handleColorModeChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Mixt"
                                name="colorMode"
                                type="radio"
                                id="mixed"
                                value="mixed"
                                checked={selectedColorMode === "mixed"}
                                onChange={handleColorModeChange}
                            />
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="my-3 mx-2">
                        <Col>
                            <Form.Label>Selecteaz?? op??iunea de cur????are a petelor din imagine (despeckle):</Form.Label>
                            <Form.Check
                                // className="form-check-inline"
                                label="F??r?? cur????are"
                                name="despeckle"
                                type="radio"
                                id="off"
                                value="off"
                                checked={selectedDespeckleOption === "off"}
                                onChange={handleDespeckleOptionChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Cur????are precaut??"
                                name="despeckle"
                                type="radio"
                                id="cautious"
                                value="cautious"
                                checked={selectedDespeckleOption === "cautious"}
                                onChange={handleDespeckleOptionChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Cur????are normal??"
                                name="despeckle"
                                type="radio"
                                id="normal"
                                value="normal"
                                checked={selectedDespeckleOption === "normal"}
                                onChange={handleDespeckleOptionChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Cur????are agresiv??"
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
                    <Form.Group as={Row} className="my-3 mx-2">
                        <Col>
                            <Form.Label>Corecteaz?? orientarea imaginii:</Form.Label>
                            <Form.Check
                                // className="form-check-inline"
                                label="P??streaz?? orientarea original??"
                                name="orientation"
                                type="radio"
                                id="none"
                                value="none"
                                checked={orientation === "none"}
                                onChange={handleOrientationChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="??ntoarce spre st??nga"
                                name="orientation"
                                type="radio"
                                id="left"
                                value="left"
                                checked={orientation === "left"}
                                onChange={handleOrientationChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="??ntoarce spre dreapta"
                                name="orientation"
                                type="radio"
                                id="right"
                                value="right"
                                checked={orientation === "right"}
                                onChange={handleOrientationChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="??ntoarce cu susul ??n jos (upside down)"
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
                    <Form.Group as={Row} className="my-3 mx-2">
                        <Col>
                            <Form.Label>Selecteaz?? modul de detectare a con??inutului din imagine: </Form.Label>
                            <Form.Check
                                // className="form-check-inline"
                                label="Detectare precatut??"
                                name="contentDetection"
                                type="radio"
                                id="cautious"
                                value="cautious"
                                checked={selectedContentDetectionMode === "cautious"}
                                onChange={handleContentDetectionModeChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Detectare normal??"
                                name="contentDetection"
                                type="radio"
                                id="normal"
                                value="normal"
                                checked={selectedContentDetectionMode === "normal"}
                                onChange={handleContentDetectionModeChange}
                            />
                            <Form.Check
                                // className="form-check-inline"
                                label="Detectare agresiv??"
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
                                label="Adaug?? margini albe"
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
                                label="Corecteaz?? iluminarea din imagine"
                                name="normalizeIllumination"
                                id="normalize_illumination"
                                type="checkbox"
                                checked={normalizeIllumination}
                                onChange={handleNormalizeIllumination}
                            />
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="my-3 mx-2">
                        <Form.Label className="mb-4">
                            Schimb?? grosimea caracterelor:
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