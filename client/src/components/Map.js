import React, { useEffect, useState} from 'react';
import {StaticMap, MapContext, NavigationControl} from 'react-map-gl';
import DeckGL, {GeoJsonLayer, ArcLayer} from 'deck.gl';
import {AmbientLight, PointLight, DirectionalLight, LightingEffect} from '@deck.gl/core';



const INITIAL_VIEW_STATE = {
  latitude: 40,
  longitude: -75.16,
  zoom: 10.5,
  minZoom: 10,
  bearing: 0,
  pitch: 0
};

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const MAP_STYLE = 'mapbox://styles/fangk/cl9wdl7xy000414mj5xk8899r';
const NAV_CONTROL_STYLE = {
  position: 'absolute',
  top: 10,
  left: 10
};

// create ambient light source
const ambientLight = new AmbientLight({
  color: [255, 0, 0],
  intensity: 1.0
});
// create point light source
const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  // use coordinate system as the same as view state
  position: [-125, 50.5, 5000]
});
// create directional light source
const directionalLight = new DirectionalLight({
  color: [255, 255, 255],
  intensity: 1.0,
  direction: [-3, -9, -1]
});

// create lighting effect with light sources
const lightingEffect = new LightingEffect({ambientLight, pointLight, directionalLight});

export default function Map({data}) {

  useEffect(()=>{
    console.log(data)
  }, [data])

  const onClick = info => {
    if (info.object) {
      // eslint-disable-next-line
      alert(`${info.object.properties.name} (${info.object.properties.abbrev})`);
    }
  };

  const layers = [
    new GeoJsonLayer({
      id: 'phl311', // layer id
      data: data, // data formatted as array of objects
      // Styles
      opacity: 0.9,
      filled: true, // filled in point
      stroked: true, // outline stroke
      getLineColor:[75, 162, 164, 60],
      getLineWidth: 10,
      lineWidthMinPixels: 10,
      lineWidthUnits: 'pixels',
      // pointRadiusMaxPixles: 10, // point radius scale
      pointRadiusMinPixels: 10, // minimum point radius (px)
      getPosition: d => d.geometry.coordinates, // coordinates [lng, lat] for each data point
      getFillColor: [255, 255, 255], // rgb color values
      opacity: 0.9, // opacity 0 to 1
      pickable: true
  })
  ];

  return (
    <DeckGL
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      effects={[lightingEffect]}
      layers={layers}
      ContextProvider={MapContext.Provider}
    >
      <StaticMap
      mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} 
      mapStyle={MAP_STYLE} />
      <NavigationControl style={NAV_CONTROL_STYLE} />
    </DeckGL>
  );
}

