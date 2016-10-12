var app = angular.module("services",[]);

app.service("token",function($window){
	var servicio = this;
	var monedero = {};

	servicio.set_monedero = function (monedero_param) {
		monedero = monedero_param;
	};

	servicio.get_monedero = function () {
		return monedero;
	};

	servicio.get_token = function(){
		return JSON.parse(localStorage.getItem("token_monedero")) || {};
	};

	servicio.set_token = function(token){
  		localStorage.setItem("token_monedero", JSON.stringify(token));
	}

});

app.service("servidor",function($http,token) {
	var servicio = this;

	servicio.servidor = "http://servidorzem.com/servidor";
	// servicio.servidor = "http://localhost:8080/";

	servicio.reemplaza_monedero = function(id_monedero,id_monedero_nuevo,clave,f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/reemplaza/' + id_monedero + '/' + id_monedero_nuevo + '/' + clave

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}
	servicio.elimina_promocion = function(id_promocion,password,f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/delete_promo/' + id_promocion + '/' + password

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}
	servicio.modifica_monedero = function(monedero,f){
		$http({
	  		method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},
		  	url: servicio.servidor + '/modifica_monedero/' + monedero.id_monedero + '/' + monedero.nombre + '/' + monedero.apellido_pat + '/' + monedero.apellido_mat + '/' + monedero.telefono + '/' + monedero.email + '/' + monedero.fecha_nacimiento

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}
	servicio.modifica_promocion = function(promocion,password,f){
		$http({

	  		method: 'POST',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/promociones/' + password,
		  	data: promocion

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}

	servicio.elimina_sucursal = function(id_sucursal,password,f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/delete_sucursal/' + id_sucursal + '/' + password

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}

	servicio.modifica_sucursal = function(sucursal,password,f){
		$http({

	  		method: 'POST',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/sucursales/' + password,
		  	data: sucursal

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}
	servicio.obten_sucursales = function(f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/sucursales'

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}
	servicio.elimina_usuario = function(id_usuario,password,f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/delete_user/' + id_usuario + '/' + password

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}
	servicio.modifica_usuario = function(usuario,password,f){
		$http({

	  		method: 'POST',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/usuarios/' + password,
		  	data: usuario

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}

	servicio.obten_usuarios = function(f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/usuarios'

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}

	servicio.registrar_usuario = function(nombre,apellido_paterno,password_usuario,admin,password,f){
		$http({

	  		method: 'POST',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/usuario/' + nombre + '/' + apellido_paterno + '/' + password_usuario + '/'+ admin +'/' + password

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};

	servicio.activa = function(monederos,password,f){
		$http({

	  		method: 'POST',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},


		  	url: servicio.servidor + '/activa/' + password + '/' + monederos

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};

	servicio.check = function(f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/check/'

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};


	servicio.get_alertas = function(f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/alertas/'

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
		};

	servicio.establece_parametro = function(parametro,f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/parametro/' + parametro

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });

	};
	servicio.establece_ticket = function(parametro,f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/ticket/' + parametro

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });

	};
	servicio.obten_parametro = function(f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/parametro/obten'

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });

	};
	servicio.obten_ticket = function(f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/ticket/obten'

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });

	};
	servicio.inserta_promocion = function(promocion,password,f){
		$http({

	  		method: 'POST',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/promocion/' + password,
		  	data: promocion

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};

	servicio.inserta_sucursal = function(id_sucursal,nombre_sucursal,direccion_sucursal,password,f){
		$http({

	  		method: 'GET',

	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/sucursal/0/' + nombre_sucursal + '/' + direccion_sucursal + '/' + password

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};

	servicio.get_transacciones = function(f){
		$http({
	  		method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},

		  	url: servicio.servidor + '/transacciones/'

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};
	servicio.obten_monederos = function (f) {
		$http({
	  		method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},
		  url: servicio.servidor + '/monederos/'

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}
	servicio.baja_monedero = function (id_monedero,password,f) {
		$http({
	  		method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},
		  url: servicio.servidor + '/bajamonedero/' + id_monedero + '/' + password

		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	}

	servicio.inserta_persona_monedero = function(persona,f){

		$http({
	  		method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},
		  url: servicio.servidor + '/persona/' + persona.nombre + '/' + persona.apellido_paterno + '/' + persona.apellido_materno + '/' + persona.telefono + '/' + persona.correo + '/' + persona.fecha_nacimiento + '/' + persona.id_monedero
		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};

	servicio.get_persona_monedero = function(id,f){
		$http({
	  		method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},
		  url: servicio.servidor + '/monedero/' + id
		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};

	servicio.set_monedero = function(ticket,id,monto,porcentaje,importe,nuevo_monto,f){
		var aux = (ticket != undefined) ? '/' + ticket: +'';
		$http({
	  		method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},
		  url: servicio.servidor + '/monedero/' + id + '/' + monto + '/' + porcentaje + '/'+ importe + '/' + nuevo_monto + '/' + aux
		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};

	servicio.get_promociones  =function(f){
		$http({
	  		method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},
		  url: servicio.servidor + '/promocion/'
		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};

	servicio.get_persona = function(f,id_persona){
		console.log(token.get_token().token);

		id_persona = id_persona || '';
		$http({
	  		method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/x-www-form-urlencoded ',
		   		'Accept':'application/json, text/plain, */*',
		   		'X-Auth-Token': token.get_token().token
	 		},
		  url: servicio.servidor + '/persona/' + id_persona
		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });

	};

	servicio.login = function(user,password,f){

		$http({
		  method: 'GET',
	   		headers: {
		   		'Content-Type': 'application/json',
		   		'Accept':'application/json, text/plain, */*',
	 		},
		  url: servicio.servidor + '/login/' + user + "/" + password
		}).then(function successCallback(response) {
		    f(response);
		  }, function errorCallback(response) {

		  		f(response);
		  });
	};


});
