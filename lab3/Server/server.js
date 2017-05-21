/*jslint node: true */
/*jslint esversion: 6*/
/*jslint eqeqeq: true */

var express = require('express');
var app = express();
var fs = require("fs");
var expressWs = require('express-ws')(app);
var http = require('http');

var simulation = require('./simulation.js');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var uuid = require('uuid');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());

var checkusername;
var checkuserpassword;
var devices;
var startDate =  new Date();

var loginfailed = 0;
//TODO Implementieren Sie hier Ihre REST-Schnittstelle
/* Ermöglichen Sie wie in der Angabe beschrieben folgende Funktionen:
 *  Abrufen aller Geräte als Liste
 *  Hinzufügen eines neuen Gerätes
 *  Löschen eines vorhandenen Gerätes
 *  Bearbeiten eines vorhandenen Gerätes (Verändern des Gerätezustandes und Anpassen des Anzeigenamens)
 *  Log-in und Log-out des Benutzers
 *  Ändern des Passworts
 *  Abrufen des Serverstatus (Startdatum, fehlgeschlagene Log-ins).
 *
 *  BITTE BEACHTEN!
 *      Verwenden Sie dabei passende Bezeichnungen für die einzelnen Funktionen.
 *      Achten Sie bei Ihrer Implementierung auch darauf, dass der Zugriff nur nach einem erfolgreichem Log-In erlaubt sein soll.
 *      Vergessen Sie auch nicht, dass jeder Client mit aktiver Verbindung über alle Aktionen via Websocket zu informieren ist.
 *      Bei der Anlage neuer Geräte wird eine neue ID benötigt. Verwenden Sie dafür eine uuid (https://www.npmjs.com/package/uuid, Bibliothek ist bereits eingebunden).
 */

app.get("/resources/devices.json", function(req,res){
    res.send(JSON.parse(fn.readFileSync('./resources/devices.json')).devices);
});

app.post("/listDevices", function (req, res) { 
	"use strict";
	console.log("listDevices");
    var json = {
        status: "OK",
       	message: "List of Devices",
        devices: devices.devices
    }

    res.json(json)
    res.end();
});

app.post("/addDevice", function (req, res) { 
	"use strict";
    console.log("addDevice");
  	try{
		req.body.id = uuid();
		console.log(".. " +  req.body) ;
		devices.devices.push(req.body);
		console.log("added Device ");
	}catch (ex){
		res.status(400).send(ex.message);
		return;
	}
    res.status(200).send();
    
});

app.post("/deleteDevice", function (req, res) { 
	"use strict";
    console.log("Delete devices");
   	try{
    var target;
		for (var i in devices.devices){
			if(devices.devices[i].id == req.body.id){
				targetIndex = i;
				break;
			}
		}
		if(target === undefined)
			throw new Error("Device not found.");
		devices.devices.splice(target,1);

 	}catch (ex){
     	res.status(400).send(ex.message);
    }
    res.status(200).send("Device deleted successfully.");
});

app.post("/updateDevice", function (req, res) { 
	"use strict";
    console.log("change/update Device");
       try{
            var targetDevice;
            var targetUnit;
            console.log("update called ... id:" + req.body.id);
            for (var i in devices.devices){
                if(devices.devices[i].id === req.body.id){
                    targetDevice = devices.devices[i];
                    break;
                }
            }
            if(targetDevice === undefined)
                throw new Error("Device not found.");

            for (var i in targetDevice.control_units){
                if(targetDevice.control_units[i].name == req.body.controlunit){
                    targetUnit = targetDevice.control_units[i];
                    break;
                }
                throw new Error("Control unit not found.");
            }
           
            switch(targetUnit.type){
                case "continuous":
                    if(req.body.value<targetUnit.min || req.body.value > targetUnit.max)
                        throw new Error("Continuous value out of range.");
                    break;

                case "boolean":
                    if(req.body.value!=0 && req.body.value != 1)
                        throw new Error("Boolean value out of range.");
                    break;

                case "enum":
                    if(targetUnit.values.indexOf(req.body.value) <= -1)
                        throw new Error("Enum value out of range.");
                    break;

                default:
                    throw new Error("Control unit type unknown.");
            }

            if(targetUnit.type == "enum")
                targetUnit.current = targetUnit.values.indexOf(req.body.value);
            else
                targetUnit.current = req.body.value;

            console.log("targetUnit - current: "+targetUnit.current);

            targetUnit.current = req.body.value;
            console.log("targetDevice - name:" + targetDevice.display_name)
            targetDevice.display_name = req.body.name;

            console.log("targetDevice - name:" + targetDevice.display_name)

        }catch (ex){
            console.log("ERROR: " + ex.message);
            res.status(400).send(ex.message);
            return;
        }
        res.status(200).send("Device updated successfully.");  
});

app.post("/login", function (req, res) {
    "use strict";
    console.log("login attempt: username: " + req.body.username + " / password: " + req.body.password);
    try{
        if(req.body.username !== checkusername) throw new Error("Wrong username or password.(0) ___"+req.body.username+"="+validUsername);
        if(req.body.password !== checkuserpassword) throw new Error("Wrong username or password. (1)");

       //TODO Tokens...
	   
        res.status(200).json(token);

    }catch (ex){
        res.status(400).send(ex.message);
        loginfailed ++;
    }
});

app.post("/changePassword", function (req, res) { 
	"use strict";
    console.log('Parameter:' + req.params.id + ', ' + req.query.time);
    res.writeHead(200, {'Content-Type':   'text/html'});
    res.write("change Password");
    res.end();
});

app.post("/serverStatus", function (req, res) { 
	"use strict";
   	res.json({
            startdate: startDate,
            loginerrors: wrongLogins
    });
    res.end();
});


app.post("/updateCurrent", function (req, res) {
    "use strict";
    //TODO Vervollständigen Sie diese Funktion, welche den aktuellen Wert eines Gerätes ändern soll
    /*
     * Damit die Daten korrekt in die Simulation übernommen werden können, verwenden Sie bitte die nachfolgende Funktion.
     *      simulation.updatedDeviceValue(device, control_unit, Number(new_value));
     * Diese Funktion verändert gleichzeitig auch den aktuellen Wert des Gerätes, Sie müssen diese daher nur mit den korrekten Werten aufrufen.
     */
});


function readUser() {
    "use strict";
    //TODO Lesen Sie die Benutzerdaten aus dem login.config File ein.
    var login = fs.readFileSync('./resources/login.config').toString();

    var jsonLogin = {"username": login.slice(10,24), "password": login.slice(36,42)};

    return jsonLogin;
}

function readDevices() {
    "use strict";
    //TODO Lesen Sie die Gerätedaten aus der devices.json Datei ein.
    /*
     * Damit die Simulation korrekt funktioniert, müssen Sie diese mit nachfolgender Funktion starten
     *      simulation.simulateSmartHome(devices.devices, refreshConnected);
     * Der zweite Parameter ist dabei eine callback-Funktion, welche zum Updaten aller verbundenen Clients dienen soll.
     */

    return JSON.parse(fs.readFileSync('./resources/devices.json').toString());
}


function refreshConnected() {
    "use strict";
    //TODO Übermitteln Sie jedem verbundenen Client die aktuellen Gerätedaten über das Websocket
    /*
     * Jedem Client mit aktiver Verbindung zum Websocket sollen die aktuellen Daten der Geräte übermittelt werden.
     * Dabei soll jeder Client die aktuellen Werte aller Steuerungselemente von allen Geräte erhalten.
     * Stellen Sie jedoch auch sicher, dass nur Clients die eingeloggt sind entsprechende Daten erhalten.
     *
     * Bitte beachten Sie, dass diese Funktion von der Simulation genutzt wird um periodisch die simulierten Daten an alle Clients zu übertragen.
     */
}


var server = app.listen(8081, function () {
    "use strict";
    readUser();
    readDevices();

    var host = server.address().address;
    var port = server.address().port;
    console.log("Big Smart Home Server listening at http://%s:%s", host, port);
});

