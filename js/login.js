(function(){
	var app = angular.module('loginmodule', []);

    app.controller("LoginController", ['$scope', '$window', function($scope, $window) {
    
    	$scope.pass = "";
    	
    	$scope.submitButton = function(){
    		if($scope.pass == "risk")
    			{
    				$window.location.href = 'route.html';
    			}
    	};
    	
    }]);

})();