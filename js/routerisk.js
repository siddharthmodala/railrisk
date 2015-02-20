(function() {
    var app = angular.module('routerisk', []);

    app.controller("RouteRiskController", ['$scope', '$http', function($scope, $http) {

        $scope.tankCarDesigns = [{name: 'Legacy DOT 111 (7/16 inch, no jacket)', value: 0.196},
                                 {name: 'Legacy DOT 111 (7/16 inch, jacket)', value: 0.085},
                                 {name: 'CPC-1232 (7/16 inch, with jacket)', value: 0.103},
                                 {name: 'CPC-1232 (1/2 inch, no jacket)', value: 0.046},
                                 {name: 'CPC-1232 (1/2 inch, with jacket)', value: 0.037}];
        $scope.noOfCars = 200;
        $scope.tankCarDesign = $scope.tankCarDesigns[0];
        $scope.trainSpeed = 45;
        $scope.annualTrainUnits = 20;
        $scope.risk = 0;
        $scope.releaseInterval =0
        $scope.routeLength = 0;
        $scope.routeData = null;
        $scope.routeInfo = [{p:{
        	consequence:'123',
        	miles:'123',
        	derailmentrate:'233',
        	fraarcid:'323',
        	segmentrisk:'0.23'
        }}
        ];
        $scope.nodeNames=[{displayName:'Origin',id:'origin',visible:true},
                          {displayName:'En-route Station 1',id:'onRoute1',visible:false},
                          {displayName:'En-route Station 2',id:'onRoute2',visible:false},
                          {displayName:'En-route Station 3',id:'onRoute3',visible:false},
                          {displayName:'En-route Station 4',id:'onRoute4',visible:false},
                          {displayName:'En-route Station 5',id:'onRoute5',visible:false},
                          {displayName:'Destination',id:'destination',visible:true}];
        var scope = $scope;
        var http = $http;
        var baseurl = "/geoserver/railroad/wms";
        var nodes = [];
        var extent =[-116.08019063893,22.89094998168,-66.271658797184,52.27135336056];
       	var callCount =0;
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
      	  		            	  html:'</br><p style="font-size:13px">Track legend</p>'+
      	  		            		  '<img style ="max-height:15em"src="/geoserver/railroad/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=railroad%3Atracks_main"/> '
      	  		              })
      	  		              ],
                	  url: baseurl,
                	  params: {'LAYERS': 'railroad:tracks_main'},
                	  serverType: 'geoserver'
                	})
          	});
        	
        	var popup = new ol.Overlay({
        		  element: document.getElementById('popup')
        		});
     	
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
			
        	var redStyle = new ol.style.Style({
    		    fill: new ol.style.Fill({
    		        color: 'rgba(255, 255, 255, 0.2)'
    		      }),
    		      stroke: new ol.style.Stroke({
    		        color: '#FF0000',
    		        width: 8
    		      })
    		    })
        	
			var routeLayer = new ol.layer.Vector({
				source:routeSource,
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
			
        	var map = new ol.Map({
        	  layers: [statebg,tracks,routeLayer],
        	  target: 'map',
        	  renderer:tempFunc.getRenderFromQueryString(),
        	  overlays:[overlay,popup],
        	  view: view
        	});

        	map.addControl(new ol.control.ScaleLine());
        	map.addControl(new ol.control.ZoomSlider());
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
        			    opacity: 0.99,
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
        	var closePopUP = function(){
        		vectorSrc.clear();
          	  	routeSource.clear();
          	  	$('#dialog').dialog('close');
          	  	$('#routeInfo').dialog('close');
        		scope.routeLength = 0;
        		scope.risk =0;
        		scope.releaseInterval =0;
        		 $scope.routeData =null;
        		 tracks.setOpacity(0.99);
        		for(var index =1;index<scope.nodeNames.length-1;index++)
        			{
        				
        				scope.nodeNames[index].visible=false;
        				document.getElementById(scope.nodeNames[index].id).value = '';
        			}
        		document.getElementById(scope.nodeNames[0].id).value = '';
        		document.getElementById(scope.nodeNames[6].id).value = '';
        		scope.$apply();
        		return false;
        	}
        	
            $scope.clearRoute = closePopUP;
            
            $scope.calculateRisk = function(){
            	
            	if($scope.validateCalc())
            		{
            			var lastVisible = nodes[0];
            			for(var index =1; index < $scope.nodeNames.length;index++){
            				if($scope.nodeNames[index].visible){
            						callCount+=1; // keep a count of the number of ajax call made so far
           							$scope.calculateSubRisk(lastVisible,nodes[index])
            						lastVisible = nodes[index];
            					}
            			}

            		}
           }
            
            $scope.calculateSubRisk = function(src,dest,lastCall)
            {
            	var viewparams = [
    		        		      'x1:' + src.getPlace().geometry.location.D, 'y1:' + src.getPlace().geometry.location.k,
    		        		      'x2:' + dest.getPlace().geometry.location.D, 'y2:' + dest.getPlace().geometry.location.k
    		        		    ];
    		        		               		        		    
    		        		    var featureurl = "/geoserver/railroad/ows?service=WFS&version=1.3.0&request=GetFeature" +
    		        		    				 "&typeName=railroad:pgroute_main&outputFormat=application/json&viewparams="+viewparams.join(';');
    		        		    http.get(featureurl).success(function(data){
    		        		    	
    		        		    	if(data!=null)
    		        		    		{
    		        		    			var L,Z,P,D,C,segmentrisk;
    		        		    			for(var i =0; i< data.features.length;i++)
    		        		    				{
    		        		    				 	 L = parseFloat(data.features[i].properties.miles);
    		        		    				 	 Z = parseFloat(data.features[i].properties.derailmentrate);
    		        		    				 	 C = parseFloat(data.features[i].properties.consequence);
    		        		    				 	 P = scope.tankCarDesign.value * scope.trainSpeed / 26; // 26 is the avg train speed on any line
    		        		    				 	 D = 0.1 * scope.noOfCars * scope.trainSpeed / 26; // 0.1 is to accomodate 10% OF THE cars derailed
    		        		    				 	 segmentrisk = Z * L * (1 - Math.pow((1 - P), D)) * C;
    		        		    				 	 data.features[i].properties.segmentrisk = segmentrisk;
    		        		    				 	scope.risk += segmentrisk;
    		        		    				 	scope.routeLength += L;      		    				
    		        		    				}
    		        		    			
    		        		    			
    		            	                
    		        		    			if(scope.routeData == null)
    		        		    			{
    		        		    				scope.routeData = data;
    		        		    			}
    		        		    			else
    		        		    			{
    		        		    					scope.routeData.features = scope.routeData.features.concat(data.features);
		    		        		    			scope.routeData.totalFeatures = scope.routeData.features.length;
    		        		    			}
    		        		    			callCount-=1; // counter which maintains the number of ajax calls that were made.
    		        		    			if(callCount == 0) // when this is the last ajax call 
    		        		    			{
    		        		    				scope.releaseInterval = 1/(scope.risk * scope.annualTrainUnits);
    		        		    				
	    		                    			document.getElementById('riskcontent').innerHTML = parseFloat(scope.risk).toExponential(2);
	    		            	                document.getElementById('intervalcontent').innerHTML = parseFloat(scope.releaseInterval).toFixed(2);//.toExponential(2);
	    		            	                document.getElementById('routeLength').innerHTML =numberWithCommas(parseFloat(scope.routeLength).toFixed(1));
	    		            	                $('#dialog').dialog('open');
	    		            	                
	    		        		    			popup.setPosition(ol.proj.transform([dest.getPlace().geometry.location.D,dest.getPlace().geometry.location.k],'EPSG:4326','EPSG:3857'));
	    		        		    			//data.totalFeatures = data.features.length;
	    		        		    			
	    		        		    			var geoData = new ol.format.GeoJSON().readFeatures(scope.routeData,{'featureProjection':'EPSG:3857'});
	    		        		    			
	    		        		    			geoData.sort(function(a,b){
	    		        		    				return (b.p.segmentrisk - a.p.segmentrisk);
	    		        		    			});
	    		        		    			
	    		        		    			var subRisk = scope.risk * 0.8;
	    		        		    			var tempSum = 0;
	    		        		    			var tempBody ='';
	    		        		    			for(var i=0; i<geoData.length; i++)
	    		        		    				{
	    		        		    					if(tempSum < subRisk)
	    		        		    						{
	    		        		    							tempSum += geoData[i].p.segmentrisk;
	    		        		    							geoData[i].setStyle(redStyle);
	    		        		    						}
	    		        		    					tempBody = tempBody +'<tr><td>'+geoData[i].p.fraarcid+'</td><td>'+geoData[i].p.miles+'</td><td>'+geoData[i].p.derailmentrate+'</td><td>'+geoData[i].p.consequence+'</td><td>'+geoData[i].p.segmentrisk+'</td></tr>';
	    		        		    				}
	    		        		    			document.getElementById('routeInfoBody').innerHTML =tempBody;
	    		        		    			routeSource.addFeatures(geoData);
	    		        		    			tracks.setOpacity(0.35);
	    		        		    			$('#routeInfo').dialog('open');
    		        		    		}
    		        		    			
    		        		    		}
    		        		    }).error(function(data){
    		        		    	alert('Error calculating route risk');
    		        		    });  		    
            	
            }
            
       	 $('#dialog').dialog({
 		 	autoOpen: false,
 		 	dialogClass:"dialog1",
         	position: { my: "left top", at: "left top", of: $('#mapdiv') },
         	close:closePopUP
         	
         });
       	 
       	 $('#routeInfo').dialog({
  		 	autoOpen: false,
  		 	dialogClass:"routeInfo",
  		 	height: 300,
  		 	width:550,
          	position: { my: "right bottom", at: "right bottom", of: $('#mapdiv') },
          	close:function(){
          			$('#routeInfo').dialog('close');
          		}
          	
          	
          });
            
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
        			alert('Only five on route stations are allowed.');
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
        	
        	
        	var infoDivState = false;
        	
        	$scope.toggleInfoDiv = function(){
        		var horizontalDiv = $('#InfoDiv');
        		var mapdiv = $('#mapdiv');
    			var dirIcon = $('#hdirectionIcon');
    			horizontalDiv.hide();
    			//horizontalDiv.css('margin-bottom',-$(this).width());
    			
        		
        	}
        	$scope.toggleInfoDiv();
        	
        	function numberWithCommas(x) {
        	    var parts = x.toString().split(".");
        	    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        	    return parts.join(".");
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
                	var newStation = new ol.Feature();
                	newStation.setStyle(iconStyle);
                	newStation.setGeometry(new ol.geom.Point(ol.proj.transform([place.geometry.location.D,place.geometry.location.k],'EPSG:4326','EPSG:3857')));
                	vectorSrc.addFeature(newStation);
                	if(vectorSrc.getFeatures().length > 1)
                		view.fitExtent(vectorLayer.getSource().getExtent(),map.getSize());
                	else
                		{view.setCenter(ol.proj.transform([place.geometry.location.D,place.geometry.location.k],'EPSG:4326','EPSG:3857'));
                		view.setZoom(7);}

              });
              return autocomplete;
            } // End of InitSearch

            angular.element(document).ready(function(){
            	for(var index =0;index<$scope.nodeNames.length;index++){
                	nodes.push(initSearch($scope.nodeNames[index].id));	
                }	
            });
            
            console.log($scope.routeInfo);
            
            
            
        }]);


})();

