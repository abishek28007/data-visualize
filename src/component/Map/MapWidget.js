import React, { Component } from 'react';
import MapGL from 'react-map-gl';
import data from '../../assets/iit-data';
import logo from '../../assets/logo.svg';
import './mapbox-gl.css'

const img = new Image(20, 20);
const MAP_BOX_TOKEN = 'map_box_access_token';
const MAP_STYLE = 'mapbox://styles/mapbox/light-v10?optimize=true';//'mapbox://styles/mapbox/dark-v10';
const MAP_MIN_ZOOM = 2;
const MAP_MAX_ZOOM = 20;
const MAP_DEFAULT_ZOOM = 2;
const HEATMAP_SOURCE_ID = 'base-source';
const HEATMAP_LAYER = 'heatmap-layer';
const HEATMAP_POINT_LAYER = 'heatmap-point-layer';
const ICON_LAYER = 'icon-layer';
const THREE_D_LAYER = '3d-buildings';
const POINT_LAYER = 'point-layer';

export default class HeatMapWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        longitude: 77.1873232,
        latitude: 28.5431249,
        zoom: MAP_DEFAULT_ZOOM,
        minZoom: MAP_MIN_ZOOM,
        maxZoom: MAP_MAX_ZOOM
      },
      baseLayerData: data,
      x: 0,
      y: 0,
      hoveredObject: {}
    };
    this.layers = [
      HEATMAP_LAYER,
      HEATMAP_POINT_LAYER,
      ICON_LAYER,
      THREE_D_LAYER,
      POINT_LAYER
    ];
    this._mapRef = React.createRef();
    this.onMapHover = this.onMapHover.bind(this);
    this.removeLayers = this.removeLayers.bind(this);
    this.addLayers = this.addLayers.bind(this);
  }

  toggleVisibility(layer) {
    const map = this._getMap();
    const visibility = map.getLayoutProperty(layer, 'visibility');
    if (visibility === 'visible') {
      map.setLayoutProperty(layer, 'visibility', 'none');
    } else {
      map.setLayoutProperty(layer, 'visibility', 'visible');
    }
  }

  render() {
    const { viewport } = this.state;
    return (
      <MapGL
        ref={this._mapRef}
        {...viewport}
        width="100%"
        height="100%"
        mapStyle={MAP_STYLE}
        onViewportChange={viewport => this.setState({ viewport })}
        mapboxApiAccessToken={MAP_BOX_TOKEN}
        onHover={this.onMapHover}
        onLoad={this.addLayers}
      >
        {this.renderDropDown()}
      </MapGL>
    );
  }
  renderDropDown() {
    return (
      <div className='map-select-box'>
        <span>Remove Layer</span>
        <form onChange={event => { this.toggleVisibility(event.target.value) }}>
          {this.layers.map((layer, index) => (
            <div key={index}>
              <input type='checkbox' value={layer} />
              <label>{layer}</label>
            </div>
          ))}
        </form>
      </div>
    );
  }
  // Adding Icons Layer
  getIconLayer() {
    return {
      "id": ICON_LAYER,
      "type": "symbol",
      "source": HEATMAP_SOURCE_ID,
      "layout": {
        "visibility": "visible",
        "icon-image": "react",
        "icon-size": 2
      }
    };
  };
  // Adding HeatMap Layer
  getHeatMapLayer() {
    return {
      "id": HEATMAP_LAYER,
      "type": "heatmap",
      "source": HEATMAP_SOURCE_ID,
      "layout": {
        "visibility": "visible"
      },
      "paint": {
        // Transition from heatmap to circle layer by zoom level
        "heatmap-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7, 1, // for zoom level less then or equal to 7 opacity is 1
          15, 0 // for zoom level greater then or equal to 15 opacity is 0
        ],
      }
    };
  };
  // Adding Points For HeatMap
  getHeatMapPointLayer() {
    return {
      "id": HEATMAP_POINT_LAYER,
      "type": "circle",
      "source": HEATMAP_SOURCE_ID,
      "layout": {
        "visibility": "visible"
      },
      "paint": {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7, 3, // for zoom level less then or equal to 7 radius is 3
          18, 6 // for zoom level greater then or equal to 18 radius is 6
        ],
        // Transition from heatmap to circle layer by zoom level
        "circle-opacity": [
          "interpolate",
          ["linear"],
          ["zoom"],
          10, 0, // for zoom level less then or equal to 10 opacity is 0
          15, 1 // for zoom level greater then or equal to 15 opacity is 1
        ]
      }
    };
  };
  // Adding Points to Map
  getPointLayer() {
    return {
      "id": POINT_LAYER,
      "type": "circle",
      "source": HEATMAP_SOURCE_ID,
      "layout": {
        "visibility": "visible"
      },
      "paint": {
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          7, 3, // for zoom level less then or equal to 7 radius is 3
          18, 6 // for zoom level greater then or equal to 18 radius is 6
        ],
      }
    };
  };
  // Adding extrusion for 3D-Buildings 
  getBuildingLayer() {
    return {
      'id': THREE_D_LAYER,
      'source': 'composite',
      'source-layer': 'building',
      "layout": {
        "visibility": "visible"
      },
      'filter': ['==', 'extrude', 'true'],
      'type': 'fill-extrusion',
      'minzoom': 15,
      'paint': {
        'fill-extrusion-color': '#aaa',
        // use an 'interpolate' expression to add a smooth transition effect to the
        // buildings as the user zooms in
        'fill-extrusion-height': [
          "interpolate", ["linear"], ["zoom"],
          15, 0,
          15.05, ["get", "height"]
        ],
        'fill-extrusion-base': [
          "interpolate", ["linear"], ["zoom"],
          15, 0,
          15.05, ["get", "min_height"]
        ],
        'fill-extrusion-opacity': .6
      }
    }
  };

  _getMap = () => {
    return this._mapRef.current ? this._mapRef.current.getMap() : null;
  };

  addLayers() {
    const map = this._getMap();
    img.onload = () => map.addImage('react', img);
    img.src = logo;
    if (map.getSource(HEATMAP_SOURCE_ID)) {
      map.getSource(HEATMAP_SOURCE_ID).setData(this.state.baseLayerData);
    } else {
      map.addSource(HEATMAP_SOURCE_ID, { type: 'geojson', data: this.state.baseLayerData });
    }
    map.addLayer(this.getHeatMapLayer());
    map.addLayer(this.getHeatMapPointLayer());
    map.addLayer(this.getPointLayer());
    map.addLayer(this.getIconLayer());
    map.addLayer(this.getBuildingLayer());
  };
  // Remove layer entirely
  removeLayers() {
    const map = this._getMap();
    if (map.getLayer(HEATMAP_LAYER)) {
      map.removeLayer(HEATMAP_LAYER);
    }
    if (map.getLayer(POINT_LAYER)) {
      map.removeLayer(POINT_LAYER);
    }
  };

  onMapHover(e) {
    // const { center: { x, y }, features } = e;
    // if(features && features[0] && features[0].properties && features[0].properties.name){
    //   // this.setState({ x, y, hoveredObject: features[0].properties });
    // }
  }
}
