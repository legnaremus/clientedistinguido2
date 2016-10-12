  var pg = require('pg');
  var restify = require('restify');
  var fs = require('fs');

  var server = restify.createServer();

  var conString = "postgres://postgres:samael@localhost/Monedero";

	var client_v;

	var elementos_por_pagina = 150;

  var tiempo_login = 60;

  var llaves = function(){
    var este = this;
    var llaves_arreglo = [];
    este.agregar_llave = function(llave){
      llaves_arreglo.push(llave);
    };
    este.existe_llave  = function(llave){
      for (i = 0; i < llaves_arreglo.length; i++){

        if (llaves_arreglo[i].llave == llave){
          llaves_arreglo[i].contador = 0;
          return llaves_arreglo[i];
        }
      }
      return null;
    };
    este.borra_llave = function(llave){
      for (i = 0; i < llaves_arreglo.length;i++){
        if (llaves_arreglo[i].llave == llave){
          llaves_arreglo.splice(i,1);
          return;
        }
      }
    }
  };

  var llaves_existentes = new llaves();
function genera_llave()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 10; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

	var llave = function(llave,id_usuario,nombre_sucursal,password,id_sucursal,id_negocio){
		var este = this;
		este.llave = llave;
    este.contador = 0;
    este.id_sucursal = id_sucursal;
    este.nombre_sucursal = nombre_sucursal;
    este.password = password;
    este.id_usuario = id_usuario;
    este.id_negocio = id_negocio;
		este.intervalo = setInterval(function(){
			este.contador++;

         var fecha_js = new Date();
         //console.log(este.nombre_sucursal+" "+este.contador);
      if (este.contador >= tiempo_login * 60){
        llaves_existentes.borra_llave(este.llave);
        clearInterval(este.intervalo);
      }

		},1000);

    llaves_existentes.agregar_llave(este);
	};


  var data_base = function(){

    var execute_query = function(query,f){
      var fecha_js = new Date();
       //fs.appendFile('/home/legnaremus/log.txt','\n#---------'+fecha_js+'-------------->\n  '+query);
       client_v.query(query, function(err, result) {
          console.log(query);
          if(err) {
            //fs.appendFile('/home/legnaremus/log.txt',"\n  error running query "+err);
            console.error('error running query', err);
            f(400);
            return;
          }else{
            f(result.rows);
          }

        });

    };

    var limpia_query = function(query,campos){
      for (i = 0;i < campos.length;i++){
        query = query.replace("!" +campos[i] + "!","");
      }
      return query;
    };

    var insert_persona_monedero = function(query){

      return function(req,res,next){
          var query_final = "";
          res.setHeader('Access-Control-Allow-Origin','*');

          var llave =  req.headers['x-auth-token'] || '';

          var sucursal = llaves_existentes.existe_llave(llave);

          if (sucursal == null){
              console.log("llave no existe");
              res.send(401,"No autorizado");
              next();
          }else{
            query_final = query;
            //query_final = query.replace('!nombre_sucursal!',nombre_sucursal );

            if (req.params['nombre']){
                query_final = query_final.replace('!nombre!',req.params['nombre']);

            }
            if (req.params['apellido_pat']){

                query_final = query_final.replace('!apellido_pat!',req.params['apellido_pat']);
            }

            if (req.params['apellido_mat']){

                query_final = query_final.replace('!apellido_mat!',req.params['apellido_mat']);
            }

            if (req.params['telefono']){

                query_final = query_final.replace('!telefono!',req.params['telefono']);
            }
            if (req.params['email']){

                query_final = query_final.replace('!email!',req.params['email']);
            }
            if (req.params['fecha_nacimiento']){

                query_final = query_final.replace('!fecha_nacimiento!',req.params['fecha_nacimiento']);
            }
            query_final = limpia_query(query_final,['nombre','apellido_pat','apellido_mat','telefono','email','fecha_nacimiento']);

            console.log(req.params);

            execute_query(query_final,function(todos){
              console.log(todos);

              var id_persona = todos[0].id_persona;

              var query2 = 'INSERT INTO "Monedero"(id_monedero,id_persona_cliente, fecha_activacion, estado_activado) VALUES (!id_monedero!,!id_persona!,'   + "'" +  new Date()+ "'"  +' ,1) returning id_monedero';
              query2 = query2.replace('!id_persona!',id_persona);
              query2 = query2.replace('!id_sucursal!',sucursal.id_sucursal);
              query2 = query2.replace('!id_monedero!', req.params['id_monedero']);

              execute_query(query2,function(todos){

                  var id_monedero = todos[0].id_monedero;

                  var query3  = 'INSERT INTO "Monedero_negocio"(id_monedero,id_negocio,monto) VALUES (!id_monedero!,!id_negocio!,0)';
                  query3 = query3.replace('!id_monedero!',id_monedero);
                  query3 = query3.replace('!id_negocio!',sucursal.id_negocio);

                  execute_query(query3,function(todos){

                    console.log(todos);
                    res.send(todos);
                    next();
                  });
              });

            });
          }
      }
    };


  var inserta_sucursal = function(query){

      return function(req,res,next){
          var query_final = "";

          var llave =  req.headers['x-auth-token'] || '';

          var sucursal = llaves_existentes.existe_llave(llave);

          if (sucursal == null){
              console.log("llave no existe");
              res.send(401,"No autorizado");
              next();
          }else{

            var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario)';
            query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
            query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );

            var ok = false;

            execute_query(query_ad,function(todos){
              var usuarios = todos;
              for (i = 0; i < usuarios.length;i++){
                if (usuarios[i].password == req.params['password']){
                  ok = true;
                  break;
                }
              }
              if (!ok){
                console.log("usuario no existe");
                res.send(402,"No autorizado");
                next();
                return;
              }

              var nombre_sucursal = sucursal.nombre_sucursal;

              query_final = query;

              if (req.params['direccion']){
                  query_final = query_final.replace('!direccion!',req.params['direccion']);
              }

              if (req.params['nombre']){
                  query_final = query_final.replace('!nombre!',req.params['nombre']);
              }

              if (req.params['id']){
                  query_final = query_final.replace('!id_sucursal!',req.params['id']);
              }

              console.log(req.params);


            var query_negocio = 'select "Sucursal".id_negocio from "Sucursal" where "Sucursal".id_sucursal = ' + sucursal.id_sucursal;

            execute_query(query_negocio,function (todos){

                query_final = query_final.replace('!id_negocio!',todos[0].id_negocio);

                execute_query(query_final,function (todos){

                  console.log(todos);
                  res.send(todos);
                  next();

                });

            });

          });

      }
    }
    };

    var modifica_usuario = function (query){

      return function(req,res,next){

          var query_final = "";

          res.setHeader('Access-Control-Allow-Origin','*');

          var llave =  req.headers['x-auth-token'] || '';

          var sucursal = llaves_existentes.existe_llave(llave);

          if (sucursal == null){
              console.log("llave no existe");
              res.send(401,"No autorizado");
              next();
          }

          console.log(req.params);

          var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ( ("Sucursal_admin".id_sucursal = "Sucursal".id_sucursal and "Sucursal_admin".id_administrador = "Usuario".id_usuario and "Usuario".tipo_usuario = 2) or ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario))';
          query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
          query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );

          var ok = false;

          execute_query(query_ad,function(todos){

            var usuarios = todos;
            for (i = 0; i < usuarios.length;i++){
              if (usuarios[i].password == req.params['password']){

                ok = true;
                break;
              }
            }
            if (!ok){
              console.log("usuario no existe");
              res.send(402,"No autorizado");
              next();
              return;
            }

            o = JSON.parse(Object.keys(req.params)[1]);

            query_final = query;
            query_final = query_final.replace('!nombre!',o.nombre);
            query_final = query_final.replace('!apellido_pat!',o.apellido_pat);
            query_final = query_final.replace('!id_persona!',o.id_persona);

            execute_query(query_final,function (todos) {

              var query_final2 = 'update "Usuario" set tipo_usuario = '+ o.tipo_usuario +' ,password = ' +  "'"+ o.password + "'"+ ' where ' + '"Usuario".id_usuario = ' + o.id_usuario ;

              execute_query(query_final2,function (todos){
                console.log(todos);
                res.send(200);
              });

          });
            //var query = 'update "Persona" set nombre =  ' + "'!nombre!',apellido_pat = '!apellido_pat!' where " + '"Persona".id_persona = !id_persona!' ;
        });

      }

  };

    var baja_monedero = function(query){

      return function(req,res,next){
          var query_final = "";
          res.setHeader('Access-Control-Allow-Origin','*');

          var llave =  req.headers['x-auth-token'] || '';

          var sucursal = llaves_existentes.existe_llave(llave);

          if (sucursal == null){
              console.log("llave no existe");
              res.send(401,"No autorizado");
              next();
          }else{

            var nombre_sucursal = sucursal.nombre_sucursal;

            query_final = query.replace('!nombre_sucursal!',nombre_sucursal );

            if (req.params['monto']){
                query_final = query_final.replace('!monto!',req.params['monto']);
            }

            if (req.params['id']){

                query_final = query_final.replace('!id!',req.params['id']);

            }

          }

          execute_query(query_final,function (todos){

            console.log(todos);

            res.send(todos);
            next();
          });

      }

    };

    var get_query = function(query){
      return function(req,res,next){
          res.setHeader('Access-Control-Allow-Origin','*');

          var query_final = "";

          var llave =  req.headers['x-auth-token'] || '';

          var sucursal = llaves_existentes.existe_llave(llave);

          if (sucursal == null){

              console.log("llave no existe");
              res.send(401,"No autorizado");
              next();
          }else{

            if (req.params['password']){
              if (req.params['password'] != sucursal.password){
                  res.send(402,"No autorizado");
                  next();
              }
            }

            var nombre_sucursal = sucursal.nombre_sucursal;

            query_final = query.replace('!id_sucursal!',sucursal.id_sucursal);


            query_final = query_final.replace('!nombre_sucursal!',nombre_sucursal );

            query_final = query_final.replace('!id_negocio!',sucursal.id_negocio );

            if (req.params['nuevo_monto']){
                query_final = query_final.replace('!nuevo_monto!',req.params['nuevo_monto']);
            }

            if (req.params['monto']){
                query_final = query_final.replace('!monto!',req.params['monto']);
            }

            if (req.params['id']){
                query_final = query_final.replace('!id!',req.params['id']);
            }

            if (req.params['porcentaje']){
                query_final = query_final.replace('!porcentaje!',req.params['porcentaje']);
            }

            if (req.params['descripcion']){

                query_final = query_final.replace('!descripcion!',req.params['descripcion']);

            }
            if (req.params['nombre']){

                query_final = query_final.replace('!nombre!',req.params['nombre']);
            }
          }

          query_final = limpia_query(query_final,['id_sucursal']);
          execute_query(query_final,function(todos){

            if (req.params['monto']){

              query3 = 'select parametro_alerta from "Sucursal" where "Sucursal".id_sucursal = !id_sucursal!';
              query3 = query3.replace('!id_sucursal!',sucursal.id_sucursal);

              execute_query(query3,function(todos) {

                console.log(todos.length + " " + todos.length);

                var alerta = 0;
                console.log("monto a agregar: " + (req.params['nuevo_monto']-req.params['monto']));
                if ((req.params['monto'] > 0 ) &&(req.params['nuevo_monto']-req.params['monto'])>= todos[0].parametro_alerta && todos[0].parametro_alerta >0){
                  alerta = 1;
                  console.log("alerta");
                }

                var query2;

                if (req.params['ticket'] == undefined || req.params['ticket'] == ''){
                  query2 = 'INSERT INTO "Transaccion"(id_monedero, id_sucursal, id_usuario, fecha_transaccion, monto,alerta,porcentaje) VALUES(!id!, !id_sucursal!, !id_usuario!,'  + "'" +  new Date()+ "'" + ' , !monto!, ' + alerta + ' ,!porcentaje!) returning id_transaccion';
                }else{
                  query2 = 'INSERT INTO "Transaccion"(id_monedero, id_sucursal, id_usuario, fecha_transaccion, monto,alerta,porcentaje,ticket) VALUES(!id!, !id_sucursal!, !id_usuario!,'  + "'" +  new Date()+ "'" + ' , !monto!, ' + alerta + ' , !porcentaje!,'+req.params['ticket']+') returning id_transaccion';
                }

                query2 = query2.replace('!id!',req.params['id']);
                query2 = query2.replace('!id_sucursal!',sucursal.id_sucursal);
                query2 = query2.replace('!id_usuario!',sucursal.id_usuario);
                query2 = query2.replace('!nuevo_monto!',req.params['nuevo_monto']);
                query2 = query2.replace('!porcentaje!',req.params['porcentaje']);
                query2 = query2.replace('!monto!',req.params['importe']);

                execute_query(query2,function(todos){

                  if (alerta == 1){
                    var query4 = 'UPDATE "Monedero" SET estado_activado = 0  where "Monedero".id_monedero  = !id!';
                    query4 = query4.replace('!id!',req.params['id']);
                    execute_query(query4 ,function (todos){
                      console.log(todos);
                      res.send({activado:false});
                      next();
                    });
                  }else{
                    console.log(todos);
                    res.send({activado:true});
                    next();
                  }

                });

              });
            }else{
              if (todos.length == 0 && req.method == 'GET' && query.search("Promocion") == -1){
                console.log("peticion incorrecta");

                if (query.search("monto") > -1){

                    var query5 = 'Select count(id_monedero) from "Monedero" where id_monedero = !id!';

                  query5 = query5.replace('!id!',req.params['id']);

                  execute_query(query5,function(todos){
                    console.log(todos[0]);

                    if (todos[0].count > 0){
                      var query6  = 'INSERT INTO "Monedero_negocio"(id_monedero,id_negocio,monto) VALUES (!id_monedero!,!id_negocio!,0)';
                      query6 = query6.replace('!id_monedero!',req.params['id']);
                      query6= query6.replace('!id_negocio!',sucursal.id_negocio);

                      execute_query(query6,function(todos){

                        console.log(todos);
                        res.send(todos);
                        next();

                      });

                    }else{
                      res.send(400,'Peticion incorrecta');
                      next();
                    }

                  });
                }else{
                  res.send(400,'Peticion incorrecta');
                  next();
                }

              }else{
                res.send(todos);
                next();
              }

            }

          });
      }
    };

    var login = function(){
        return function(req,res,next){
          res.setHeader('Access-Control-Allow-Origin','*');
          if (req.params.user == undefined || req.params.password ==undefined || req.params.user == '' || req.params.password == ''){
              res.send(401,"No autorizado");

          }else{
            req.params.user = req.params.user.replace("'","");
            req.params.user = req.params.user.replace('"',"");
            req.params.user = req.params.user.replace('%',"");

            req.params.password = req.params.password.replace("'","");
            req.params.password = req.params.password.replace('"',"");
            req.params.password = req.params.password.replace('%',"");

            query = 'Select "Usuario".id_usuario,"Sucursal".parametro_alerta, "Sucursal".id_negocio , "Sucursal".id_sucursal from "Usuario","Sucursal_admin","Sucursal" where "Usuario".id_usuario = "Sucursal_admin".id_administrador and "Sucursal".nombre_sucursal = '+ "'"+req.params.user+ "'" +' and "Usuario".password = ' +"'" +req.params.password+ "'";
            execute_query(query,function(todos){
              console.log(todos);

              if (todos.length == 0){
                res.send(401,"No autorizado");
              }else{
                var token = genera_llave();

                new llave(token,todos[0].id_usuario,req.params.user,req.params.password,todos[0].id_sucursal,todos[0].id_negocio);

                res.send(token);
                console.log(token);
                next();
              }
            });

          }
          console.log(req.params);
          next();
        }
    };

 var parametro = function(query){
      return function(req,res,next){

          res.setHeader('Access-Control-Allow-Origin','*');
          res.setHeader('Access-Control-Allow-Methods', '*');

          var query_final = "";

          var llave =  req.headers['x-auth-token'] || '';

          var sucursal = llaves_existentes.existe_llave(llave);

          if (sucursal == null){

              console.log("llave no existe");
              res.send(401,"No autorizado");
              next();
              return;
          }else{

            if (req.params['password']){
              if (req.params['password'] != sucursal.password){
                  res.send(402,"No autorizado");
                  return;
                  next();
              }
            }
          }

          query_final = query;

          if (req.method == 'POST'){

            console.log(req.params);

            o = JSON.parse(Object.keys(req.params)[1]);

            query_final = query_final.replace('!id_sucursal!',sucursal.id_sucursal);

            if (o.nombre != undefined) query_final = query_final.replace('!nombre!',o.nombre);

            if (o.apellido_pat != undefined) query_final = query_final.replace('!apellido_pat!',o.apellido_pat);

            if (o.id_persona != undefined) query_final = query_final.replace('!id_persona!',o.id_persona);
            if (o.id_sucursal != undefined) query_final = query_final.replace('!id_sucursal!',o.id_sucursal);
            if (o.nombre_sucursal != undefined) query_final = query_final.replace('!nombre_sucursal!',o.nombre_sucursal);
            if (o.direccion != undefined) query_final = query_final.replace('!direccion!',o.direccion);
            if (o.descripcion != undefined) query_final = query_final.replace('!descripcion!',o.descripcion);
            if (o.porcentaje != undefined) query_final = query_final.replace('!porcentaje!',o.porcentaje);
            if (o.id_promocion != undefined) query_final = query_final.replace('!id_promocion!',o.id_promocion);

          }else{

            query_final = query_final.replace('!id_sucursal!',sucursal.id_sucursal);
            query_final = query_final.replace('!id_negocio!',sucursal.id_negocio);
          }
          if (req.params['id_promocion']){
            query_final = query_final.replace('!id_promocion!',req.params['id_promocion']);
          }
          if (req.params['id_sucursal']){
            query_final = query_final.replace('!id_sucursal_!',req.params['id_sucursal']);
          }

          if (req.params['id_usuario']){
            query_final = query_final.replace('!id_usuario!',req.params['id_usuario']);
          }

          if (req.params['parametro']){
            query_final = query_final.replace('!parametro!',req.params['parametro']);
          }

          execute_query(query_final,function(todos){


            if (req.method == 'POST' && o.nombre != undefined && o.porcentaje == undefined){

              var query2 = '';
              if (o.nombre != undefined) query2 = 'update "Usuario" set password = ' + " '!password!' where id_usuario = !id_usuario!";

              if (o.password != undefined) query2 = query2.replace('!password!',o.password);

              if (o.id_usuario != undefined) query2 = query2.replace('!id_usuario!',o.id_usuario);

              execute_query(query2,function(todos){
                console.log(todos);
                res.send(todos);

                next();
              });

            }else{
              console.log(todos);
              res.send(todos);
              next();

            }

          });
      }
    };

  var inserta_usuario = function(query){
      return function(req,res,next){

          res.setHeader('Access-Control-Allow-Origin','*');

          var query_final = "";

          var llave =  req.headers['x-auth-token'] || '';

          var sucursal = llaves_existentes.existe_llave(llave);

          if (sucursal == null){

              console.log("llave no existe");
              res.send(401,"No autorizado");
              next();
              return;
          }

          var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ( ("Sucursal_admin".id_sucursal = "Sucursal".id_sucursal and "Sucursal_admin".id_administrador = "Usuario".id_usuario and "Usuario".tipo_usuario = 2) or ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario))';
          query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
          query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );

          var ok = false;

          execute_query(query_ad,function(todos){
            console.log(todos);
            var usuarios = todos;
            for (i = 0; i < usuarios.length;i++){
              if (usuarios[i].password == req.params['password']){

                ok = true;
                break;
              }
            }
            if (!ok){
              console.log("usuario no existe");
              res.send(402,"No autorizado");
              next();
              return;
            }


            query_final = query;

            query_final = query_final.replace('!nombre!',req.params['nombre']);
            query_final = query_final.replace('!apellido_pat!',req.params['apellido_pat']);

            execute_query(query_final,function(todos){

                var query2 = 'insert into "Usuario"( tipo_usuario, password, id_persona) values (' + req.params['admin'] + ',' + "'!password_usuario!'" + ',!id_persona!) returning id_usuario';

                query2 = query2.replace('!password_usuario!',req.params['password_usuario']);

                query2 = query2.replace('!id_persona!',todos[0].id_persona);

                execute_query(query2,function(todos){

                  console.log(todos);

                  var query3 = 'insert into "Sucursal_admin"( id_sucursal, id_administrador) values (!id_sucursal!,!id_administrador!)';

                  query3 = query3.replace('!id_sucursal!',sucursal.id_sucursal);

                  query3 = query3.replace('!id_administrador!',todos[0].id_usuario);

                  execute_query(query3,function(todos){
                    res.send(todos);

                    next();
                  });

              });

            });

          });


      }
    };
var inserta_promocion = function(query){

        return function(req,res,next){

            res.setHeader('Access-Control-Allow-Origin','*');
            res.setHeader('Access-Control-Allow-Methods', '*');

            var query_final = "";

            var llave =  req.headers['x-auth-token'] || '';

            var sucursal = llaves_existentes.existe_llave(llave);

            if (sucursal == null){

                console.log("llave no existe");
                res.send(401,"No autorizado");
                next();
                return;
            }

            var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ( ("Sucursal_admin".id_sucursal = "Sucursal".id_sucursal and "Sucursal_admin".id_administrador = "Usuario".id_usuario and "Usuario".tipo_usuario = 2) or ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario))';
            query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
            query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );

            var ok = false;

            execute_query(query_ad,function(todos){
              console.log(todos);
              var usuarios = todos;
              for (i = 0; i < usuarios.length;i++){
                if (usuarios[i].password == req.params['password']){

                  ok = true;
                  break;
                }
              }
              if (!ok){
                console.log("usuario no existe");
                res.send(402,"No autorizado");
                next();
                return;
              }

              //var query = 'insert into "Promocion"( nombre, descripcion, porcentaje,id_sucursal) values (' +"'!nombre!',"  + "'!descripcion!'" + ",!porcentaje!,!id_sucursal!)";

              var o = JSON.parse(Object.keys(req.params)[1]);

              console.log(o);

              query_final = query;

              query_final = query_final.replace('!nombre!',o.nombre);
              query_final = query_final.replace('!descripcion!',o.descripcion);
              query_final = query_final.replace('!porcentaje!',o.porcentaje);
              query_final = query_final.replace('!id_sucursal!',sucursal.id_sucursal);

              execute_query(query_final,function(todos){
                res.send(200);

              });

          });
      }
  };
  var check = function(){
      return function(req,res,next){

          var query_final = "";

          var llave =  req.headers['x-auth-token'] || '';

          var sucursal = llaves_existentes.existe_llave(llave);

          if (sucursal == null){

              console.log("llave no existe");
              res.send(401,"No autorizado");
              next();
              return;
          }else{

            res.send(200);
            next();
          }

      }
    };

  var elimina_usuario = function(){
      return function(req,res,next){

        var llave =  req.headers['x-auth-token'] || '';

        var sucursal = llaves_existentes.existe_llave(llave);

        if (sucursal == null){
            console.log("llave no existe");
            res.send(401,"No autorizado");
            next();
            return;
        }else{
          var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ( ("Sucursal_admin".id_sucursal = "Sucursal".id_sucursal and "Sucursal_admin".id_administrador = "Usuario".id_usuario and "Usuario".tipo_usuario = 2) or ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario))';
          query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
          query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );

          var ok = false;

          execute_query(query_ad,function(todos){
            var usuarios = todos;
            for (i = 0; i < usuarios.length;i++){
              if (usuarios[i].password == req.params['password']){
                ok = true;
                break;
              }
            }
            if (!ok){
              console.log("usuario no existe");
              res.send(402,"No autorizado");
              next();
              return;
            }

            var query = 'delete from "Usuario" where "Usuario".id_usuario  = ' + req.params["id_usuario"];

            execute_query(query,function (todos){

              res.send(200);

            });
        });

      }

    }
  };
  var elimina_sucursal = function(){
      return function(req,res,next){

        var llave =  req.headers['x-auth-token'] || '';

        var sucursal = llaves_existentes.existe_llave(llave);

        if (sucursal == null){
            console.log("llave no existe");
            res.send(401,"No autorizado");
            next();
            return;
        }else{
          var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario)';
          query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
          query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );

          var ok = false;

          execute_query(query_ad,function(todos){
            var usuarios = todos;
            for (i = 0; i < usuarios.length;i++){
              if (usuarios[i].password == req.params['password']){
                ok = true;
                break;
              }
            }
            if (!ok){
              console.log("usuario no existe");
              res.send(402,"No autorizado");
              next();
              return;
            }
            //  var query = 'delete from "Sucursal" where "Sucursal".id_sucursal  =  !id_sucursal_!';

            var query = 'delete from "Sucursal" where "Sucursal".id_sucursal  = ' + req.params['id_sucursal'];

            execute_query(query,function (todos){

              res.send(200);

            });
        });

      }

    }
  };

  var modifica_sucursal = function(query){

      return function(req,res,next){

        var llave =  req.headers['x-auth-token'] || '';

        var sucursal = llaves_existentes.existe_llave(llave);

        if (sucursal == null){
            console.log("llave no existe");
            res.send(401,"No autorizado");
            next();
            return;
        }else{
          var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario)';

          query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
          query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );
          var ok = false;

          execute_query(query_ad,function(todos){
            var usuarios = todos;
            for (i = 0; i < usuarios.length;i++){
              if (usuarios[i].password == req.params['password']){
                ok = true;
                console.log("si");
                break;
              }
            }
            if (!ok){
              console.log("usuario no existe");
              res.send(402,"No autorizado");
              next();
              return;
            }

            var query_final = query;
            console.log(Object.keys(req.params));
            var o = JSON.parse(Object.keys(req.params)[1] + '"}');

            query_final = query_final.replace('!nombre_sucursal!',o.nombre_sucursal);
            query_final = query_final.replace('!direccion!',o.direccion);
            query_final = query_final.replace('!id_sucursal!',o.id_sucursal);

            console.log(query_final);

            execute_query(query_final,function (todos){

              res.send(200);

            });
        });

      }
    }
  };
  var modifica_promocion = function(query){

      return function(req,res,next){

        var llave =  req.headers['x-auth-token'] || '';

        var sucursal = llaves_existentes.existe_llave(llave);

        if (sucursal == null){
            console.log("llave no existe");
            res.send(401,"No autorizado");
            next();
            return;
        }else{
          var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ( ("Sucursal_admin".id_sucursal = "Sucursal".id_sucursal and "Sucursal_admin".id_administrador = "Usuario".id_usuario and "Usuario".tipo_usuario = 2) or ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario))';

          query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
          query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );
          var ok = false;

          execute_query(query_ad,function(todos){
            var usuarios = todos;
            for (i = 0; i < usuarios.length;i++){
              if (usuarios[i].password == req.params['password']){
                ok = true;
                console.log("si");
                break;
              }
            }
            if (!ok){
              console.log("usuario no existe");
              res.send(402,"No autorizado");
              next();
              return;
            }

            var query_final = query;

            console.log(Object.keys(req.params)[1]);

            var o = JSON.parse(Object.keys(req.params)[1] );
            console.log(o);

            var query = 'update "Promocion" set nombre =  ' + "'!nombre!',descripcion = '!descripcion!',porcentaje = !porcentaje! where " + '"Promocion".id_promocion = !id_promocion!' ;

            query_final = query.replace('!nombre!',o.nombre);
            query_final = query_final.replace('!direccion!',o.descripcion);
            query_final = query_final.replace('!descripcion!',o.descripcion);

            query_final = query_final.replace('!porcentaje!',o.porcentaje);
            query_final = query_final.replace('!id_promocion!',o.id_promocion);

            console.log(query_final);

            execute_query(query_final,function (todos){

              console.log(todos.length);

              res.send(200);

            });
        });

      }
    }
  };
  var reemplaza_monedero = function(query){

      return function(req,res,next){

        var llave =  req.headers['x-auth-token'] || '';

        var sucursal = llaves_existentes.existe_llave(llave);

        if (sucursal == null){
            console.log("llave no existe");
            res.send(401,"No autorizado");
            next();
            return;
        }else{
          var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario)';

          query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
          query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );
          var ok = false;

          execute_query(query_ad,function(todos){
            var usuarios = todos;
            for (i = 0; i < usuarios.length;i++){
              if (usuarios[i].password == req.params['password']){
                ok = true;

                break;
              }
            }
            if (!ok){
              console.log("usuario no existe");
              res.send(401,"No autorizado");
              next();
              return;
            }

            query_final = query.replace('!id_monedero_nuevo!',req.params['id_monedero_nuevo']);
            console.log(query);
            execute_query(query_final,function (todos) {
              console.log(req.params);
              console.log(todos.length);

              if (todos.length > 0 ){
                res.send(402,"Existente");
                next();
              }else{
                var query2 = 'update "Monedero" set  id_monedero = '+req.params['id_monedero_nuevo']
                query2 += ' where id_monedero = ' + req.params['id_monedero'];

                execute_query(query2,function (todos) {

                  var query3 = 'update "Monedero_negocio" set  id_monedero = '+req.params['id_monedero_nuevo']
                  query3 += ' where id_monedero = ' + req.params['id_monedero'];

                  execute_query(query3,function (todos) {
                    var query4 = 'update "Transaccion" set  id_monedero = '+req.params['id_monedero_nuevo']
                    query4 += ' where id_monedero = ' + req.params['id_monedero'];

                    execute_query(query4,function (todos) {
                      res.send(200);
                      next();
                    })

                  });

                });
              }

            });
          });
      }
    }
  };
  var obten_monederos = function(query){
      return function(req,res,next){

        var llave =  req.headers['x-auth-token'] || '';

        var sucursal = llaves_existentes.existe_llave(llave);

        if (sucursal == null){
            console.log("llave no existe");
            res.send(401,"No autorizado");
            next();
            return;
        }else{
          query = query.replace('!id_negocio!',sucursal.id_negocio);

          execute_query(query,function(todos){

            console.log(todos);
            res.send(todos);

          });


        }

    }
  };
  var elimina_promocion = function(){
      return function(req,res,next){

        var llave =  req.headers['x-auth-token'] || '';

        var sucursal = llaves_existentes.existe_llave(llave);

        if (sucursal == null){
            console.log("llave no existe");
            res.send(401,"No autorizado");
            next();
            return;
        }else{
          var query_ad = 'select * from "Usuario","Sucursal_admin","Sucursal","Negocio" where "Sucursal".id_sucursal = !id_sucursal! and ( ("Sucursal_admin".id_sucursal = "Sucursal".id_sucursal and "Sucursal_admin".id_administrador = "Usuario".id_usuario and "Usuario".tipo_usuario = 2) or ("Sucursal".id_negocio = "Negocio".id_negocio and "Negocio".id_negocio = !id_negocio! and "Negocio".id_administrador = "Usuario".id_usuario))';
          query_ad = query_ad.replace('!id_sucursal!',sucursal.id_sucursal);
          query_ad = query_ad.replace('!id_negocio!',sucursal.id_negocio );

          var ok = false;

          execute_query(query_ad,function(todos){
            var usuarios = todos;
            for (i = 0; i < usuarios.length;i++){
              if (usuarios[i].password == req.params['password']){
                ok = true;
                break;
              }
            }
            if (!ok){
              console.log("usuario no existe");
              res.send(402,"No autorizado");
              next();
              return;
            }
            //  var query = 'delete from "Sucursal" where "Sucursal".id_sucursal  =  !id_sucursal_!';

            var query = 'delete from "Promocion" where "Promocion".id_promocion  = ' + req.params["id_promocion"];

            execute_query(query,function (todos){

              res.send(200);

            });
        });

      }

    }
  };
  var modifica_monedero = function(query){

      return function(req,res,next){

        var llave =  req.headers['x-auth-token'] || '';

        var sucursal = llaves_existentes.existe_llave(llave);

        if (sucursal == null){
            res.send(401,"No autorizado");
            next();
            return;
        }else{
          console.log(req.params);
          query_final = query.replace('!id!',req.params["id"]);
          query_final = query_final.replace('!nombre!',req.params["nombre"]);

          query_final = query_final.replace('!apellido_pat!',req.params["apellido_pat"]);
          query_final = query_final.replace('!apellido_mat!',req.params["apellido_mat"]);
          query_final = query_final.replace('!telefono!',req.params["telefono"]);
          query_final = query_final.replace('!email!',req.params["email"]);
          query_final = query_final.replace('!fecha_nacimiento!',req.params["fecha_nacimiento"]);

          execute_query(query_final,function(todos){
            console.log(todos);
            res.send(200);

          });
          res.send(200);
          next();
        }

      }

  };
  var activa = function(){
      return function(req,res,next){

          var query_final = "";

          var llave =  req.headers['x-auth-token'] || '';

          var sucursal = llaves_existentes.existe_llave(llave);

          console.log(req.params);

          if (sucursal == null){
              console.log("llave no existe");
              res.send(401,"No autorizado");
              next();
              return;
          }else{

            if (req.params['password']){
              if (req.params['password'] != sucursal.password){
                  res.send(402,"No autorizado");
                  next();
                  return;
              }
            }

          var partes = req.params['ids'].split(',');
          var buff = '';
          var buff2= '';
          for (i = 0;i < partes.length -1;i++){
            buff+= '"Monedero".id_monedero = ' + partes[i];
            buff2+= '"Transaccion".id_monedero = ' + partes[i];
            if (i != (partes.length -2)){
              buff2 +=  ' or ';
              buff +=  ' or ';
            }
          }
         console.log("estado 1 a id: ",buff);
         var query = 'UPDATE "Monedero" SET estado_activado = 1 where ' + buff;

          execute_query(query,function(todos){

            var query2 = 'UPDATE "Transaccion" SET alerta = 0 where ' + buff2;

            execute_query(query2,function(todos){

              console.log(todos);
              res.send(200);
              next();

            });

          });

        }

      }

    };

    return{"reemplaza_monedero":reemplaza_monedero,"modifica_monedero":modifica_monedero, "obten_monederos":obten_monederos, "elimina_promocion":elimina_promocion,"modifica_promocion":modifica_promocion,"inserta_promocion":inserta_promocion,"elimina_sucursal":elimina_sucursal,"modifica_sucursal":modifica_sucursal,"elimina_usuario":elimina_usuario,"modifica_usuario":modifica_usuario,"activa":activa, "check":check, "inserta_usuario":inserta_usuario, "parametro":parametro, "inserta_sucursal":inserta_sucursal, "insert_persona_monedero":insert_persona_monedero, "get_query":get_query, "login":login,"execute_query":execute_query};

  }();

  pg.connect(conString, function(err, client, done) {

    client_v = client;
    if(err) {
      console.log("Error al conectar");

      return;
    }

  });

server.use(restify.bodyParser());
server.use(restify.authorizationParser());
server.use(restify.CORS());


var recurso_usuario = function(){

  var query = 'insert into "Persona" (nombre,apellido_pat) VALUES ' + "('!nombre!','!apellido_pat!') returning id_persona";

  server.post('/usuario/:nombre/:apellido_pat/:password_usuario/:admin/:password',data_base.inserta_usuario(query));

};

var recurso_parametro_alerta = function(){

  var query = 'select parametro_alerta from "Sucursal" where "Sucursal".id_sucursal = !id_sucursal!';
  var query2 = 'update "Sucursal" set  parametro_alerta =  !parametro!  where "Sucursal".id_sucursal = !id_sucursal!';

  server.get('/parametro/obten'  , data_base.parametro(query));
  server.get('/parametro/:parametro/'  , data_base.parametro(query2));

}

var genera_recurso_login = function(){

    server.get('/login/:user/:password'  , data_base.login());
    server.get('/login/:user/:password/'  , data_base.login());

};

var recurso_sucursal = function () {

  var query = 'insert into "Sucursal"( nombre_sucursal, id_negocio, direccion) values (' + "'!nombre!'" + ",!id_negocio!,'!direccion!')";

  server.get('/sucursal/:id/:nombre/:direccion/:password', data_base.inserta_sucursal(query));

};

var recurso_inserta_promociones = function(){

    var query = 'insert into "Promocion"( nombre, descripcion, porcentaje,id_sucursal) values (' +"'!nombre!',"  + "'!descripcion!'" + ",!porcentaje!,!id_sucursal!)";
    server.post('/promocion/:password', data_base.inserta_promocion(query));
};

var recurso_promociones = function(){

  var query = 'select * from "Promocion","Sucursal" where "Promocion".id_sucursal = "Sucursal".id_sucursal and "Sucursal".nombre_sucursal = ' + "'!nombre_sucursal!'";

  server.get('/promocion', data_base.get_query(query));
  server.get('/promocion/',data_base.get_query(query));
  server.get('/promocion/:id', data_base.get_query(query));

};

var recurso_persona_monedero = function(){


  var query = 'insert into "Persona" (nombre,apellido_pat,apellido_mat,telefono,email,fecha_nacimiento) VALUES ' + "('!nombre!','!apellido_pat!','!apellido_mat!','!telefono!','!email!','!fecha_nacimiento!') returning id_persona";
  server.get('/persona/:nombre/:apellido_pat/:apellido_mat/:telefono/:email/:fecha_nacimiento/:id_monedero', data_base.insert_persona_monedero(query));

};

var recurso_monedero_baja = function(){
  var query = 'UPDATE "Monedero" SET estado_activado = 0 from "Sucursal","Persona","Monedero_negocio" where "Monedero".id_monedero = !id! and "Monedero".estado_activado = 1 returning estado_activado';

  server.get('/bajamonedero/:id', data_base.get_query(query));
  server.get('/bajamonedero/:id/:password', data_base.get_query(query));

};

var recurso_transacciones = function () {
  // var query = 'select * from "Transaccion" where "Transaccion".id_sucursal = !id_sucursal!';
  var query = 'select * from "Transaccion" inner join "Usuario" using(id_usuario) inner join "Persona" using(id_persona) where "Transaccion".id_sucursal = !id_sucursal!';
  server.get('/transacciones/:i', data_base.get_query(query));

}

var recurso_monedero = function(){


  var query = 'select "Persona".apellido_pat,"Persona".apellido_mat,"Persona".nombre,"Monedero_negocio".monto, "Monedero".estado_activado from "Monedero_negocio","Monedero","Sucursal","Persona" where "Monedero".id_monedero = "Monedero_negocio".id_monedero and "Monedero".id_monedero = !id! and "Persona".id_persona = "Monedero".id_persona_cliente';

  server.get('/monedero/:id', data_base.get_query(query));

  var query2 = 'UPDATE "Monedero_negocio" SET monto= !nuevo_monto! WHERE "Monedero_negocio".id_monedero = !id! and "Monedero_negocio".id_negocio = !id_negocio!';

  server.get('/monedero/:id/:monto/:porcentaje/:importe/:nuevo_monto', data_base.get_query(query2));
  server.get('/monedero/:id/:monto/:porcentaje/:importe/:nuevo_monto/:ticket', data_base.get_query(query2));


};

var recurso_alerta = function(){
  var query = 'select * from "Transaccion" where "Transaccion".id_sucursal = !id_sucursal! and "Transaccion".alerta = 1';
  server.get('/alertas/:s', data_base.parametro(query));

};

var recurso_check = function(){

  server.get('/check/:c',data_base.check());
};


var recurso_monedero_activa = function(){
  server.post('/activa/:password/:ids',data_base.activa());
}

var recurso_ticket = function(){
  var query = 'select ticket from "Sucursal" where "Sucursal".id_sucursal = !id_sucursal!';
  var query2 = 'update "Sucursal" set ticket =  !parametro!  where "Sucursal".id_sucursal = !id_sucursal!';

  server.get('/ticket/obten'  , data_base.parametro(query));
  server.get('/ticket/:parametro/'  , data_base.parametro(query2));

}

var recurso_usuarios = function(){
  var query = 'select * from "Sucursal_admin","Usuario","Persona" where "Sucursal_admin".id_administrador = "Usuario".id_usuario and "Sucursal_admin".id_sucursal = !id_sucursal! and "Usuario".id_persona = "Persona".id_persona';
  server.get('/usuarios',data_base.parametro(query));
}

var recurso_modifica_usuario = function(){  //!nombre! !apellido_pat! !id_persona!
  var query = 'update "Persona" set nombre =  ' + "'!nombre!',apellido_pat = '!apellido_pat!' where " + '"Persona".id_persona = !id_persona!' ;
  server.post('/usuarios/:password',data_base.modifica_usuario(query));

}

var recurso_elimina_usuario = function(){
  server.get('/delete_user/:id_usuario/:password',data_base.elimina_usuario());
};

var recurso_sucursales = function(){
  var query = 'select * from "Sucursal","Negocio" where "Sucursal".id_negocio = "Negocio".id_negocio and "Sucursal".id_negocio = !id_negocio!'
  server.get('/sucursales',data_base.parametro(query));
}

var recurso_modifica_sucursales = function(){  //!nombre! !apellido_pat! !id_persona!

  var query = 'update "Sucursal" set nombre_sucursal =  ' + "'!nombre_sucursal!',direccion = '!direccion!' where " + '"Sucursal".id_sucursal = !id_sucursal!' ;
  server.post('/sucursales/:password',data_base.modifica_sucursal(query));

}

var recurso_elimina_sucursal = function(){

  server.get('/delete_sucursal/:id_sucursal/:password',data_base.elimina_sucursal());

};

var recurso_modifica_promociones = function(){  //!nombre! !apellido_pat! !id_persona!

  var query = 'update "Promocion" set nombre =  ' + "'!nombre!',descripcion = '!descripcion!',porcentaje = !porcentaje! where " + '"Promocion".id_promocion = !id_promocion!' ;

  server.post('/promociones/:password',data_base.modifica_promocion(query));

};
var recurso_modifica_monedero = function(){  //!nombre! !apellido_pat! !id_persona!

  var query = 'update "Persona" set nombre = ' + "'!nombre!', apellido_pat = '!apellido_pat!', apellido_mat = '!apellido_mat!',telefono = '!telefono!',email = '!email!',fecha_nacimiento = '!fecha_nacimiento!'"  + ' from "Monedero" where  "Persona".id_persona = "Monedero".id_persona_cliente and "Monedero".id_monedero = !id!';

  server.get('/modifica_monedero/:id/:nombre/:apellido_pat/:apellido_mat/:telefono/:email/:fecha_nacimiento',data_base.modifica_monedero(query));
};

var recurso_elimina_promocion = function(){
  server.get('/delete_promo/:id_promocion/:password',data_base.elimina_promocion());

};
var recurso_monederos = function(){

  var query = 'select * from "Monedero","Monedero_negocio","Persona" where "Monedero".id_monedero = "Monedero_negocio".id_monedero and "Persona".id_persona = "Monedero".id_persona_cliente and "Monedero_negocio".id_negocio = !id_negocio!';
  server.get('/monederos/:i',data_base.obten_monederos(query));

};
var recurso_reemplaza = function () {
  var query = 'select * from "Monedero" where id_monedero = !id_monedero_nuevo!';
  server.get('/reemplaza/:id_monedero/:id_monedero_nuevo/:password',data_base.reemplaza_monedero(query));
}

recurso_reemplaza();
recurso_modifica_monedero();
recurso_monederos();
recurso_elimina_promocion();
recurso_modifica_promociones();
recurso_elimina_sucursal();
recurso_modifica_sucursales();
recurso_sucursales();
recurso_elimina_usuario();
recurso_modifica_usuario();
recurso_usuarios();
recurso_monedero_activa();
recurso_check();
recurso_alerta();
genera_recurso_login();
recurso_promociones();
recurso_monedero();
recurso_persona_monedero();
recurso_monedero_baja();
recurso_transacciones();
recurso_sucursal();
recurso_inserta_promociones();
recurso_parametro_alerta();
recurso_usuario();
recurso_ticket();

function corsHandler(req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers','Authorization, Origin, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Response-Time, X-PINGOTHER, X-CSRF-Token, X-Auth-Token');
    res.setHeader('Access-Control-Allow-Methods', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Api-Version, X-Request-Id, X-Response-Time');
    res.setHeader('Access-Control-Max-Age', '1000');

    return next();
}

function optionsRoute(req, res, next) {

    res.send(200);
    return next();
}

server.opts('/\.*/', corsHandler, optionsRoute);

server.listen(8080, function() {
  console.log('%s listening at %s', server.name, server.url);
});
