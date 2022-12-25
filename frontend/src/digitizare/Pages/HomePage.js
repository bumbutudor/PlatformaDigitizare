import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import React from 'react';
import { useState } from 'react';

import DigitizationSteps from '../DigitizationSteps';
import { Container, Row } from 'react-bootstrap';
import Col from 'react-bootstrap/Col';
import AboutPage from './AboutPage';
import ToolsAndResourcesPage from './ToolsAndResourcesPage';
import "@fancyapps/ui/dist/fancybox.css";


function HomePage() {
    const [key, setKey] = useState('home');


    return (
        <div >

            {key !== 'digiapp' && (
                <Row className='text-center'>
                    <Col>
                        <h1 className='title'>Platformă de digitizare</h1>


                        <p className='tagline'>
                            instumente și resurse pentru prelucrarea
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
                            className={key !== 'digiapp' ? "mb-4 pb-4" : "mb-1 pb-1"}
                        >
                            <Tab eventKey="home" title="Despre platformă">
                                <AboutPage />
                            </Tab>
                            <Tab eventKey="tools" title="Instrumente și Resurse" >
                                <ToolsAndResourcesPage />
                            </Tab>
                            <Tab eventKey="digiapp" title="Aplicație de digitizare">
                                <DigitizationSteps />
                            </Tab>
                        </Tabs>
                    </Col>
                </Row>
            </main>


        </div>
    );
}

export default HomePage;