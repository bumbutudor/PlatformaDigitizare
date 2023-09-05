import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
const LatestExceptionsWidget = ({ period, getDictionary, numberOfExceptionsToShow }) => {

    const [exceptions, setExceptions] = useState([]);

    useEffect(() => {
        getDictionary().then(data => {
            setExceptions(data.entries);
        })
    }, []);

    console.log(exceptions);
    return (
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
                        exceptions.slice(0, numberOfExceptionsToShow).map((item, index) => {
                            // sort table TODO
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
    )
}


export default LatestExceptionsWidget;