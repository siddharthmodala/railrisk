(function() {
    var app = angular.module('routerisk', ['ngGrid']);

    app.controller("RouteRiskController", ['$scope', '$http', function($scope, $http) {

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
        $scope.riskComp = 0; // with out consequence component used in calc. release interval.
        $scope.releaseInterval =0
        $scope.routeLength = 0;
        $scope.routeData = null;
        $scope.showloader = false;
        $scope.routeInfo = [];
        $scope.tankCarDesignSplit = false;
        $scope.minimizetankCarDesignSplit = false;

        $scope.nodeNames=[{displayName:'Origin',id:'origin',visible:true,showcross:false,placeid:null},
                          {displayName:'En-route Station 1',id:'onRoute1',visible:false,showcross:true,placeid:null},
                          {displayName:'En-route Station 2',id:'onRoute2',visible:false,showcross:true,placeid:null},
                          {displayName:'En-route Station 3',id:'onRoute3',visible:false,showcross:true,placeid:null},
                          {displayName:'En-route Station 4',id:'onRoute4',visible:false,showcross:true,placeid:null},
                          {displayName:'En-route Station 5',id:'onRoute5',visible:false,showcross:true,placeid:null},
                          {displayName:'Destination',id:'destination',visible:true,showcross:false,placeid:null}];
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
        	
     	
        	var view = new ol.View({
        		//center: [-97, 38],
        		center: [-11132436.5045,4866153.7734],
//        		projection: "EPSG:4326",
//              maxResolution: 0.3561261015634373,
        	  zoom:5,
        	  minZoom:3,
        	  maxZoom:14
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
        	
        	var blueStyle = new ol.style.Style({
    		    fill: new ol.style.Fill({
    		        color: 'rgba(255, 255, 255, 0.2)'
    		      }),
    		      stroke: new ol.style.Stroke({
    		        color: '#1995dc',
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
        	
        	var routeHighlightSrc = new ol.source.Vector({
        		features: []
        	});
        	
        	var routeHighlightLayer = new ol.layer.Vector({
        		source: routeHighlightSrc,
        		style:blueStyle
        	});
			
        	var map = new ol.Map({
        	  layers: [statebg,tracks,routeLayer,routeHighlightLayer],
        	  target: 'map',
        	  renderer:tempFunc.getRenderFromQueryString(),
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
        	var highlightFeature = null;
        	var oldhighlightedStyle = null;
        	
        	var closePopUP = function(){
          	  	routeSource.clear();
          	  	$('#dialog').dialog('close');
          	  	$('#segInfo').dialog('close');
        		scope.routeLength = 0;
        		scope.risk =0;
        		scope.riskComp =0;
        		scope.releaseInterval =0;
        		$scope.routeData =null;
        		highlightFeature = null;
            	oldhighlightedStyle = null;
        		tracks.setOpacity(0.99);
        		$scope.routeInfo = [];
        		//document.getElementById('routeInfoBody').innerHTML ='';
        		callCount =0;
        		scope.showloader = false;
        		//scope.$apply();
        		return false;
        	}
        	
            $scope.clearAll= function(){
            	closePopUP();
            	$scope.clearStations();
        		$scope.tankCarDesignSplit = false;
        		$scope.minimizetankCarDesignSplit = false;
        		for(var i =0 ; i < $scope.tankCarDesigns.length; i++)
        			{
        				$scope.tankCarDesigns[i].carCount = 0;
        			}
            };
            
            map.on('singleclick',function(evt){
            	var feature = map.forEachFeatureAtPixel(evt.pixel,function(feature,layer){
            		//console.log(feature);
            		if(feature.getId().indexOf('pgroute') > -1)
            			return feature;
            		
            	});

            	if(feature)
            	{
            		scope.openSegmentInfoDialog(feature);
            		 angular.forEach($scope.routeInfo, function(data, index){
            			 if(data.fraarcid  == feature.getProperties().fraarcid){
            	                $scope.gridOptions.selectItem(index, true);
            	            }
            		 });
            	}
            	map.updateSize();
            });
            
            $scope.openSegmentInfoDialog = function(feature)
            {
            	if(highlightFeature)
            	{
            		highlightFeature.setStyle(oldhighlightedStyle);
            		highlightFeature = null;
            	}
        		oldhighlightedStyle = feature.getStyle();
        		highlightFeature = feature;
        		feature.setStyle(blueStyle);
                document.getElementById('segriskcontent').innerHTML = parseFloat(feature.j.segmentrisk).toExponential(2);
                document.getElementById('segintervalcontent').innerHTML =numberWithCommas( parseFloat(feature.j.releaseInterval).toFixed(1));
                document.getElementById('segmentlength').innerHTML =parseFloat(feature.j.miles).toFixed(1);
                $('#segInfo').dialog('open');
            }
            
            
            $scope.routeInfoClick = function(index)
            {
            	featureList = routeSource.getFeatures();
            	if(featureList)
            	{
            		for(var i =0; i<featureList.length; i++)
            		{
 						if($scope.routeInfo[index].fraarcid == featureList[i].j.fraarcid)
 						{
 							$scope.openSegmentInfoDialog(featureList[i]);
 							return;
 						}           		
            		}
            	}
            }
            
            $scope.selectionChange = function (rowItem) {
	            if (rowItem.selected)  {  
	            	featureList = routeSource.getFeatures();
	            	if(featureList)
	            	{
	            		for(var i =0; i<featureList.length; i++)
	            		{
	 						if(rowItem.entity.fraarcid == featureList[i].j.fraarcid)
	 						{
	 							$scope.openSegmentInfoDialog(featureList[i]);
	 							return;
	 						}           		
	            		}
	            	}
	            } 
	        }
            
            $scope.gridOptions = { 
    		        data: 'routeInfo',
    		        multiSelect:false,
    		        enableColumnResize:true,
    				afterSelectionChange: $scope.selectionChange,
            		columnDefs: [{field:'fraarcid', displayName:'FRAARCID'},
            		{field:'stateab', displayName:'State'},
            		{field:'sigsys', displayName:'Signal'},
            		{field:'subdiv', displayName:'Sub-Division'},
            		{field:'rrowner', displayName:'Track Owner'},
            		{field:'miles', displayName:'Segment Milage'},
            		{field:'densitypermile', displayName:'Population Density per Sq.Mile'},
            		{field:'segmentrisk', displayName:'Annual Segment Risk'},
            		{field:'releaseInterval', displayName:'Interval Between Years'}]
            	};
            
            $scope.calculateRisk = function(){
            	
            	if($scope.validateCalc())
            		{
            			closePopUP();
            			$scope.showloader = true;
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
    		        		    			var L,Z,P,D,C,subsegrisk;
    		        		    			for(var i =0; i< data.features.length;i++)
    		        		    				{
    		        		    				 	 L = parseFloat(data.features[i].properties.miles);
    		        		    				 	 Z = parseFloat(data.features[i].properties.derailmentrate);
    		        		    				 	 C = parseFloat(data.features[i].properties.consequence);
    		        		    				 	 if(scope.tankCarDesignSplit)
    		        		    					 {
    		        		    				 		 P=0;
    		        		    				 		 D=0;
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
    		        		    				 	 
    		        		    				 	subsegrisk = Z * L * (1 - Math.pow((1 - P), D)) ;
    		        		    				 	data.features[i].properties.segmentrisk = subsegrisk *C;
    		        		    				 	data.features[i].properties.releaseInterval= 1/(subsegrisk * scope.annualTrainUnits);
    		        		    				 	data.features[i].properties.densitypermile= C / 0.785; // area per sq. mile
    		        		    				 	scope.risk += subsegrisk * C;
    		        		    				 	scope.riskComp +=subsegrisk;
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
    		        		    				scope.releaseInterval = 1/(scope.riskComp * scope.annualTrainUnits);
    		        		    				
	    		                    			document.getElementById('riskcontent').innerHTML = parseFloat(scope.risk).toExponential(2);
	    		            	                document.getElementById('intervalcontent').innerHTML = numberWithCommas(parseFloat(scope.releaseInterval).toFixed(1));//.toExponential(2);
	    		            	                document.getElementById('routeLength').innerHTML =numberWithCommas(parseFloat(scope.routeLength).toFixed(1));
	    		            	                $('#dialog').dialog('open');
	    		            	                
	    		        		    			//popup.setPosition(ol.proj.transform([dest.getPlace().geometry.location.D,dest.getPlace().geometry.location.k],'EPSG:4326','EPSG:3857'));
	    		        		    			//data.totalFeatures = data.features.length;
	    		        		    			 		        		    				    		 
	    		        		    			var geoData = new ol.format.GeoJSON().readFeatures(scope.routeData,{'featureProjection':'EPSG:3857'});
	    		        		    			//scope.routeInfo = geoData;
	    		        		    			geoData.sort(function(a,b){
	    		        		    				return (b.j.segmentrisk - a.j.segmentrisk);
	    		        		    			});
	    		        		    			
	    		        		    			var subRisk = scope.risk * 0.8;
	    		        		    			var tempSum = 0;
	    		        		    			var tempBody ='';
	    		        		    			$scope.routeInfo  = [];
	    		        		    			var tempInfoVar = {};
	    		        		    			for(var i=0; i<geoData.length; i++)
	    		        		    				{
	    		        		    					if(tempSum < subRisk)
	    		        		    						{
	    		        		    							tempSum += geoData[i].j.segmentrisk;
	    		        		    							geoData[i].setStyle(redStyle);
	    		        		    						}
	    		        		    					tempInfoVar.fraarcid = geoData[i].j.fraarcid;
	    		        		    					tempInfoVar.stateab = geoData[i].j.stateab;
	    		        		    					tempInfoVar.sigsys = (geoData[i].j.sigsys?geoData[i].j.sigsys:'') ;
	    		        		    					tempInfoVar.subdiv = (geoData[i].j.subdiv?geoData[i].j.subdiv:'');
	    		        		    					tempInfoVar.rrowner = geoData[i].j.rrowner;
	    		        		    					tempInfoVar.miles =parseFloat(geoData[i].j.miles).toFixed(1) ;
	    		        		    					tempInfoVar.densitypermile = parseFloat(geoData[i].j.densitypermile).toFixed(1);
	    		        		    					tempInfoVar.segmentrisk = parseFloat(geoData[i].j.segmentrisk).toExponential(2);
	    		        		    					tempInfoVar.releaseInterval = numberWithCommas(parseFloat(geoData[i].j.releaseInterval).toFixed(1)) ;
	    		        		    					
	    		        		    					/*tempBody = tempBody +'<tr><td>'+geoData[i].j.fraarcid+'</td><td>'
	    		        		    					+geoData[i].j.stateab+'</td><td>'
	    		        		    					+(geoData[i].j.sigsys?geoData[i].j.sigsys:'') +'</td><td>'
	    		        		    					+(geoData[i].j.subdiv?geoData[i].j.subdiv:'') +'</td><td>'
	    		        		    					+geoData[i].j.rrowner+'</td><td>'
	    		        		    					+parseFloat(geoData[i].j.miles).toFixed(1) +'</td><td>'
	    		        		    					+parseFloat(geoData[i].j.densitypermile).toFixed(1)+'</td><td>'
	    		        		    					+parseFloat(geoData[i].j.segmentrisk).toExponential(2)+'</td><td>'
	    		        		    					+numberWithCommas(parseFloat(geoData[i].j.releaseInterval).toFixed(1)) +'</td></tr>';*/
	    		        		    					$scope.routeInfo.push(tempInfoVar);
	    		        		    					tempInfoVar = {};
	    		        		    				}
	    		        		    			//document.getElementById('routeInfoBody').innerHTML =tempBody;
	    		        		    			//$('#routeInfo').dialog('open');
	    		        		    			routeSource.addFeatures(geoData);
	    		        		    			tracks.setOpacity(0.35);
	    		        		    			$scope.showloader = false;
    		        		    		}
    		        		    			
    		        		    		}
    		        		    }).error(function(data){
    		        		    	alert('Error calculating route risk');
    		        		    	$scope.showloader = false;
    		        		    });  		    
            	
            }
            
       	 $('#dialog').dialog({
 		 	autoOpen: false,
 		 	dialogClass:"dialog1 no-close",
         	position: { my: "left top", at: "left top", of: $('#mapdiv') },
          	buttons:{"Close":function(){
      			$('#dialog').dialog('close');
      		}}
         });
       	 
       	 $('#segInfo').dialog({
  		 	autoOpen: false,
  		 	dialogClass:"segInfo no-close",
          	position: { my: "right bottom", at: "right bottom", of: $('#mapdiv') },
          	buttons:{"Close":function(){
                	if(highlightFeature)
                	{
                		highlightFeature.setStyle(oldhighlightedStyle);
                		highlightFeature = null;
                	}
          			$('#segInfo').dialog('close');
          		}}
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
            	if($scope.tankCarDesignSplit){
            		var sum =0;
            		for(var i =0 ; i < $scope.tankCarDesigns.length; i++)
        			{
        				sum += parseInt(scope.tankCarDesigns[i].carCount);
        			}
            		if (sum != $scope.noOfCars)
            			{
            			alert('Total number of cars in Tank car design split should be equal to number of cars per unit train .');
            			return false;
            			}
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
        		vectorSrc.clear();
        		for(var index =0;index<scope.nodeNames.length;index++)
    			{
        			document.getElementById(scope.nodeNames[index].id).value = '';
    				scope.nodeNames[index].placeid = null;
    				if(index>0 && index <6)
    				{
    					scope.nodeNames[index].visible=false;
    				}
    			}
            }
            
            $scope.closeStation = function(currentNode,ind){            	
            	if(currentNode.placeid)
            	{
            		vectorSrc.removeFeature(vectorSrc.getFeatureById(currentNode.placeid));
            		if(vectorSrc.getFeatures().length > 1)
            			view.fitExtent(vectorLayer.getSource().getExtent(),map.getSize());
            	}
               	currentNode.visible = false;
               	currentNode.placeid = null;
            	document.getElementById(currentNode.id).value = '';
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
        			mapdiv.removeClass('col-sm-12 col-md-12').addClass('col-sm-8 col-sm-offset-4 col-md-9 col-md-offset-3',500,updatemap);
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
        		var InfoDiv = $('#InfoDiv');
        		var mapdiv = $('#mapdiv');
    			var dirIcon = $('#hdirectionIcon');
    			if(infoDivState){
    					mapdiv.addClass('map-up',500,updatemap);
    					dirIcon.removeClass().addClass('glyphicon glyphicon-menu-down');
    			}
    			else{
    				mapdiv.removeClass('map-up',500,updatemap);
					dirIcon.removeClass().addClass('glyphicon glyphicon-menu-up');
    			}
    			InfoDiv.toggle('slide',{},500);
    			infoDivState = !infoDivState;
    			function updatemap(){
    				map.updateSize();
    			}
    			//horizontalDiv.css('margin-bottom',-$(this).width());
        	}
        	
        	$scope.toggleCarDesign = function()
        	{
        		$scope.tankCarDesignSplit = !$scope.tankCarDesignSplit;
        	};
        	
        	$scope.minimizeCarDesignSplit  = function(){
        		$scope.minimizetankCarDesignSplit = !$scope.minimizetankCarDesignSplit;
        	}
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
              
             google.maps.event.addListener(autocomplete, 'place_changed', function(a,b) {
            	
                var place = autocomplete.getPlace();
                if (!place.geometry) {
                  return;
                }   
                
                var ind;
                for (ind = 0; ind < nodes.length; ind++)
                {
           		 	if(nodes[ind] == autocomplete)
           		 		break;
           		 }
                
                	var newStation = new ol.Feature();
                	newStation.setStyle(iconStyle);
                	newStation.setId(place.place_id);
                	newStation.setGeometry(new ol.geom.Point(ol.proj.transform([place.geometry.location.D,place.geometry.location.k],'EPSG:4326','EPSG:3857')));
                	if(ind < nodes.length && scope.nodeNames[ind].placeid)
                    {
                    	vectorSrc.removeFeature(vectorSrc.getFeatureById(scope.nodeNames[ind].placeid));
                    }
                	scope.nodeNames[ind].placeid = place.place_id;
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
            	map.updateSize();
            	for(var index =0;index<$scope.nodeNames.length;index++){
                	nodes.push(initSearch($scope.nodeNames[index].id));	
                }
            	$scope.toggleInfoDiv();
            });
            
           // console.log($scope.routeInfo);
            
            
            
        }]);


})();

