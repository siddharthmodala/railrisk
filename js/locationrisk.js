(function() {
    var app = angular.module('locationrisk', []);

    app.controller("LocationRiskController", ['$scope', '$http', function($scope, $http) {

    	 $scope.tankCarDesigns = [{name: 'Legacy DOT 111 (7/16 inch, no jacket)', value: 0.196,carCount:0},
                                  {name: 'Legacy DOT 111 (7/16 inch, jacket)', value: 0.085,carCount:0},
                                  {name: 'CPC-1232 (7/16 inch, with jacket)', value: 0.103,carCount:0},
                                  {name: 'CPC-1232 (1/2 inch, no jacket)', value: 0.046,carCount:0},
                                  {name: 'CPC-1232 (1/2 inch, with jacket)', value: 0.037,carCount:0}];
            $scope.noOfCars = 200;
            $scope.tankCarDesign = $scope.tankCarDesigns[0];
            $scope.trainSpeed = 45;
            $scope.annualTrainUnits = 20;
            $scope.risk = 0;
            $scope.releaseInterval =0 
            $scope.segmentLength = 0;
            $scope.tankCarDesignSplit = false;
            $scope.minimizetankCarDesignSplit = false;
            var scope = $scope;
            var http = $http;
            var nodes = [];
            var baseurl = "/geoserver/railroad/wms";
            var wsg84 = new ol.Sphere(6378137);
            ol.Extent =[-116.08019063893,22.89094998168,-66.271658797184,52.27135336056];
          
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
                       
           	var attribution = new ol.Attribution({
          	  html: 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/' +
          	      'rest/services/World_Topo_Map/MapServer">ArcGIS</a>'
          	});


          var statebg = new ol.layer.Tile({
                source: new ol.source.XYZ({
                  attributions: [attribution],
                  url: 'http://server.arcgisonline.com/ArcGIS/rest/services/' +
                      'World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
                })
              });
          
          
            	var tracks = new ol.layer.Tile({
            		title:"Railway Tracks",
              	  	source: new ol.source.TileWMS({
              	  		attributions:[
              	  		              new ol.Attribution({
              	  		            	  html:'</br><p style="font-size:13px">Track legend</p><img style ="max-height:15em"src="/geoserver/railroad/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=railroad%3Atracks_main"/> '
              	  		              })
              	  		              ],
                    	  url: baseurl,
                    	  params: {'LAYERS': 'railroad:tracks_main'},
                    	  serverType: 'geoserver'
                    	})
              	});

            	var view = new ol.View({
            	center: [-11132436.5045,4866153.7734],
           	  	zoom:5,
           	  	minZoom:3,
           	  	maxZoom:14
            	});

            	var overlay = new ol.Overlay({
          		  element: document.getElementById('popup')
          		});
            	
            	var tempcontrol = new ol.control.Control({element:document.getElementById('sidemenu')});
            	
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
            		        color: '#FFFF00',
            		        width: 8
            		      })
            		    })
            	});
            	
            	// The vector layer used to display the search pin .
            	var iconStyle = new ol.style.Style({
          		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
          			    anchor: [0.5, 46],
          			    anchorXUnits: 'fraction',
          			    anchorYUnits: 'pixels',
          			    opacity: 0.75,
          			    src: 'js/img/pin.png'
          			  }))
          			}); 
            	var searchSrc = new ol.source.Vector({
            	    features: []
            	  })
            	var searchLayer = new ol.layer.Vector({
            	  source: searchSrc
            	});
            	
            	var map = new ol.Map({
            	  layers: [statebg,tracks,vectorLayer,searchLayer],
            	  target: 'map',
            	  renderer:tempFunc.getRenderFromQueryString(),
            	  overlays:[overlay],
            	  view: view
            	});
            	
            	
            	map.addControl(new ol.control.ScaleLine());
            	map.addControl(new ol.control.ZoomSlider());
            	map.on('click', function(evt) {
            		  var coordinate = evt.coordinate;
            
            		  var viewResolution = /** @type {number} */ (view.getResolution());
            		  var url = tracks.getSource().getGetFeatureInfoUrl(
            		      evt.coordinate, viewResolution, 'EPSG:3857',
            		      {'INFO_FORMAT': 'application/json'});
            		  
            		  http.get(url).success(function(data){
            			  $('#dialog').dialog('close');
            	        if(data.features.length >0)
            	        	{
            	        	    var L = parseFloat(data.features[0].properties.miles);
            	                scope.segmentLength = L;
            	                var C = parseFloat(data.features[0].properties.consequence);
            	                var P=0;
	    				 		var D=0;
            	                if(scope.tankCarDesignSplit)
		    					 {
		    				 		 
		    				 		 for(var ti = 0; ti< scope.tankCarDesigns.length; ti++)
		    				 			 {
		    				 			 	P += scope.tankCarDesigns[ti].value * scope.trainSpeed/26 * (parseFloat(scope.tankCarDesigns[ti].carCount)/scope.noOfCars);
		    				 			 }
		    				 		D = 0.09 * scope.noOfCars * scope.trainSpeed / 26;
		    			 		 }
		    				 	 else
		    				 	 {
		    				 		 P = scope.tankCarDesign.value * scope.trainSpeed / 26; // 26 is the avg train speed on any line
		    				 		 D = 0.09 * scope.noOfCars * scope.trainSpeed / 26; // 0.1 is to accomodate 10% OF THE cars derailed
		    				 	 }
            	                var Z = parseFloat(data.features[0].properties.derailmentrate);
            	                scope.risk = Z * L * (1 - Math.pow((1 - P), D))*C;
            	                scope.releaseInterval = C/(scope.risk * scope.annualTrainUnits);

            	                document.getElementById('riskcontent').innerHTML = parseFloat(scope.risk).toExponential(2);
            	                document.getElementById('intervalcontent').innerHTML = numberWithCommas(parseFloat(scope.releaseInterval).toFixed(1));
            	                document.getElementById('segmentlength').innerHTML =parseFloat(scope.segmentLength).toFixed(1);
            	                var dist =0;
            	                if(nodes[0].getPlace() != null)
            	                	{
            	                		var temppoint = [nodes[0].getPlace().geometry.location.D , nodes[0].getPlace().geometry.location.k];
            	                		var linepoint = data.features[0].geometry.coordinates[0];
            	                		//var temp = new ol.geom.LineString([temppoint,linepoint[0]]);
            	                		//var dist = Math.round(temp.getLength() * 100) / 100
            	                		var wgs84Sam = new ol.Sphere(6378137);
            	                		dist = wgs84Sam.haversineDistance(temppoint,linepoint[0]);
            	                		for(var i =1; i<linepoint.length;i++)
            	                			if(dist > wgs84Sam.haversineDistance(temppoint,linepoint[i]))
            	                				dist = wgs84Sam.haversineDistance(temppoint, linepoint[i]);
            	                		
            	                	}
            	                console.log(dist);
            	                
            	                document.getElementById('evacuationRequired').innerHTML = (dist >0 && dist < 804.67 )? "Yes":"No"; // if with in 5 miles radius
            	                $('#dialog').dialog('open');
            	        		var vectorfeatures = new ol.format.GeoJSON().readFeatures(data.features[0],{'featureProjection':'EPSG:3857'});
            	        			vectorSource.clear();
            	        			vectorSource.addFeatures(vectorfeatures);
            	        	}
            		  }).error(function(){
            			  alert('error');
            		  });           		  
            		});
            	
            	function numberWithCommas(x) {
            	    var parts = x.toString().split(".");
            	    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            	    return parts.join(".");
            	}
            	 $('#dialog').dialog({
            		 	autoOpen: false,
	                	dialogClass: "no-close",
	                	position: { my: "left top", at: "left top", of: $('#mapdiv') },
	                	buttons:{
	                		"Close":function(){
	                			vectorSource.clear();
	                    		//searchSrc.clear();
	                    		//document.getElementById('searchloc').value = '';
	                    		$(this).dialog('close');
	                		}
	                	}
	                	
	                });
            	
            	var formstate = true;
            	
            	$scope.toggleDiv = function()
            	{
            		var formdiv = $('#formdiv');
        			var mapdiv = $('#mapdiv');
        			var dirIcon = $('#directionIcon');
            		if(formstate)
            		{	
            			mapdiv.removeClass('col-sm-8 col-sm-offset-4 col-md-9 col-md-offset-3',500,updatemap).addClass('col-sm-12 col-md-12',10,updatemap);
            			dirIcon.removeClass().addClass('glyphicon glyphicon-forward');
            			
               		}
            		else{
              			mapdiv.removeClass().addClass('col-sm-8 col-sm-offset-4 col-md-9 col-md-offset-3',500,updatemap);
            			dirIcon.removeClass().addClass('glyphicon glyphicon-backward');
                   		}
            		formdiv.toggle('slide',{},500);
            		formstate = !formstate;
            		
            		function updatemap()
            		{
            			map.updateSize();
            		}
            	}
            	$scope.toggleCarDesign = function()
            	{
            		$scope.tankCarDesignSplit = !$scope.tankCarDesignSplit;
            	};
            	
            	$scope.minimizeCarDesignSplit  = function(){
            		$scope.minimizetankCarDesignSplit = !$scope.minimizetankCarDesignSplit;
            	}
            	var initSearch = function initialize(elementName)
                {

                var defaultBounds = new google.maps.LatLngBounds(
                		  new google.maps.LatLng(-125.332,49.095),
                		  new google.maps.LatLng(-66.753,25.721));
                  
                  var options = {
                		  bounds: defaultBounds,
                		  componentRestrictions: {country: 'us'}
                		};

                  var input = /** @type {HTMLInputElement} */(
                      document.getElementById(elementName));
               
                  var autocomplete = new google.maps.places.Autocomplete(input,options);
                  
                 google.maps.event.addListener(autocomplete, 'place_changed', function() {
                    var place = autocomplete.getPlace();
                    if (!place.geometry) {
                      return;
                    }

                    // If the place has a geometry, then present it on a map.
                    /*if (place.geometry.viewport) {
                    	
                    } else {*/
                      //map.setCenter(place.geometry.location);
                      //map.setZoom(17);  // Why 17? Because it looks good.
                    	searchSrc.clear();
                    	var newStation = new ol.Feature();
                    	newStation.setStyle(iconStyle);
                    	newStation.setGeometry(new ol.geom.Point(ol.proj.transform([place.geometry.location.D,place.geometry.location.k],'EPSG:4326','EPSG:3857')));
                    	searchSrc.addFeature(newStation);
                   		view.setCenter(ol.proj.transform([place.geometry.location.D,place.geometry.location.k],'EPSG:4326','EPSG:3857'));
                   		view.setZoom(12);

                   /* }*/
                    /*var address = '';
                    if (place.address_components) {
                      address = [
                        (place.address_components[0] && place.address_components[0].short_name || ''),
                        (place.address_components[1] && place.address_components[1].short_name || ''),
                        (place.address_components[2] && place.address_components[2].short_name || '')
                      ].join(' ');
                    }*/

                    //infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
                    //infowindow.open(map, marker);
                  });
                  return autocomplete;
                } // End of InitSearch

                angular.element(document).ready(function(){
                    	nodes.push(initSearch("searchloc"));	
                    
                });
            	
                map.updateSize();
        }]);


})();

