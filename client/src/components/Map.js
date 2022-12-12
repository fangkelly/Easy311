import React, { useEffect, useState, useCallback } from "react";
import { StaticMap, MapContext, NavigationControl } from "react-map-gl";
import DeckGL, { GeoJsonLayer, FlyToInterpolator } from "deck.gl";
import neighborhoods from "../data/neighborhoods.json";
import center from "@turf/center";
import { polygon } from "@turf/helpers";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { PolygonLayer } from "deck.gl";

const INITIAL_VIEW_STATE = {
  latitude: 40,
  longitude: -75.16,
  zoom: 10.5,
  minZoom: 9,
  bearing: 0,
  pitch: 0,
};

const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZmFuZ2siLCJhIjoiY2t3MG56cWpjNDd3cjJvbW9iam9sOGo1aSJ9.RBRaejr5HQqDRQaCIBDzZA";
const MAP_STYLE = "mapbox://styles/fangk/clajv6ki9001z14nyv0bhi16q";
const NAV_CONTROL_STYLE = {
  position: "absolute",
  bottom: "12vh",
  right: "2vh",
};

const intensity = 1.75;
const threshold = 0.1;
const radiusPixels = 20;

export default function Map({
  data,
  setPointData,
  neighborhood,
  setNeighborhood,
  setDataView,
  enableHeatmap,
}) {
  const [initialViewState, setInitialViewState] = useState(INITIAL_VIEW_STATE);
  const [activeLayer, setActiveLayer] = useState({
    phl311: false,
    heatmp: true,
  });

  const [cityBoundary, setCityBoundary] = useState(null);

  const colors = {
    "Illegal Dumping": [108, 195, 196, 200],
    "Rubbish and Recycling": [213, 158, 255, 200],
    "Abandoned Vehicle": [255, 198, 138, 200],
    "Pothole Repair": [255, 126, 135, 200],
    "Graffiti Removal": [139, 191, 162, 200],
    "Vacant Lots": [155, 219, 232, 200],
    "Street Light Outage": [103, 143, 210, 200],
    "Property Maintenance": [255, 217, 227, 200],
    "Street Trees": [50, 202, 206, 200],
    Other: [127, 76, 112, 200],
  };

  useEffect(() => {
    fetch("/philly")
      .then((res) => res.json())
      .then((data) => setCityBoundary(data));
  }, []);

  useEffect(() => {
    if (neighborhood) {
      flyToClick(
        center(polygon(neighborhood.geometry.coordinates[0])).geometry
          .coordinates,
        null,
        14,
        0
      );
    }
  }, [neighborhood]);

  useEffect(()=>{
    if (enableHeatmap) {
      setActiveLayer({phl311:false, heatmp:true})
    } else {
      setActiveLayer({phl311:true, heatmp:false})
    }
  }, [enableHeatmap])

  const flyToClick = useCallback((coords, obj = null, zoom = 15, pitch = 0) => {
    if (obj) setPointData(obj);
    setInitialViewState({
      longitude: coords[0],
      latitude: coords[1],
      zoom: zoom,
      transitionDuration: 1000,
      transitionInterpolator: new FlyToInterpolator(),
      minZoom: 9,
      pitch: pitch,
    });
  });

  const layers = [
    new GeoJsonLayer({
      id: "philly", // layer id
      data: cityBoundary, // data formatted as array of objects
      opacity: 0.7,
      stroked: true,
      getLineWidth: 50,
      filled: false,
      // getFillColor: [255, 255, 255, 20],
      wireframe: true,
      getLineColor: [255, 255, 255],
      pickable: false,
    }),

    new GeoJsonLayer({
      id: "neighborhoods", // layer id
      data: neighborhoods, // data formatted as array of objects
      opacity: 0.3,
      stroked: true,
      getLineWidth: 20,
      filled: true,
      wireframe: true,
      getFillColor: [128, 128, 128, 0],
      getLineColor: [255, 255, 255],
      pickable: true,
      onClick: (info, event) => {
        setDataView(true);
        // figure out setNeighborhood logic
        setNeighborhood(info.object);
      },
    }),

    new GeoJsonLayer({
      id: "neighborhood", // layer id
      data: neighborhood, // data formatted as array of objects
      stroked: true,
      getLineWidth: 30,
      getFillColor: [128, 128, 128, 0],
      getLineColor: [152, 231, 231],
    }),

    new GeoJsonLayer({
      id: "phl311", // layer id
      data: data, // data formatted as array of objects
      // Styles
      filled: true, // filled in point
      stroked: true, // outline stroke
      getLineColor: (d) => {
        if (colors[d.properties.service_name]) {
          return colors[d.properties.service_name];
        } else {
          return colors["Other"];
        }
      },
      lineWidthMinPixels: 8,
      lineWidthUnits: "pixels",
      pointRadiusMinPixels: 10, // minimum point radius (px)
      radiusScale: 6,
      getPosition: (d) => d.geometry.coordinates, // coordinates [lng, lat] for each data point
      getFillColor: [255, 255, 255, 255], // rgb color values
      opacity: 0.9, // opacity 0 to 1
      pickable: true,
      onClick: (info, event) => {
        flyToClick(info.coordinate, info.object, 16);
      },
      // getRadius: (d) => {
      //   if (initialViewState.zoom > 14) {
      //     return 10
      //   } else {
      //     return 5
      //   };
      // },
      visible: activeLayer.phl311,
      // updateTriggers: {
      //   getRadius: initialViewState.zoom,
      // },
    }),

    new HeatmapLayer({
      data,
      id: "heatmp-layer",
      getPosition: (d) => d.geometry.coordinates,
      radiusPixels,
      intensity,
      threshold,
      opacity: 1,
      colorRange: [
        [208, 236, 236],
        [108, 195, 196],
        [52, 138, 174],
        [0, 85, 154],
        [0, 44, 79],
      ],
      visible: activeLayer.heatmp,
      pickable: true,
      onClick: (info, event) => {
        flyToClick(info.coordinate, null, 14);
      },
    }),
  ];

  const onViewStateChange = ({ viewState }) => {
    if (viewState.zoom > 13 || !enableHeatmap) {
      setActiveLayer({ phl311: true, heatmp: false });
    } else {
      setActiveLayer({ phl311: false, heatmp: true });
    }
  };

  return (
    <DeckGL
      initialViewState={initialViewState}
      controller={true}
      layers={layers}
      ContextProvider={MapContext.Provider}
      onViewStateChange={onViewStateChange}
    >
      <StaticMap
        mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
        mapStyle={MAP_STYLE}
      />
      <NavigationControl style={NAV_CONTROL_STYLE} />
    </DeckGL>
  );
}
