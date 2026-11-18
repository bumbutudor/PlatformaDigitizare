import React, { useState, useEffect } from 'react';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import DigitizationSteps from '../DigitizationSteps';
import { Container, Row } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import AboutPage from './AboutPage';
import ToolsAndResourcesPage from './ToolsAndResourcesPage';
import "@fancyapps/ui/dist/fancybox.css";
import { handoffFromLocation } from '../../utils/DigiBridge';

function HomePage() {
    const [handoff] = useState(() => {
        try { return { context: handoffFromLocation() }; }
        catch (error) { return { error: error.message }; }
    });
    const [key, setKey] = useState(handoff.context || handoff.error ? '#aplicatie' :
        window.location.hash === '#aplicatie' ? '#aplicatie' : '#despre');
    useEffect(() => {
        window.location.hash = key;
    }, [key]);

      const shouldRenderHeDyTab = () => {
        // Verifică dacă 'key' nu este '#despre'
        return key !== '#despre';
    }
    return (
        <div >
            {key === '#despre' && (
                <Row className='text-center'>
                    <Col>
                        <h1 className='title'>Platformă de digitizare</h1>
                        <p className='tagline'>
                            instrumente și resurse pentru prelucrarea
                            <br></br>documentelor chirilice românești
                        </p>
                    </Col>
                </Row>
            )}
            <main>
                <Row>
                    <Col>
                        <Tabs
                            id="controlled-tab"
                            activeKey={key}
                            onSelect={(k) => setKey(k)}
                            className={key === '#despre' ? "mb-4 pb-4" : "mb-1 pb-1"}
                        >

            {/*              {shouldRenderHeDyTab() && (*/}
            {/*    <Tab eventKey="#hedy" title="HeDy">*/}
            {/*       <AboutPage />*/}
            {/*    </Tab>*/}
            {/*)}*/}
                            <Tab eventKey="#despre" title="HeDy">
                                <AboutPage />
                            </Tab>
                            <Tab

                              title={
                                <a
                                  href="https://drive.google.com/drive/folders/1KFgvysCu24nBKDxMP13EJjznBzLQuT_V?usp=drive_link"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="no-underline"
                                >
                                  Instrumente și Resurse
                                </a>
                              }
                            />

                            <Tab eventKey="#aplicatie" title="Aplicație de digitizare">
                                <DigitizationSteps digiContext={handoff.context} handoffError={handoff.error} />
                            </Tab>
                        </Tabs>
                    </Col>
                </Row> 
            </main>
        </div>
    );
}

export default HomePage;
