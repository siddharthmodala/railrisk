(function() {
    var app = angular.module('locationrisk', []);

    app.controller("LocationRiskController", ['$scope', '$http', function($scope, $http) {

            $scope.tankCarDesigns = [{name: 'Car Desing 1', value: 0.3}, {name: 'Car Design 2', value: 0.5}, {name: 'Car Design 3', value: 0.5}];
            $scope.noOfCars = 200;
            $scope.tankCarDesign = $scope.tankCarDesigns[0];
            $scope.trainSpeed = 45;
            $scope.risk = 0;
            $scope.segmentLength = 0;
            var scope = $scope;
            var http = $http;
            var baseurl = "/geoserver/railroad/wms";
            ol.Extent =[-116.08019063893,22.89094998168,-66.271658797184,52.27135336056];
          
           	var statebg = new ol.layer.Image({
            		title:"Country Background",
            	  source: new ol.source.ImageWMS({
                  	  url: baseurl,
                	  params: {'LAYERS': 'railroad:statebg'},
                	  serverType: 'geoserver'
                	})
            	});
            	var tracks = new ol.layer.Image({
            		title:"Railway Tracks",
              	  	source: new ol.source.ImageWMS({
                    	  url: baseurl,
                    	  params: {'LAYERS': 'railroad:tracks'},
                    	  serverType: 'geoserver'
                    	})
              	});

            	var view = new ol.View({
            		center: [-97, 38],
            	  projection: "EPSG:4326",
                  maxResolution: 0.3561261015634373,
            	  zoom:4
            	});

            	var overlay = new ol.Overlay({
          		  element: document.getElementById('popup')
          		});
            	
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
            	
            	var vectorSource = new ol.source.Vector({
            		features: []
            	});
            	
            	var vectorLayer = new ol.layer.Vector({
            		source: vectorSource,
            		style:new ol.style.Style({
            		    fill: new ol.style.Fill({
            		        color: 'rgba(255, 255, 255, 0.2)'
            		      }),
            		      stroke: new ol.style.Stroke({
            		        color: '#FF0000',
            		        width: 4
            		      })
            		    })
            	});
            	
            	var map = new ol.Map({
            	  layers: [statebg,tracks,vectorLayer],
            	  target: 'map',
            	  renderer:tempFunc.getRenderFromQueryString(),
            	  overlays:[overlay],
            	  view: view
            	});
            	
            	var container  = document.getElementById('popup');
            	var closebutton = document.getElementById('popup-closer');
            	map.on('click', function(evt) {
            		  var coordinate = evt.coordinate;
            		  
            		  var viewResolution = /** @type {number} */ (view.getResolution());
            		  var url = tracks.getSource().getGetFeatureInfoUrl(
            		      evt.coordinate, viewResolution, 'EPSG:4326',
            		      {'INFO_FORMAT': 'application/json'});
            		  
            		  http.get(url).success(function(data){
            	        if(data.features.length >0)
            	        	{
            	        	    var L = parseFloat(data.features[0].properties.MILES);
            	                scope.segmentLength = L;
            	                var D = 0.1 * scope.noOfCars * scope.trainSpeed / 30;
            	                var P = scope.tankCarDesign.value * scope.trainSpeed / 30;
            	                var Z = 0.000001;
            	                scope.risk = Z * L * (1 - Math.pow((1 - P), D));
            	                //scope.risk = parseFloat(scope.risk).toFixed(8)
            	                document.getElementById('riskcontent').innerHTML = parseFloat(scope.risk).toExponential(2);
            	                document.getElementById('segmentlength').innerHTML =parseFloat(scope.segmentLength).toFixed(2) +' Miles';
            	        		overlay.setPosition(coordinate);
            	        		container.style.display =  'block';
            	        		//for(var index=0; index< data.features[0].geometry.coordinates[0].length;index++)
            	        			vectorSource.addFeatures(new ol.format.GeoJSON().readFeatures(data.features[0]));
            	        	}
            		  }).error(function(){
            			  alert('error');
            		  });           		  
            		});
            	
            	closebutton.onclick = function() {
            		container.style.display = 'none';
            		closebutton.blur();
            		vectorSource.clear();
            	  return false;
            	};
            	
            	

        }]);


})();

