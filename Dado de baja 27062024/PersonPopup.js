// PersonPopup.js
import React from 'react';
import './PersonPopup.css';

const PersonPopup = ({ selectedPerson, setSelectedPerson }) => {
    const persons = ['Personal 1', 'Personal 2', 'Personal 3', 'Personal 4', 'Personal 5'];

    const handleSelect = (event) => {
        setSelectedPerson(event.target.value);
    };

    return (
        <div className="person-popup">
            <label htmlFor="person-select">Seleccionar Persona: </label>
            <select id="person-select" value={selectedPerson} onChange={handleSelect}>
                {persons.map(person => (
                    <option key={person} value={person}>{person}</option>
                ))}
            </select>
        </div>
    );
};

export default PersonPopup;
