var tempFunc = {}
        	tempFunc.getRenderFromQueryString = function() {
        		  var obj = {}, queryString = location.search.slice(1),
        	      re = /([^&=]+)=([^&]*)/g, m;

        	  while (m = re.exec(queryString)) {
        	    obj[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        	  }
        	  if ('renderers' in obj) {
        	    return obj['renderers'].split(',');
        	  } else if ('renderer' in obj) {
        	    return [obj['renderer']];
        	  } else {
        	    return undefined;
        	  }
        	}
var baseurl = "http://localhost:8080/geoserver/railroad/wms";
var extent =[-116.08019063893,22.89094998168,-66.271658797184,52.27135336056];
var tracks = new ol.layer.Image({
	title:"Railway Tracks",
	  	source: new ol.source.ImageWMS({
    	  url: baseurl,
    	  params: {'LAYERS': 'railroad:tracks'},
    	  serverType: 'geoserver'
    	})
	});

var attribution = new ol.Attribution({
	  html: 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/' +
	      'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'
	});


var bgarea = new ol.layer.Tile({
      source: new ol.source.XYZ({
        attributions: [attribution],
        url: 'http://server.arcgisonline.com/ArcGIS/rest/services/' +
            'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
      })
    });
var view =  new ol.View({
	center: [-11132436.5045,4866153.7734],
    zoom: 5
  });

var map = new ol.Map({
  layers: [
    bgarea,tracks
  ],
  renderer: tempFunc.getRenderFromQueryString(),
  target: 'map',
  view:view
});
//view.fitExtent(extent,map.getSize());
