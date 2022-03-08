import React from "react";
import RangeSlider from "react-bootstrap-range-slider";
import Form from "react-bootstrap/Form";

const OpenCV = (props) => {

    const [preprocessOpenCV, setPreprocessOpenCV] = React.useState(
        props.getStore().preprocessOpenCV
    );
    const [resolutionOpenCV, setResolutionOpenCV] = React.useState(
        props.getStore().preprocessOpenCV.resolution
    );

    // Preprocesare cu OpenCV
    const handlePreprocessOpenCVChange = (e) => {
        setPreprocessOpenCV({
            ...preprocessOpenCV,
            [e.target.name]: e.target.checked,
        });
        props.updateStore({
            preprocessOpenCV: {
                ...preprocessOpenCV,
                [e.target.name]: e.target.checked,
            },
        });
    };

    const handleResolutionChange = (e) => {
        setResolutionOpenCV(e.target.value);
        props.updateStore({
            preprocessOpenCV: {
                ...props.getStore().preprocessOpenCV,
                resolution: e.target.value,
            },
        });
    };



    return (
        console.log(props.getStore()),
        <>
            <Form.Group>
                <Form.Label>
                    2.2 Opțiuni de preprocesare cu OpenCV
                </Form.Label>
            </Form.Group>
            <Form.Group
                className="mb-5 display-flex"
                id="openCVResolution"
            >
                <Form.Check
                    label="Setează rezoluția imaginii"
                    name="setResolution"
                    id="checkboxCV1"
                    type="checkbox"
                    checked={preprocessOpenCV.setResolution}
                    onChange={handlePreprocessOpenCVChange}
                />
                {props.getStore().preprocessOpenCV.setResolution && (
                    <div className="row mt-2">
                        <div className="col-9">
                            <RangeSlider
                                value={resolutionOpenCV}
                                tooltipLabel={(resolutionOpenCV) =>
                                    `${resolutionOpenCV} dpi`
                                }
                                onChange={handleResolutionChange}
                                // tooltip="on"
                                min={75}
                                max={1200}
                                step={25}
                            />
                        </div>
                        <div className="col-3 text-warning">
                            <Form.Control value={resolutionOpenCV} onChange={handleResolutionChange} />
                        </div>
                    </div>
                )}
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Check
                    label="Șterge zgomotul și neclaritatea din imagine"
                    name="removeNoise"
                    id="checkboxCV2"
                    type="checkbox"
                    checked={preprocessOpenCV.removeNoise}
                    onChange={handlePreprocessOpenCVChange}
                />
            </Form.Group>

        </>
    );
}

export default OpenCV;