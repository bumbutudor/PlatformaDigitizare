import React from 'react';
import { Table, Button } from 'react-bootstrap';
import { mapPeriodBack } from '../utils/Utills';

const ExceptionListWidget = ({ exceptions, onRemove }) => {
    return (
        <div className='table-fixed'>
            <Table bordered hover size="sm" className='table-success'>
                <thead>
                    <tr>
                        <th>Varianta greșită</th>
                        <th>Varianta corectă</th>
                        <th>Perioada</th>
                        <th>Adăugat de</th>
                        <th>Acțiuni</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        exceptions.map((item, index) => {
                            // sort table TODO
                            return (
                                <tr key={index}>
                                    <td>{item.exception}</td>
                                    <td>{item.correct_word}</td>
                                    <td>{mapPeriodBack(item.period)}</td>
                                    <td>{item.added_by}</td>
                                    <td>
                                        <Button variant="danger" onClick={() => onRemove(item.id)}>Șterge</Button>
                                    </td>
                                </tr>
                            )
                        })
                    }
                </tbody>
            </Table>
        </div>
    )
}

export default ExceptionListWidget;