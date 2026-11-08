# Activar el formulario de contacto

El sitio de GitHub Pages es estático, así que no puede enviar correos por sí mismo. La carpeta `apps-script` contiene el receptor gratuito para Google Apps Script. El receptor envía al buzón fijo `huellasgrjuv@outlook.com` y no escribe las solicitudes en hojas de cálculo, archivos ni registros de ejecución.

## Publicar el receptor

La persona que administra la cuenta Google debe:

1. Abrir [script.google.com](https://script.google.com/) e iniciar un proyecto nuevo.
2. Copiar el contenido de `apps-script/Code.gs` en el editor y guardar.
3. En **Implementar > Nueva implementación**, seleccionar **Aplicación web**.
4. Elegir **Ejecutar como: yo** y acceso **Cualquier persona**. Esto permite que el formulario público de GitHub Pages funcione sin pedir una cuenta Google al visitante.
5. Implementar y aceptar la autorización solicitada para enviar correo con la cuenta administradora. El mensaje se enviará al correo institucional fijo indicado en el código.
6. Copiar la URL de la aplicación web que termina en `/exec`.
7. Pegar esa URL como valor de `endpoint` en `REQUEST_DELIVERY_CONFIG` al inicio de `script.js`, publicar el cambio del sitio y hacer un envío de prueba con datos ficticios. Confirmar la recepción en Outlook.

Si la cuenta Google institucional restringe el acceso público a aplicaciones web, su administrador deberá permitir esa opción o el formulario no podrá recibir solicitudes anónimas.

## Datos y privacidad

El navegador transmite los campos por HTTPS mediante un POST y la respuesta se procesa en un iframe oculto. Los campos no aparecen en la URL, no se guardan en el repositorio, en una hoja de cálculo ni en Drive, y el código no los escribe en registros. Google procesa temporalmente la solicitud para ejecutar el envío; el mensaje recibido queda en el buzón Outlook institucional. El acceso al buzón debe limitarse a personas autorizadas.

El mensaje incluye el nombre, celular, programa, consulta y todos los datos del medio elegido: número de WhatsApp; comuna, barrio, dirección e indicaciones; o correo para respuesta. Cuando se elige correo, se configura también como dirección de respuesta.

Apps Script aplica cuotas de envío que pueden cambiar según el tipo de cuenta. Si se supera una cuota o el servicio rechaza el envío, el formulario mostrará un error y no confirmará la recepción. Consulta las [cuotas oficiales de Apps Script](https://developers.google.com/apps-script/guides/services/quotas).

## Prueba

Después de configurar `endpoint`, abre el sitio publicado o `http://localhost:8080`, completa los campos con información ficticia y envía una prueba para cada medio de respuesta. Comprueba que el correo llegue al buzón y que el asunto identifique el programa. La confirmación en la página solo aparece cuando Apps Script informa que pudo aceptar y enviar el correo.

Para ejecutar el servidor local desde PowerShell:

```powershell
node serve.js
```

Luego abre [http://localhost:8080](http://localhost:8080). Si se modifica el código de Apps Script, vuelve a implementar una versión nueva de la aplicación web.
