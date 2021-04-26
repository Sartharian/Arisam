var _cnvr = (function () {
    var instance;
    var settings = [false, true, false];
    var blob = null;
    var titulo;

    function Conversor() {
        if (instance) return instance;
        instance = this;
    }
    function ProcesarTexto(texto, suc, fail) {
        var strb = [];
        let _t = texto.split("\n");

        if (_t == null) return fail.call(this, "pucha, no escribiste algo...");
        if (_t.length == 0) return fail.call(this, "no funciona de la manera que lo escibiste");
        
        //Regex para el nombre del objeto
        var head = new RegExp(/^(CREATE TABLE \[(.*?)\].\[(.*?)\])/gm);

        // ...para los atributos
        var attribs = new RegExp(/\[(.*?)]/g);

        // por alguna razón, hay que volver a escribir los regex...
        if (!/^(CREATE TABLE \[(.*?)\].\[(.*?)\])/gm.test(_t[0])) 
            return fail.call(this, "el script no cumple con el formato. \nVea las instrucciones!");
        
        function Capitalizar(s) {
            if (s == null) return "null";
            return s.charAt(0).toUpperCase() + s.slice(1);
        }
        var tipo = [];
        var nombre = [];
        var f = 0;

        // buscador multilinea
        for (var l = 0; l < _t.length; l++) {
            if (l == 0) {   // clase - nombre
                let n;
                while ((n = head.exec(_t[0])) !== null) {
                    titulo = n[3];
                    strb.push("public " + (settings[1] === true ? "class " : "struct ") + Capitalizar(n[3]) + " { <br />");
                }
                continue;
            } else {
                let col;
                while ((col = attribs.exec(_t[l])) !== null) {
                    if (f == 0) { // Obtener el nombre
                        nombre.push(col[1]);
                        f = 1;
                    } else { // Conversor de tipos de datos
                        var tipin;
                        switch (col[1].toLowerCase()) {
                            case "binary":
                            case "image":
                            case "rowversion":
                            case "varbinary":
                                tipin = "byte[]"
                                break;
                            case "char":
                            case "nchar":
                            case "ntext":
                            case "text":
                            case "nvarchar":
                            case "varchar":
                                tipin = "string";
                                break;
                            case "date":
                            case "datetime":
                            case "datetime2":
                            case "smalldatetime":
                                tipin = "DateTime";
                                break;
                            case "money":
                            case "numeric":
                            case "decimal":
                            case "smallmoney":
                                tipin = "decimal";
                                break;
                            case "bigint":
                                tipin = "long";
                                break;
                            case "tinyint":
                                tipin = "byte";
                                break;
                            case "bit":
                                tipin = "bool";
                                break;
                            case "datetimeoffset":
                                tipin = "DateTimeOffset";
                                break;
                            case "float":
                                tipin = "float";
                                break;
                            case "int":
                                tipin = "int";
                                break;
                            case "real":
                                tipin = "double";
                                break;
                            case "smallint":
                                tipin = "short";
                                break;
                            case "time":
                                tipin = "TimeSpan"
                                break;
                            case "timestamp":
                                tipin = "timestamp";
                                break;
                            case "uniqueidentifier":
                                tipin = "Guid";
                                break;
                        }
                        if (!_t[l].toUpperCase().includes("NOT NULL")) {
                            tipo.push(tipin + "?");
                        } else {
                            tipo.push(tipin);
                        }
                        f = 0;
                    }
                }
            }
        }

        //filtrador
        var final = [];
        for (var j = 0; j < tipo.length; j++) {
            // todo: filtrar selección de los getter y setter
            strb.push("&nbsp;&nbsp;&nbsp;&nbsp;public " + tipo[j] + " " + Capitalizar(nombre[j]) + 
                (settings[0] == true ? " { get; set; }" : ";" ) + "<br />");
        }

        strb.push("}");
        blob = strb.join("");
        return suc.call(this, blob);
    }

    Conversor.Descargar = function (fail) {
        if (blob == null) return fail.call(this, "El blob por alguna razón se vació.. así 'capuut'");
        
        var myBlob = new Blob([blob.replace(new RegExp(/\<br \/>/, "gm"), "\n").replace(new RegExp(/\&nbsp;/, "gm"), " ")], { type: 'text/plain' });
        var url = window.URL.createObjectURL(myBlob);
        var a = document.createElement("a");
        a.href = url;
        a.download = titulo + ".cs";
        a.click();
        window.URL.revokeObjectURL(url);
    };
    Conversor.AplicarConfig = function (config, valor) {
        settings[config] = valor;
    }
    Conversor.Informar = function (alrt) {
        return alrt.call(this);
    }
    Conversor.Interpretar = function (texto, suc, fail) {
        return ProcesarTexto(texto, suc, fail);
    }
    Conversor.Preparar = function (suc) {
        return suc.call(this, settings);
    }
    return Conversor;
})();

$(document).ready(function () {
    _cnvr.Preparar(
        function (config) {
            //getter y setters
            config[0] === true ? $("#menu_getset").children("i").removeClass("d-none") : 0;
            //struct y class
            if (config[1]) {
                $("#menu_clase").children("i").removeClass("d-none");
                $("#menu_struct").children("i").addClass("d-none");
            } else {
                $("#menu_struct").children("i").removeClass("d-none");
                $("#menu_clase").children("i").addClass("d-none");
            }
        });

    // -- Menú de opciones
    $("a").click(function (e) {
        e.preventDefault();
    });    
    $("#menu_getset").click(function () {
        if ($(this).children("i").hasClass("d-none")) {
            $(this).children("i").removeClass("d-none");
            _cnvr.AplicarConfig(0, true);
            _cnvr.Informar(function () {
                $("#msg_failure").text("De acuerdo, los agregaré.");
                $("#toastsito").toast("show");
            });
        }else {
            $(this).children("i").addClass("d-none")
            _cnvr.AplicarConfig(0, false);
            _cnvr.Informar(function () {
                $("#msg_failure").text("Muy bien, los omitiré.");
                $("#toastsito").toast("show");
            });
        }
    });
    $("#menu_clase").click(function () {
        if ($(this).children("i").hasClass("d-none")) {
            $("#menu_struct").children("i").addClass("d-none");
            $(this).children("i").removeClass("d-none")
            _cnvr.AplicarConfig(1, true);
            _cnvr.Informar(function () {
                $("#msg_failure").text("Estupendo, mostraré una clase.");
                $("#toastsito").toast("show");
            });
        } 
    });
    $("#menu_struct").click(function () {
        if ($(this).children("i").hasClass("d-none")) {
            $("#menu_clase").children("i").addClass("d-none");
            $(this).children("i").removeClass("d-none")
            _cnvr.AplicarConfig(1, false);
            _cnvr.Informar(function () {
                $("#msg_failure").text("Me parece, mostraré un struct.");
                $("#toastsito").toast("show");
            });
        } 
    });

    // -- Generación
    $("#generar").parent().mouseover(function () {
        if ($("#textito").val().trim() === "") {
            _cnvr.Informar(function () {
                $("#msg_failure").text("Oye, primero debes escribir/pegar el texto del script");
                $("#toastsito").toast("show");
            });
            $("#generar").addClass("disabled");
        } else {
            $("#generar").removeClass("disabled");
        }
    });
    $("#generar").click(function () {        
        _cnvr.Interpretar(
            $("#textito").val(),
            function (generado) {
                // Devolverá html!
                $("#salida").empty().append(generado);
            },
            function (mensaje) {
                _cnvr.Informar(function () {
                    $("#msg_failure").text("Hmmm..., " + mensaje);
                    $("#toastsito").toast("show");
                });
            }
         );
    });

    // -- Descargar/Guardar como archivo
    $("#guardar").parent().mouseover(function () {
        if ($("#textito").val().trim() === "") {
            _cnvr.Informar(function () {
                $("#msg_failure").text("Alto ahí, primero debes haber generado el objeto !");
                $("#toastsito").toast("show");
            });
            $("#guardar").addClass("disabled");
        } else {
            $("#guardar").removeClass("disabled");
        }
    });

    $("#guardar").click(function () {
        _cnvr.Descargar(
            function (mensaje) {
                _cnvr.Informar(function () {
                    $("#msg_failure").text("Hmmm..., " + mensaje);
                    $("#toastsito").toast("show");
                });
            });
    });
});