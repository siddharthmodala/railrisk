(function() {
    var app = angular.module('routerisk', []);

    app.controller("RouteRiskController", ['$scope', '$http', function($scope, $http) {

    	$scope.tankCarDesigns = [{name: 'Car Design 1', value: 0.3}, {name: 'Car Design 2', value: 0.5}, {name: 'Car Design 3', value: 0.5}];
        $scope.noOfCars = 200;
        $scope.tankCarDesign = $scope.tankCarDesigns[0];
        $scope.trainSpeed = 45;
        $scope.risk = 0;
        $scope.routeLength = 0;
        $scope.nodeNames=[{displayName:'Origin',id:'origin',visible:true},
                          {displayName:'On Route Station 1',id:'onRoute1',visible:false},
                          {displayName:'On Route Station 2',id:'onRoute2',visible:false},
                          {displayName:'On Route Station 3',id:'onRoute3',visible:false},
                          {displayName:'Destination',id:'destination',visible:true}];
        var scope = $scope;
        var http = $http;
        var baseurl = "/geoserver/railroad/wms";
        var nodes = [];
        var extent =[-116.08019063893,22.89094998168,-66.271658797184,52.27135336056];
      
//       	var statebg = new ol.layer.Image({
//        		title:"Country Background",
//        	  source: new ol.source.ImageWMS({
//              	  url: baseurl,
//            	  params: {'LAYERS': 'railroad:statebg'},
//            	  serverType: 'geoserver'
//            	})
//        	});
       	
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
                	  url: baseurl,
                	  params: {'LAYERS': 'railroad:tracks'},
                	  serverType: 'geoserver'
                	})
          	});
        	
        	var popup = new ol.Overlay({
        		  element: document.getElementById('popup')
        		});

//        	var view = new ol.View({
//        		center: [-97, 38],
//        		projection: "EPSG:4326",
//        		maxResolution: 0.3561261015634373,
//        		zoom:4
//        	});
        	
        	var view = new ol.View({
        		//center: [-97, 38],
        		center: [-11132436.5045,4866153.7734],
//        		projection: "EPSG:4326",
//              maxResolution: 0.3561261015634373,
        	  zoom:5,
        	  minZoom:3,
        	  maxZoom:14
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
        	var routeSource = new ol.source.Vector({
				feature:[]
			});
			
			var routeLayer = new ol.layer.Vector({
				source:routeSource,
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
        	  layers: [statebg,tracks,routeLayer],
        	  target: 'map',
        	  renderer:tempFunc.getRenderFromQueryString(),
        	  overlays:[overlay,popup],
        	  view: view
        	});
        	//view.fitExtent(extent,map.getSize());
        	var params = {
        			  LAYERS: 'railroad:pgroute',
        			  FORMAT: 'image/png'
        			};
        	
        	
        	// The "start" and "destination" features.
        	var iconStyle = new ol.style.Style({
        		  image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
        			    anchor: [0.5, 46],
        			    anchorXUnits: 'fraction',
        			    anchorYUnits: 'pixels',
        			    opacity: 0.75,
        			    src: 'js/img/pin.png'
        			  }))
        			}); 

        	// The vector layer used to display the "start" and "destination" features.
        	var vectorSrc = new ol.source.Vector({
        	    features: []
        	  })
        	var vectorLayer = new ol.layer.Vector({
        	  source: vectorSrc
        	});
        	map.addLayer(vectorLayer);
        	var result;
        	var container  = document.getElementById('popup');
        	var closebutton = document.getElementById('popup-closer');
        	/*map.on('click', function(event) {
        		  if (originPoint.getGeometry() == null) {
        		    // First click.
        		    originPoint.setGeometry(new ol.geom.Point(event.coordinate));
        		  } else if (destPoint.getGeometry() == null) {
        		    // Second click.
        		    destPoint.setGeometry(new ol.geom.Point(event.coordinate));
        		    // Transform the coordinates from the map projection (EPSG:3857)
        		    // to the server projection (EPSG:4326).
        		    var startCoord = originPoint.getGeometry().getCoordinates();
        		    var destCoord = destPoint.getGeometry().getCoordinates();
        		    var viewparams = [
        		      'x1:' + startCoord[0], 'y1:' + startCoord[1],
        		      'x2:' + destCoord[0], 'y2:' + destCoord[1]
        		    ];
        		    
        		    params.viewparams = viewparams.join(';');
        		    result = new ol.layer.Image({
            		      source: new ol.source.ImageWMS({
            		        url: baseurl,
            		        params: params
            		      })
            		    });
            		    map.addLayer(result);	
        		    
        		    
        		    var featureurl = "/geoserver/railroad/ows?service=WFS&version=1.3.0&request=GetFeature" +
        		    				 "&typeName=railroad:pgroute&outputFormat=application/json&viewparams="+viewparams.join(';');
        		    http.get(featureurl).success(function(data){
        		    	
        		    	if(data!=null)
        		    		{
        		    			for(var i =0; i< data.features.length;i++)
        		    				{
        		    				 	var L = parseFloat(data.features[i].properties.cost);
        		    				 	scope.routeLength += L;
        		    				 	var D = 0.1 * scope.noOfCars * scope.trainSpeed / 30;
        		    				 	var P = scope.tankCarDesign.value * scope.trainSpeed / 30;
        		    				 	var Z = 0.000001;       		    				
        		    				}
        		    			
        		    			scope.risk = Z * L * (1 - Math.pow((1 - P), D));
        		    			
        		    			
            	                document.getElementById('riskcontent').innerHTML = parseFloat(scope.risk).toExponential();
            	                document.getElementById('routeLength').innerHTML =parseFloat(scope.routeLength).toFixed(2) +' Miles';
            	                container.style.display =  'block';
        		    			popup.setPosition(originPoint.getGeometry().getCoordinates());
        		    			
        		    		}
        		    }).error(function(data){
        		    	alert('Error calculating route risk');
        		    });  		    
        		    
        		  }
        		});*/

        	var closePopUP = function(){
        	  	container.style.display = 'none';
        		closebutton.blur();
        		vectorSrc.clear();
          	  	routeSource.clear();
        		//scope.clearRoute();
        		scope.routeLength = 0;
        		scope.risk =0;
        		for(var index =1;index<scope.nodeNames.length-1;index++)
        			{
        				
        				scope.nodeNames[index].visible=false;
        				document.getElementById(scope.nodeNames[index].id).value = '';
        			}
        		document.getElementById(scope.nodeNames[0].id).value = '';
        		document.getElementById(scope.nodeNames[4].id).value = '';
        		scope.$apply();
        		return false;
        	}
        	
        	closebutton.onclick = closePopUP;
        	
            $scope.clearRoute = closePopUP;
            
            $scope.calculateRisk = function(){
            	
            	if($scope.validateCalc())
            		{
            			var lastVisible = nodes[0];
            			for(var index =1; index < $scope.nodeNames.length;index++){
            				if($scope.nodeNames[index].visible){
            						$scope.calculateSubRisk(lastVisible,nodes[index])
            						lastVisible = nodes[index];
            					}
            			}
            		}
           }
            
            $scope.calculateSubRisk = function(src,dest)
            {
            	var viewparams = [
    		        		      'x1:' + src.getPlace().geometry.location.D, 'y1:' + src.getPlace().geometry.location.k,
    		        		      'x2:' + dest.getPlace().geometry.location.D, 'y2:' + dest.getPlace().geometry.location.k
    		        		    ];
    		        		               		        		    
    		        		    var featureurl = "/geoserver/railroad/ows?service=WFS&version=1.3.0&request=GetFeature" +
    		        		    				 "&typeName=railroad:pgroute&outputFormat=application/json&viewparams="+viewparams.join(';');
    		        		    http.get(featureurl).success(function(data){
    		        		    	
    		        		    	if(data!=null)
    		        		    		{
    		        		    			for(var i =0; i< data.features.length;i++)
    		        		    				{
    		        		    				 	var L = parseFloat(data.features[i].properties.miles);
    		        		    				 	scope.routeLength += L;      		    				
    		        		    				}
	        		    				 	var D = 0.1 * scope.noOfCars * scope.trainSpeed / 30;
	        		    				 	var P = scope.tankCarDesign.value * scope.trainSpeed / 30;
	        		    				 	var Z = 0.000001; 
    		        		    			
    		        		    			scope.risk += Z * scope.routeLength * (1 - Math.pow((1 - P), D));
    		        		    			
    		            	                document.getElementById('riskcontent').innerHTML = parseFloat(scope.risk).toExponential(2);
    		            	                document.getElementById('routeLength').innerHTML =parseFloat(scope.routeLength).toFixed(2) +' Miles';
    		            	                container.style.display =  'block';
    		            	                
    		        		    			popup.setPosition(ol.proj.transform([src.getPlace().geometry.location.D,src.getPlace().geometry.location.k],'EPSG:4326','EPSG:3857'));
    		        		    			data.totalFeatures = data.features.length;
    		        		    			
    		        		    			routeSource.addFeatures(new ol.format.GeoJSON().readFeatures(data,{'featureProjection':'EPSG:3857'}));
    		        		    			
    		        		    		}
    		        		    }).error(function(data){
    		        		    	alert('Error calculating route risk');
    		        		    });  		    
            	
            }
            
            
            	$scope.validateCalc = function(){
            	
            	for(var index =0; index < $scope.nodeNames.length;index++){
            		if($scope.nodeNames[index].visible){
            		if(!(document.getElementById(scope.nodeNames[index].id).value != '' && nodes[index].getPlace() !=null && nodes[index].getPlace().geometry !=  null )){
            			alert('Please enter correct address for ' + $scope.nodeNames[index].displayName);
            			return false;
            		}}
            	}
            	if(!($scope.noOfCars && $scope.trainSpeed && $scope.tankCarDesign))
            		{
            			alert('Please enter values in all fields');
            			return false;
            		}
            	return true;
            	
            }
            $scope.addStation = function(){
            	for(index in $scope.nodeNames)
            		{
            		if(!$scope.nodeNames[index].visible)
            			{
            			$scope.nodeNames[index].visible=true;
            				return;
            			}
            		}
        			alert('Only three on route stations are allowed.');
            }
            
            $scope.clearStations = function()
            {
        		for(var index =1;index<scope.nodeNames.length-1;index++)
    			{
    				
    				$scope.nodeNames[index].visible=false;
    				document.getElementById($scope.nodeNames[index].id).value = '';
    			}
        		document.getElementById(scope.nodeNames[0].id).value = '';
        		document.getElementById(scope.nodeNames[4].id).value = '';
        		vectorSrc.clear();
        		$scope.$apply();
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
                	
                	var newStation = new ol.Feature();
                	newStation.setStyle(iconStyle);
                	newStation.setGeometry(new ol.geom.Point(ol.proj.transform([place.geometry.location.D,place.geometry.location.k],'EPSG:4326','EPSG:3857')));
                	vectorSrc.addFeature(newStation);
                	if(vectorSrc.getFeatures().length > 1)
                		view.fitExtent(vectorLayer.getSource().getExtent(),map.getSize());
                	else
                		{view.setCenter(ol.proj.transform([place.geometry.location.D,place.geometry.location.k],'EPSG:4326','EPSG:3857'));
                		view.setZoom(7);}
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
            	for(var index =0;index<$scope.nodeNames.length;index++){
                	nodes.push(initSearch($scope.nodeNames[index].id));	
                }	
            });
            
            
            
            
            
        }]);


})();

