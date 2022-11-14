import React, { useEffect, useState, useCallback} from 'react';


const CATEGORY_OPTIONS = [
    "Illegal Dumping",
    "Rubbish and Recycling",
    "Abandoned Vehicle",
    "Pothole Repair",
    "Graffiti Removal",
    "Vacant Lots",
    "Street Light Outage",
    "Property Maintenance",
    "Street Trees",
    "Other",
  ];

export default function DataView ({}) {
    return (
        <div className="card card-style">
            <div className="data-container"> 
                <div className="data-section"> 
                    <p className="data-title">Number of Requests</p>
                </div>
                <div className="data-section"> 
                    <p className="data-title">Requests Completed</p>
                </div>
            </div>

        </div>
    );
}
  