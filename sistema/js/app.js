var app = angular.module("monedero",['controllers','services','ngRoute']);

app.run(function(){
	//console.log("app run");
});
app.directive('realTimeCurrency', function ($filter, $locale) {
    var decimalSep = $locale.NUMBER_FORMATS.DECIMAL_SEP;
    var toNumberRegex = new RegExp('[^0-9\\' + decimalSep + ']', 'g');
    var trailingZerosRegex = new RegExp('\\' + decimalSep + '0+$');
    var filterFunc = function (value) {
        return $filter('currency')(value);
    };

    function getCaretPosition(input){
        if (!input) return 0;
        if (input.selectionStart !== undefined) {
            return input.selectionStart;
        } else if (document.selection) {
            // Curse you IE
            input.focus();
            var selection = document.selection.createRange();
            selection.moveStart('character', input.value ? -input.value.length : 0);
            return selection.text.length;
        }
        return 0;
    }

    function setCaretPosition(input, pos){
        if (!input) return 0;
        if (input.offsetWidth === 0 || input.offsetHeight === 0) {
            return; // Input's hidden
        }
        if (input.setSelectionRange) {
            input.focus();
            input.setSelectionRange(pos, pos);
        }
        else if (input.createTextRange) {
            // Curse you IE
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    }

    function toNumber(currencyStr) {
        return parseFloat(currencyStr.replace(toNumberRegex, ''), 10);
    }

    return {
        restrict: 'A',
        require: 'ngModel',
        link: function postLink(scope, elem, attrs, modelCtrl) {
            modelCtrl.$formatters.push(filterFunc);
            modelCtrl.$parsers.push(function (newViewValue) {
                var oldModelValue = modelCtrl.$modelValue;
                var newModelValue = toNumber(newViewValue);
                modelCtrl.$viewValue = filterFunc(newModelValue);
                var pos = getCaretPosition(elem[0]);
                elem.val(modelCtrl.$viewValue);
                var newPos = pos + modelCtrl.$viewValue.length -
                                   newViewValue.length;
                if ((oldModelValue === undefined) || isNaN(oldModelValue)) {
                    newPos -= 3;
                }
                setCaretPosition(elem[0], newPos);
                return newModelValue;
            });
        }
    };
});
app.config(function($routeProvider){

	$routeProvider.when('/',{
		controller: 'mainCtrl',
		templateUrl: 'templates/login.html'
	})
	$routeProvider.when('/alertas',{
		controller: 'alertasCtrl',
		templateUrl: 'templates/alertas.html'
	})
	$routeProvider.when('/home',{
		controller: 'homeCtrl',
		templateUrl: 'templates/home.html'
	})
	$routeProvider.when('/altas',{
		controller: 'altasCtrl',
		templateUrl: 'templates/altas.html'
	})
  $routeProvider.when('/editar',{
    controller: 'editarCtrl',
    templateUrl: 'templates/editar.html'
  })
  $routeProvider.when('/buscar',{
    controller: 'buscarCtrl',
    templateUrl: 'templates/buscar.html'
  })
	$routeProvider.when('/bajas',{
		controller: 'bajasCtrl',
		templateUrl: 'templates/bajas.html'
	})
	$routeProvider.when('/reemplaza',{
		controller: 'reemplazarCtrl',
		templateUrl: 'templates/reemplazar.html'
	})
	$routeProvider.when('/registros',{
		controller: 'registrosCtrl',
		templateUrl: 'templates/registros.html'
	})
	$routeProvider.when('/usuarios',{
		controller: 'usuariosCtrl',
		templateUrl: 'templates/usuarios.html'
	})
	$routeProvider.when('/sucursales',{
		controller: 'sucursalesCtrl',
		templateUrl: 'templates/sucursales.html'
	})
	$routeProvider.when('/promociones',{
		controller: 'promocionesCtrl',
		templateUrl: 'templates/promociones.html'
	})
	$routeProvider.when('/configuraciones',{
		controller: 'configuracionesCtrl',
		templateUrl: 'templates/configuraciones.html'
	})
	$routeProvider.when('/configuraciones/parametros',{
		controller: 'alertaCtrl',
		templateUrl: 'templates/parametros.html'
	})
	$routeProvider.when('/configuraciones/ticket',{
		controller: 'ticketCtrl',
		templateUrl: 'templates/ticket.html'
	})
	.otherwise('/');
});
