# iteration-pbi-extractor

Conecta con VSO para extraer/ mostrar proyectos, iteraciones y PBIs/ Bugs(effort/ assignedTo) de los mismos.

Para la maquetación he utilizado Materializecss y toda la parte de cliente es una mezcla de jQuery con Handlebarsjs para el uso de templates.

>Para cargar index.html y que no de problemas la carga de plantillas (hb files) es aconsejable usar http-server (Nodejs) o similar.


>No he podido utilizar la imagen de los usuarios de VSO por lo que para mostrarla dichos usuarios deben estar registrados en gravatar.

```
npm install http-server -g
http-server [path] [options]
```
Todos los frameworks\ librerías utilizados son cargados de CDN.


## Referencias.
	1. http://materializecss.com
	2. https://jquery.com
	3. http://handlebarsjs.com
	4. https://www.npmjs.com/package/http-server